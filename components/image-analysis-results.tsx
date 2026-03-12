"use client"

import { useState } from "react"
import { FileText, Hash, Loader2, Type, AlignLeft, Copy, Check, RefreshCw, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { ImageAnalysis } from "@/app/page"

interface ImageAnalysisResultsProps {
  analysis: ImageAnalysis | null
  isAnalyzing: boolean
  onAnalysisChange: (analysis: ImageAnalysis) => void
  onRegenerate: () => void // added regenerate callback
}

export function ImageAnalysisResults({
  analysis,
  isAnalyzing,
  onAnalysisChange,
  onRegenerate,
}: ImageAnalysisResultsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleChange = (field: keyof ImageAnalysis, value: string) => {
    if (!analysis) return
    onAnalysisChange({ ...analysis, [field]: value })
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
      onClick={() => copyToClipboard(text, field)}
    >
      {copiedField === field ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  )

  if (isAnalyzing) {
    return (
      <Card className="h-full border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <FileText className="h-5 w-5 text-primary" />
            Analysis Results
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Analyzing image with Gemini 3 Pro...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card className="h-full border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <FileText className="h-5 w-5 text-primary" />
            Analysis Results
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-[400px] items-center justify-center">
          <p className="text-center text-muted-foreground">Upload an image and click analyze to see results</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <FileText className="h-5 w-5 text-primary" />
            Analysis Results
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onRegenerate} className="gap-2 bg-transparent">
            <RefreshCw className="h-4 w-4" />
            Re-generate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title" className="flex items-center gap-2 text-foreground">
            <Type className="h-4 w-4 text-primary" />
            Title
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="title"
              value={analysis.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="border-border bg-input text-foreground"
            />
            <CopyButton text={analysis.title} field="title" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="handle" className="flex items-center gap-2 text-foreground">
            <Hash className="h-4 w-4 text-primary" />
            Handle
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="handle"
              value={analysis.handle}
              onChange={(e) => handleChange("handle", e.target.value)}
              className="border-border bg-input font-mono text-foreground"
            />
            <CopyButton text={analysis.handle} field="handle" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center gap-2 text-foreground">
            <AlignLeft className="h-4 w-4 text-primary" />
            Description
          </Label>
          <div className="flex items-start gap-2">
            <Textarea
              id="description"
              value={analysis.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              className="border-border bg-input text-foreground"
            />
            <CopyButton text={analysis.description} field="description" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="altText" className="flex items-center gap-2 text-foreground">
            <Eye className="h-4 w-4 text-primary" />
            Alt Text (Accessibility)
          </Label>
          <div className="flex items-start gap-2">
            <Textarea
              id="altText"
              value={analysis.altText}
              onChange={(e) => handleChange("altText", e.target.value)}
              rows={2}
              className="border-border bg-input text-foreground"
              placeholder="Brief description for screen readers"
            />
            <CopyButton text={analysis.altText} field="altText" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="extractedText" className="flex items-center gap-2 text-foreground">
            <FileText className="h-4 w-4 text-primary" />
            Extracted Text (OCR)
          </Label>
          <div className="flex items-start gap-2">
            <Textarea
              id="extractedText"
              value={analysis.extractedText}
              onChange={(e) => handleChange("extractedText", e.target.value)}
              rows={4}
              className="border-border bg-input font-mono text-sm text-foreground"
              placeholder="No text detected in image"
            />
            <CopyButton text={analysis.extractedText} field="extractedText" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
