"use client"

import { useState } from "react"
import { ImageUploader } from "@/components/image-uploader"
import { ImageAnalysisResults } from "@/components/image-analysis-results"
import { ImageConverter } from "@/components/image-converter"
import { WebGLShader } from "@/components/ui/web-gl-shader"
import { CurlCopyBox } from "@/components/curl-copy-box"

export interface ImageAnalysis {
  title: string
  description: string
  altText: string
  extractedText: string
  handle: string
}

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleImageUpload = (file: File, dataUrl: string) => {
    setUploadedImage(dataUrl)
    setImageFile(file)
    setAnalysis(null)
  }

  const handleAnalyze = async () => {
    if (!uploadedImage) return

    setIsAnalyzing(true)
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: uploadedImage }),
      })

      if (!response.ok) throw new Error("Analysis failed")

      const data = await response.json()
      setAnalysis(data)
    } catch (error) {
      console.error("Analysis error:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleClear = () => {
    setUploadedImage(null)
    setImageFile(null)
    setAnalysis(null)
  }

  const analyzeCurlCommand = `curl -X POST https://your-domain.vercel.app/api/analyze \\
  -H "Content-Type: application/json" \\
  -d '{
    "image": "{{$json.imageBase64}}"
  }'`

  const convertCurlCommand = `curl -X POST https://your-domain.vercel.app/api/convert \\
  -H "Content-Type: application/json" \\
  -d '{
    "image": "{{$json.imageBase64}}",
    "format": "jpeg",
    "quality": 90,
    "metadata": {
      "title": "{{$json.title}}",
      "description": "{{$json.description}}",
      "handle": "{{$json.handle}}"
    }
  }'`

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden">
      <WebGLShader />

      <div className="relative w-full px-4 py-8">
        <div className="relative mx-auto w-full max-w-4xl border border-[#27272a] p-2">
          <main className="relative overflow-hidden border border-[#27272a] bg-black/20 backdrop-blur-sm">
            {/* Header Section */}
            <header className="border-b border-[#27272a] px-6 py-12 text-center">
              <h1 className="mb-4 text-center text-5xl font-extrabold tracking-tighter text-white md:text-[clamp(3rem,6vw,5rem)]">
                Image Processing API
              </h1>
              <p className="mx-auto max-w-2xl px-6 text-center text-base leading-relaxed text-white/70 md:text-lg">
                Powerful REST API for AI-powered image analysis and format conversion with metadata management
              </p>
              <div className="my-6 flex items-center justify-center gap-1">
                <span className="relative flex h-3 w-3 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                </span>
                <p className="text-xs text-primary">API Ready</p>
              </div>
            </header>

            <div className="space-y-6 p-6">
              <div className="space-y-6">
                <CurlCopyBox
                  title="POST /api/analyze"
                  description="AI-powered image analysis with Gemini. Returns: title, description, altText, extractedText, handle."
                  curlCommand={analyzeCurlCommand}
                />

                <CurlCopyBox
                  title="POST /api/convert"
                  description="Convert images with metadata. Returns: image (data URL), imageBase64 (raw), format, mimeType, sizeBytes."
                  curlCommand={convertCurlCommand}
                />
              </div>

              {/* Features */}
              <div className="rounded-lg border border-[#27272a] bg-card/50 p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">Features</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                    <div>
                      <p className="text-sm font-medium text-white">AI-Powered Analysis</p>
                      <p className="text-xs text-white/60">Gemini 3 Pro image understanding</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                    <div>
                      <p className="text-sm font-medium text-white">OCR Text Extraction</p>
                      <p className="text-xs text-white/60">Extract all visible text</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                    <div>
                      <p className="text-sm font-medium text-white">Format Conversion</p>
                      <p className="text-xs text-white/60">JPEG, WebP, PNG support</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                    <div>
                      <p className="text-sm font-medium text-white">Metadata Management</p>
                      <p className="text-xs text-white/60">Embed custom EXIF data</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documentation Link */}
              <div className="rounded-lg border border-[#27272a] bg-primary/10 p-4 text-center">
                <p className="text-sm text-white/90">
                  View full API documentation in{" "}
                  <code className="rounded bg-black/40 px-2 py-1 text-xs text-primary">API.md</code>
                </p>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid gap-6 p-6 lg:grid-cols-2">
              {/* Left Column - Upload & Convert */}
              <div className="space-y-6">
                <ImageUploader
                  onImageUpload={handleImageUpload}
                  uploadedImage={uploadedImage}
                  onClear={handleClear}
                  onAnalyze={handleAnalyze}
                  isAnalyzing={isAnalyzing}
                />

                {uploadedImage && <ImageConverter imageDataUrl={uploadedImage} analysis={analysis} />}
              </div>

              {/* Right Column - Analysis Results */}
              <div>
                <ImageAnalysisResults
                  analysis={analysis}
                  isAnalyzing={isAnalyzing}
                  onAnalysisChange={setAnalysis}
                  onRegenerate={handleAnalyze}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
