import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({
	apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export async function POST(request: Request) {
	try {
		const { image } = await request.json()

		if (!image) {
			return Response.json({ error: 'No image provided' }, { status: 400 })
		}

		// Extract base64 data from data URL
		const base64Data = image.split(',')[1]
		const mimeType = image.split(';')[0].split(':')[1]

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
  "extractedText": "All text visible in the image (OCR). If no text is visible, use empty string",
  "handle": "a-url-friendly-handle-slug-lowercase-with-hyphens"
}

Be thorough with the text extraction - capture all visible text including small text, watermarks, labels, etc.`,
						},
					],
				},
			],
		})

		// Parse the response text as JSON
		const responseText =
			response.candidates?.[0]?.content?.parts?.[0]?.text || ''

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

		const analysisResult = JSON.parse(cleanedText)

		return Response.json(analysisResult)
	} catch (error) {
		console.error('Analysis error:', error)
		return Response.json({ error: 'Failed to analyze image' }, { status: 500 })
	}
}
