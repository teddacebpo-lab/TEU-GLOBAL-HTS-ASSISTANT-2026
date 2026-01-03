import { AiBehavior, AnalysisData } from "../types";

const fileToGenerativePart = (imageData: { mimeType: string; data: string }) => ({
  inlineData: {
    mimeType: imageData.mimeType,
    data: imageData.data,
  },
});

const buildClassificationPrompt = (
  basePrompt: string,
  description: string,
  country: string,
  hasImage: boolean,
  expiredCodes: string[]
) => {
  const imageInstruction = hasImage
    ? "The user has uploaded a product picture. **CRITICAL:** Perform OCR and visual analysis on the image. Extract text like product names, model numbers, specs, or origin markings. Use this as primary source for classification; user description is supplementary."
    : "";

  const expiredCodesInstruction = expiredCodes.length > 0
    ? `**Critical Restriction - Expired HTS Codes:**\nDo NOT use any of these HTS codes: ${expiredCodes.join(', ')}.`
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

const buildLookupPrompt = (basePrompt: string, htsCode: string, expiredCodes: string[]) => {
  const expiredCodesInstruction = expiredCodes.length > 0
    ? `**Critical Restriction - Expired HTS Codes:**\nDo NOT provide details for these codes. If asked, mark as expired: ${expiredCodes.join(', ')}.`
    : "";

  return `
${basePrompt}

${expiredCodesInstruction}

**HTS Direct Lookup**
- Target HTS Code: "${htsCode}"
- Instructions:
  1. Provide full 2025 HTSUS profile (MFN, Special Rates, Section 301/232, PGA flags).
  2. Include ##ANALYSIS_DATA## metadata.
  3. If invalid or missing, suggest nearest valid heading.
`;
};

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

  let prompt: string;
  if (viewType === 'lookup') {
    prompt = buildLookupPrompt(lookupPromptTemplate, query.trim(), expiredHtsCodes);
  } else {
    prompt = buildClassificationPrompt(classificationPromptTemplate, query, country, !!imageData, expiredHtsCodes);
  }

  const modelName = 'gemini-3-flash-preview';
  addLog(`Using AI model: ${modelName}. View type: ${viewType}`);

  let requestContents: any;
  if (imageData) {
    requestContents = [
      fileToGenerativePart(imageData),
      { text: prompt },
    ];
  } else {
    requestContents = [{ text: prompt }];
  }

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: requestContents,
        config: { temperature },
        model: modelName,
      }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'API error');
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullResponseText = '';

    while (true) {
      if (signal.aborted) {
        throw new DOMException('Aborted by user', 'AbortError');
      }
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        fullResponseText += chunk;
        onChunk(chunk);
      }
    }

    return fullResponseText;

  } catch (error: any) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};

// Helper to summarize AnalysisData
export const summarizeAnalysis = async (data: AnalysisData): Promise<string> => {
  const contents = `Please provide a concise, high-level summary (2-3 sentences) of this HTS classification analysis: ${JSON.stringify(data)}`;

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ text: contents }],
      config: {},
      model: 'gemini-3-flash-preview',
    }),
  });

  if (!response.ok) {
    throw new Error('API error during summary generation');
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;
  }

  return fullText || "Summary unavailable.";
};
