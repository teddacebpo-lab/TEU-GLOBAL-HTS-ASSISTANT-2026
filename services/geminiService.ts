import { AiBehavior, AnalysisData } from "../types";

// Convert image data to Gemini-compatible generative part
const fileToGenerativePart = (imageData: { mimeType: string; data: string }) => ({
  inlineData: {
    mimeType: imageData.mimeType,
    data: imageData.data,
  },
});

// Build classification prompt with optional image and expired HTS code instructions
const buildClassificationPrompt = (
  basePrompt: string,
  description: string,
  country: string,
  hasImage: boolean,
  expiredCodes: string[]
) => {
  const imageInstruction = hasImage
    ? "The user has uploaded a product picture. **CRITICAL INSTRUCTION:** Perform OCR and visual analysis on this image. Extract all text (product names, model numbers, specifications, country markings). This must be the primary source for classification; text description is supplementary."
    : "";

  const expiredCodesInstruction = expiredCodes.length > 0
    ? `**Critical Restriction - Expired HTS Codes:** You MUST NOT use the following HTS codes: ${expiredCodes.join(', ')}.`
    : "";

  return `
    ${basePrompt}

    ${expiredCodesInstruction}

    **User Input:**
    - Product Description: "${description}"
    - Country of Origin: "${country}"
    ${imageInstruction}
  `;
};

// Build lookup prompt for a specific HTS code
const buildLookupPrompt = (basePrompt: string, htsCode: string, expiredCodes: string[]) => {
  const expiredCodesInstruction = expiredCodes.length > 0
    ? `**Critical Restriction - Expired HTS Codes:** Do NOT provide info for these HTS codes: ${expiredCodes.join(', ')}.`
    : "";

  return `
    ${basePrompt}

    ${expiredCodesInstruction}

    **CRITICAL ACTION - HTS DIRECT LOOKUP**
    Target HTS Code: "${htsCode}"
    Directives:
    1. Search 2025 HTSUS data for this exact code.
    2. Include full profile (MFN duties, Special rates, trade remedies, PGA flags).
    3. Include analysis metadata block (##ANALYSIS_DATA##).
    4. If invalid, explain and suggest nearest valid heading.
  `;
};

// Process a query through Gemini API with optional streaming
export const processQuery = async (
  query: string,
  country: string,
  imageData: { mimeType: string; data: string } | null,
  viewType: 'classification' | 'lookup',
  classificationPromptTemplate: string,
  lookupPromptTemplate: string,
  expiredHtsCodes: string[],
  aiBehavior: AiBehavior,
  temperature: number,
  onChunk: (text: string) => void,
  addLog: (message: string) => void,
  signal: AbortSignal
): Promise<string> => {
  addLog("processQuery invoked.");

  const prompt = viewType === 'lookup'
    ? buildLookupPrompt(lookupPromptTemplate, query.trim(), expiredHtsCodes)
    : buildClassificationPrompt(classificationPromptTemplate, query, country, !!imageData, expiredHtsCodes);

  const modelName = 'gemini-3-flash-preview';
  addLog(`Using AI model: ${modelName}, View type: ${viewType}`);

  const requestContents = imageData
    ? { parts: [fileToGenerativePart(imageData), { text: prompt }] }
    : prompt;

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: requestContents, config: { temperature }, model: modelName }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.statusText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      if (signal.aborted) throw new DOMException('Aborted by user', 'AbortError');
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        fullText += chunk;
        onChunk(chunk);
      }
    }

    return fullText;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};

// Summarize analysis data into concise executive summary
export const summarizeAnalysis = async (data: AnalysisData): Promise<string> => {
  const contents = `Please provide a concise 2-3 sentence executive summary of this HTS classification analysis. Data: ${JSON.stringify(data)}`;

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, config: {}, model: 'gemini-3-flash-preview' }),
  });

  if (!response.ok) throw new Error('API error during summary');

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fullText += decoder.decode(value, { stream: true });
  }

  return fullText || "Summary unavailable.";
};
