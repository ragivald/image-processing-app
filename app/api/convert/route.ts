export async function POST(request: Request) {
  console.log("[v0] ==================== CONVERT API START ====================")
  console.log("[v0] Request URL:", request.url)
  console.log("[v0] Request method:", request.method)
  console.log("[v0] Request headers:", Object.fromEntries(request.headers.entries()))

  try {
    const body = await request.json()
    console.log("[v0] Request body keys:", Object.keys(body))
    console.log("[v0] Full body structure:", JSON.stringify(body, null, 2).substring(0, 500))

    const { image, format = "jpeg", quality = 90, metadata } = body

    if (!image) {
      console.log("[v0] ERROR: No image provided in request")
      return Response.json({ error: "No image provided" }, { status: 400 })
    }

    console.log("[v0] Image format requested:", format)
    console.log("[v0] Quality setting:", quality)
    console.log("[v0] Metadata provided:", metadata ? "YES" : "NO")
    console.log("[v0] Image string length:", image.length)

    // Extract base64 data
    let base64Data: string
    if (image.startsWith("data:")) {
      base64Data = image.split(",")[1]
      console.log("[v0] Extracted base64 from data URL, length:", base64Data?.length)
    } else {
      base64Data = image
      console.log("[v0] Using plain base64 string, length:", base64Data?.length)
    }

    if (!base64Data || base64Data.length === 0) {
      console.log("[v0] ERROR: Invalid base64 data")
      return Response.json({ error: "Invalid image data" }, { status: 400 })
    }

    // Convert base64 to buffer
    let imageBuffer: Buffer
    try {
      imageBuffer = Buffer.from(base64Data, "base64")
      console.log("[v0] SUCCESS: Buffer created, size:", imageBuffer.length, "bytes")
    } catch (bufferError) {
      console.error("[v0] ERROR: Buffer creation failed:", bufferError)
      return Response.json(
        {
          error: "Invalid base64 encoding",
          details: bufferError instanceof Error ? bufferError.message : "Unknown error",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Sharp module loading...")
    const sharpModule = (await import("sharp")).default
    console.log("[v0] Sharp module loaded successfully")

    const pipeline = sharpModule(imageBuffer, {
      keepExif: true, // Preserve existing EXIF data
      keepIccProfile: true, // Preserve color profile
    })

    // Get image metadata
    const imageMetadata = await pipeline.metadata()
    console.log("[v0] Original image metadata:", JSON.stringify(imageMetadata, null, 2))

    const exifData: Record<string, any> = {}

    if (metadata) {
      console.log("[v0] Building EXIF data from provided metadata...")

      const ifd0: Record<string, any> = {}

      // Only these three fields
      if (metadata.title) ifd0.ImageDescription = metadata.title
      if (metadata.description) ifd0.UserComment = metadata.description
      if (metadata.handle) ifd0.Artist = metadata.handle

      // Add current timestamp
      const now = new Date()
      const dateTimeStr = now.toISOString().replace("T", " ").substring(0, 19)
      ifd0.DateTime = dateTimeStr

      if (Object.keys(ifd0).length > 0) {
        exifData.IFD0 = ifd0
      }

      console.log("[v0] EXIF data built:", JSON.stringify(exifData, null, 2))
    }

    // Convert to specified format
    let outputBuffer: Buffer
    const normalizedFormat = format.toLowerCase()

    switch (normalizedFormat) {
      case "jpeg":
      case "jpg":
        console.log("[v0] Processing as JPEG with quality:", quality)
        console.log("[v0] EXIF data being embedded:", Object.keys(exifData).length > 0 ? "YES" : "NO")

        outputBuffer = await pipeline
          .jpeg({
            quality: Math.min(100, Math.max(1, quality)),
            mozjpeg: true, // Better compression
          })
          .withMetadata(Object.keys(exifData).length > 0 ? { exif: exifData } : {})
          .toBuffer()
        break
      case "webp":
        console.log("[v0] Processing as WebP with quality:", quality)
        outputBuffer = await pipeline
          .webp({ quality: Math.min(100, Math.max(1, quality)) })
          .withMetadata() // Preserve existing metadata for WebP
          .toBuffer()
        break
      case "png":
        console.log("[v0] Processing as PNG")
        outputBuffer = await pipeline
          .png({ compressionLevel: 9 })
          .withMetadata() // Preserve existing metadata for PNG
          .toBuffer()
        break
      default:
        console.log("[v0] ERROR: Invalid format requested:", format)
        return Response.json({ error: `Invalid format '${format}'. Use: jpeg, webp, or png` }, { status: 400 })
    }

    console.log("[v0] SUCCESS: Conversion complete!")
    console.log("[v0] Output buffer size:", outputBuffer.length, "bytes")

    // Convert to base64 for JSON response
    const outputBase64 = outputBuffer.toString("base64")
    const mimeType =
      normalizedFormat === "jpeg" || normalizedFormat === "jpg"
        ? "image/jpeg"
        : normalizedFormat === "webp"
          ? "image/webp"
          : "image/png"

    console.log("[v0] Response MIME type:", mimeType)
    console.log("[v0] Output base64 length:", outputBase64.length)
    console.log("[v0] ==================== CONVERT API SUCCESS ====================")

    return Response.json({
      success: true,
      image: `data:${mimeType};base64,${outputBase64}`,
      imageBase64: outputBase64,
      format: normalizedFormat,
      mimeType: mimeType,
      sizeBytes: outputBuffer.length,
      metadata: metadata || null,
      exifEmbedded: Object.keys(exifData).length > 0,
    })
  } catch (error) {
    console.error("[v0] ==================== CONVERT API ERROR ====================")
    console.error("[v0] Error type:", error?.constructor?.name)
    console.error("[v0] Error message:", error instanceof Error ? error.message : "Unknown error")
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : undefined)
    console.error("[v0] Full error object:", error)

    return Response.json(
      {
        success: false,
        error: "Failed to convert image",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
