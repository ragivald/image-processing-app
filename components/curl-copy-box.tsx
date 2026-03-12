"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"

interface CurlCopyBoxProps {
  title: string
  description: string
  curlCommand: string
}

export function CurlCopyBox({ title, description, curlCommand }: CurlCopyBoxProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(curlCommand)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border border-[#27272a] bg-card/50 p-6">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="mb-1 text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm leading-relaxed text-white/60">{description}</p>
        </div>
        <Button
          onClick={handleCopy}
          size="sm"
          variant="outline"
          className="shrink-0 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
        >
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-md bg-black/60 p-4 text-xs text-white/90">
        <code>{curlCommand}</code>
      </pre>
    </div>
  )
}
