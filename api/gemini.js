// api/gemini.js
import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract input from request body
  const { contents, config, model } = req.body;

  // Validate contents
  if (!contents || (Array.isArray(contents) && contents.length === 0)) {
    return res.status(400).json({ error: 'Contents must be a non-empty array or object' });
  }

  // Check for API key
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    // Start streaming from Gemini API
    const responseStream = await ai.models.generateContentStream({
      model: model || 'gemini-2.5-flash',
      contents,
      config,
    });

    // Set headers for streaming text
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    });

    // Stream each chunk to the client
    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }

    // End response
    res.end();

  } catch (error) {
    console.error('Gemini API error:', error);
    const message = error?.message || 'Internal Server Error';
    res.status(500).json({ error: message });
  }
}