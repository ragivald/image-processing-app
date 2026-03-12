import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({
	apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export async function POST(request: Request) {
	try {
		console.log('[v0] Analyze API called')

		const body = await request.json()
		console.log('[v0] Request body keys:', Object.keys(body))

		const { image } = body

		if (!image) {
			console.log('[v0] No image provided in request')
			return Response.json({ error: 'No image provided' }, { status: 400 })
		}

		// Support both base64 data URLs and plain base64
		let base64Data: string
		let mimeType: string

		if (image.startsWith('data:')) {
			base64Data = image.split(',')[1]
			mimeType = image.split(';')[0].split(':')[1]
			console.log('[v0] Data URL detected, mime type:', mimeType)
		} else {
			// Plain base64 string, assume JPEG
			base64Data = image
			mimeType = 'image/jpeg'
			console.log('[v0] Plain base64 detected, assuming JPEG')
		}

		if (!base64Data || base64Data.length === 0) {
			console.log('[v0] Invalid base64 data')
			return Response.json({ error: 'Invalid image data' }, { status: 400 })
		}

		console.log('[v0] Calling Gemini API for analysis')
		const response = await ai.models.generateContent({
			model: 'gemini-3.1-flash-image-preview', //"gemini-3-pro-image-preview", //
			contents: [
				{
					role: 'user',
					parts: [
						{
							inlineData: {
								mimeType: mimeType,
								data: base64Data,
							},
						},
						{
							text: `Analyze this image and respond with ONLY a valid JSON object (no markdown, no code blocks) with these exact keys:
{
  "title": "A concise, descriptive title for the image (good for SEO)",
  "description": "A detailed description of what the image contains",
  "altText": "A concise alt text description for accessibility (describe what's in the image for screen readers, 1-2 sentences max)",
  "extractedText": "All text visible in the image (OCR). If no text is visible, use empty string",
  "handle": "a-url-friendly-handle-slug-lowercase-with-hyphens"
}

Be thorough with the text extraction - capture all visible text including small text, watermarks, labels, etc.
The altText should be brief and descriptive for accessibility purposes.`,
						},
					],
				},
			],
		})

		console.log('[v0] Gemini API response received')
		const responseText =
			response.candidates?.[0]?.content?.parts?.[0]?.text || ''
		console.log('[v0] Response text length:', responseText.length)

		// Clean up the response - remove markdown code blocks if present
		let cleanedText = responseText.trim()
		if (cleanedText.startsWith('```json')) {
			cleanedText = cleanedText.slice(7)
		} else if (cleanedText.startsWith('```')) {
			cleanedText = cleanedText.slice(3)
		}
		if (cleanedText.endsWith('```')) {
			cleanedText = cleanedText.slice(0, -3)
		}
		cleanedText = cleanedText.trim()

		console.log('[v0] Parsing JSON response')
		const analysisResult = JSON.parse(cleanedText)
		console.log('[v0] Analysis successful')

		return Response.json({
			success: true,
			data: analysisResult,
		})
	} catch (error) {
		console.error('[v0] Analysis error:', error)
		return Response.json(
			{
				success: false,
				error: 'Failed to analyze image',
				message: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
			},
			{ status: 500 },
		)
	}
}
