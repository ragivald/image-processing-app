import sharp from "sharp"
import fs from "fs"

// This script demonstrates the proper way to add EXIF metadata using Sharp
// It's included as a reference for how the conversion should work

async function addMetadata(
  inputPath: string,
  outputPath: string,
  metadata: {
    title: string
    description: string
    handle: string
    extractedText: string
  },
) {
  try {
    // Read the image
    const imageBuffer = fs.readFileSync(inputPath)

    // Step 1: Strip all existing EXIF data
    const cleanBuffer = await sharp(imageBuffer)
      .rotate() // Auto-rotates and strips EXIF
      .toBuffer()

    // Step 2: Add new EXIF metadata
    const outputBuffer = await sharp(cleanBuffer)
      .withMetadata({
        exif: {
          IFD0: {
            ImageDescription: `${metadata.title} - ${metadata.description}`,
            Make: metadata.title,
            Model: metadata.handle,
            Software: "Image Processor",
            Copyright: metadata.handle,
          },
        },
      })
      .jpeg({ quality: 90 })
      .toBuffer()

    fs.writeFileSync(outputPath, outputBuffer)
    console.log("Metadata added successfully")
  } catch (error) {
    console.error("Error adding metadata:", error)
  }
}

// Example usage:
// addMetadata('input.jpg', 'output.jpg', { title: 'Test', description: 'Description', handle: 'test-handle', extractedText: 'OCR text' })
