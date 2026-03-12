"use client"

import type React from "react"

import { useCallback, useRef, useState } from "react"
import { Upload, X, Sparkles, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ImageUploaderProps {
  onImageUpload: (file: File, dataUrl: string) => void
  uploadedImage: string | null
  onClear: () => void
  onAnalyze: () => void
  isAnalyzing: boolean
}

export function ImageUploader({ onImageUpload, uploadedImage, onClear, onAnalyze, isAnalyzing }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        onImageUpload(file, dataUrl)
      }
      reader.readAsDataURL(file)
    },
    [onImageUpload],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <ImageIcon className="h-5 w-5 text-primary" />
          Upload Image
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!uploadedImage ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50 hover:bg-secondary/50"
            }`}
          >
            <Upload className={`mb-4 h-12 w-12 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
            <p className="mb-2 text-lg font-medium text-foreground">Drop your image here</p>
            <p className="text-sm text-muted-foreground">or click to browse files</p>
            <p className="mt-2 text-xs text-muted-foreground">Supports JPEG, JPG, PNG</p>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleInputChange} className="hidden" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg border border-border">
              <img
                src={uploadedImage || "/placeholder.svg"}
                alt="Uploaded preview"
                className="h-auto max-h-[300px] w-full object-contain"
              />
              <Button variant="destructive" size="icon" className="absolute right-2 top-2" onClick={onClear}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isAnalyzing ? "Analyzing with Gemini 3 Pro..." : "Analyze Image"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
