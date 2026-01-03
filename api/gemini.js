import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract input from request body
  const { contents, config, model } = req.body;
  if (!contents || !Array.isArray(contents) || contents.length === 0) {
    return res.status(400).json({ error: 'Contents must be a non-empty array' });
  }

  // Check API key
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    // Stream response from Gemini API
    const responseStream = await ai.models.generateContentStream({
      model: model || 'gemini-3-flash-preview',
      contents,
      config,
    });

    // Set headers for streaming
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    });

    // Stream chunks to client
    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }

    res.end();
  } catch (err) {
    console.error('Gemini API error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
