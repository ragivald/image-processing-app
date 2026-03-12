"use client"

import { useState } from "react"
import { Download, RefreshCw, FileImage, AlertCircle, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import type { ImageAnalysis } from "@/app/page"
// @ts-ignore - piexifjs doesn't have type definitions
import piexif from "piexifjs"

interface ImageConverterProps {
  imageDataUrl: string
  analysis: ImageAnalysis | null
}

type OutputFormat = "jpeg" | "webp" | "png"

export function ImageConverter({ imageDataUrl, analysis }: ImageConverterProps) {
  const [format, setFormat] = useState<OutputFormat>("jpeg")
  const [quality, setQuality] = useState(90)
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDisabled = !analysis

  const handleConvert = async () => {
    if (!analysis) return

    setIsConverting(true)
    setError(null)

    try {
      console.log("[v0] Starting conversion - Format:", format, "Quality:", quality)

      const response = await fetch(imageDataUrl)
      const blob = await response.blob()

      const arrayBuffer = await blob.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      const img = new Image()
      img.crossOrigin = "anonymous"

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageDataUrl
      })

      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not get canvas context")

      // Drawing to canvas automatically strips all EXIF
      ctx.drawImage(img, 0, 0)
      console.log("[v0] Image drawn to canvas, original EXIF stripped")

      const qualityValue = format === "png" ? 1 : quality / 100
      const mimeType = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png"

      const outputBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error("Failed to create blob"))
          },
          mimeType,
          qualityValue,
        )
      })

      console.log("[v0] Canvas converted to", format, "format blob")

      let finalBlob = outputBlob

      if (format === "jpeg") {
        try {
          console.log("[v0] Injecting EXIF metadata into JPEG blob...")

          const reader = new FileReader()
          const dataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(outputBlob)
          })

          // Create EXIF object with analysis data
          const exifObj: any = {
            "0th": {},
            Exif: {},
          }

          // Add comprehensive metadata
          const combinedDescription = `${analysis.title} - ${analysis.description}`
          exifObj["0th"][piexif.ImageIFD.ImageDescription] = combinedDescription
          exifObj["0th"][piexif.ImageIFD.Make] = analysis.title
          exifObj["0th"][piexif.ImageIFD.Model] = analysis.handle
          exifObj["0th"][piexif.ImageIFD.Software] = "Image Processor"
          exifObj["0th"][piexif.ImageIFD.Copyright] = `© ${new Date().getFullYear()}`

          // Windows-compatible XP tags
          exifObj["0th"][piexif.ImageIFD.XPTitle] = stringToUint16Array(analysis.title)
          exifObj["0th"][piexif.ImageIFD.XPComment] = stringToUint16Array(combinedDescription)
          exifObj["0th"][piexif.ImageIFD.XPSubject] = stringToUint16Array(analysis.handle)
          if (analysis.extractedText) {
            exifObj["0th"][piexif.ImageIFD.XPKeywords] = stringToUint16Array(analysis.extractedText)
          }

          // Exif UserComment for longer description
          exifObj["Exif"][piexif.ExifIFD.UserComment] = analysis.description

          console.log("[v0] EXIF object created with fields:", Object.keys(exifObj["0th"]).length)

          // Dump and insert EXIF
          const exifBytes = piexif.dump(exifObj)
          console.log("[v0] EXIF bytes generated, size:", exifBytes.length)

          const newDataUrl = piexif.insert(exifBytes, dataUrl)
          console.log("[v0] piexif.insert() completed")

          const base64Data = newDataUrl.split(",")[1]
          const binaryStr = atob(base64Data)
          const bytes = new Uint8Array(binaryStr.length)
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i)
          }
          finalBlob = new Blob([bytes], { type: "image/jpeg" })

          console.log("[v0] EXIF metadata successfully embedded in JPEG blob")
        } catch (exifError) {
          console.error("[v0] EXIF injection failed:", exifError)
          console.warn("[v0] Proceeding with JPEG without EXIF metadata")
        }
      }

      const filename = `${analysis.handle}.${format === "jpeg" ? "jpg" : format}`
      const url = URL.createObjectURL(finalBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      console.log("[v0] Download triggered successfully:", filename)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Conversion failed"
      console.error("[v0] Conversion error:", errorMessage, err)
      setError(errorMessage)
    } finally {
      setIsConverting(false)
    }
  }

  const showMetadataWarning = format !== "jpeg" && analysis

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <FileImage className="h-5 w-5 text-primary" />
          Convert Image
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {isDisabled && (
          <div className="flex items-center gap-2 rounded-md bg-muted p-4 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Upload an image and run analysis to unlock conversion</span>
          </div>
        )}

        <div className="space-y-2">
          <Label className={isDisabled ? "text-muted-foreground" : "text-foreground"}>Output Format</Label>
          <Select value={format} onValueChange={(v) => setFormat(v as OutputFormat)} disabled={isDisabled}>
            <SelectTrigger className="border-border bg-input text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-popover">
              <SelectItem value="jpeg">JPEG (with Title & Description metadata)</SelectItem>
              <SelectItem value="webp">WebP</SelectItem>
              <SelectItem value="png">PNG</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {format !== "png" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className={isDisabled ? "text-muted-foreground" : "text-foreground"}>Quality</Label>
              <span className="text-sm text-muted-foreground">{quality}%</span>
            </div>
            <Slider
              value={[quality]}
              onValueChange={([v]) => setQuality(v)}
              min={60}
              max={100}
              step={5}
              className="py-2"
              disabled={isDisabled}
            />
          </div>
        )}

        {showMetadataWarning && (
          <div className="flex items-start gap-2 rounded-md bg-amber-500/10 p-3 text-sm text-amber-500">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {format === "webp" ? "WebP" : "PNG"} does not support EXIF metadata. Use JPEG format to embed title,
              description, and other metadata from analysis.
            </span>
          </div>
        )}

        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <Button
          onClick={handleConvert}
          disabled={isConverting || isDisabled}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isConverting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Converting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Convert & Download
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          {format === "jpeg"
            ? "Strips original EXIF and embeds analysis data (title, description, handle, OCR text) as EXIF metadata"
            : "Strips all metadata and converts to clean image (no metadata embedding support)"}
        </p>
      </CardContent>
    </Card>
  )
}

function stringToUint16Array(str: string): number[] {
  const arr: number[] = []
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i)
    arr.push(charCode & 0xff)
    arr.push((charCode >> 8) & 0xff)
  }
  arr.push(0)
  arr.push(0)
  return arr
}
