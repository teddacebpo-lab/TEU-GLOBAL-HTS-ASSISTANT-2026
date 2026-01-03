
import { AiBehavior, AnalysisData } from "../types";

const fileToGenerativePart = (imageData: { mimeType: string; data: string }) => {
  return {
    inlineData: {
      mimeType: imageData.mimeType,
      data: imageData.data,
    },
  };
};

const buildClassificationPrompt = (
  basePrompt: string,
  description: string,
  country: string,
  hasImage: boolean,
  expiredCodes: string[]
) => {
  const imageInstruction = hasImage 
    ? "The user has uploaded a product picture. **CRITICAL INSTRUCTION:** You MUST perform Optical Character Recognition (OCR) and visual analysis on this image. Extract any and all text, such as product names, model numbers, specifications, or country of origin markings. This extracted text, combined with the visual details of the image, MUST be used as the primary source for the product description in your classification analysis. The user-provided text description should be considered supplementary." 
    : "";
  
  const expiredCodesInstruction = expiredCodes.length > 0
    ? `**Critical Restriction - Expired HTS Codes:**\nYou MUST NOT use any of the following HTS codes in your response: ${expiredCodes.join(', ')}.`
    : "";

  let finalPrompt = basePrompt;
  finalPrompt += `\n\n${expiredCodesInstruction}`;
  finalPrompt += `
    \n\n**User Input:**
    *   **Product Description:** "${description}"
    *   **Country of Origin:** "${country}"
    *   ${imageInstruction}
  `;
  
  return finalPrompt;
};

const buildLookupPrompt = (basePrompt: string, htsCode: string, expiredCodes: string[]) => {
    const expiredCodesInstruction = expiredCodes.length > 0
    ? `**Critical Restriction - Expired HTS Codes:**\nYou MUST NOT provide details for any of the following HTS codes. If the user asks for one, state that it is expired: ${expiredCodes.join(', ')}.`
    : "";

    let finalPrompt = basePrompt;
    finalPrompt += `\n\n${expiredCodesInstruction}`;
    finalPrompt += `
      \n\n**CRITICAL ACTION - HTS DIRECT LOOKUP:**
      The user is requesting a definitive profile for HTS Code: **${htsCode}**.
      
      **Directives:**
      1. Search your knowledge base for 2025 HTSUS data for this exact code: "${htsCode}".
      2. Provide the full profile including General MFN duties, Special rates (USMCA etc), Section 301/232 trade remedies, and PGA flags.
      3. You MUST include the analysis metadata block (##ANALYSIS_DATA##) containing the stats for this specific code.
      4. If the code is not in the 2025 schedule or is incorrect, explain why and suggest the nearest valid heading.
      
      **User Input:**
      *   **Target HTS Code:** "${htsCode}"
    `;
    return finalPrompt;
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

  let prompt;
  if (viewType === 'lookup') {
    prompt = buildLookupPrompt(lookupPromptTemplate, query.trim(), expiredHtsCodes);
  } else {
    prompt = buildClassificationPrompt(classificationPromptTemplate, query, country, !!imageData, expiredHtsCodes);
  }

  const modelName = 'gemini-3-flash-preview';
  addLog(`Using AI model: ${modelName}. View type: ${viewType}`);

  let requestContents: any;

  if (imageData) {
    const imagePart = fileToGenerativePart(imageData);
    const textPart = { text: prompt };
    requestContents = { parts: [imagePart, textPart] };
  } else {
    requestContents = prompt;
  }

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: requestContents,
        config: { temperature: temperature },
        model: modelName
      }),
      signal: signal
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

  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};

export const summarizeAnalysis = async (data: AnalysisData): Promise<string> => {
  const contents = `Please provide a concise, high-level executive summary (2-3 sentences) of this HTS classification analysis for a trade compliance report. Data: ${JSON.stringify(data)}`;

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: contents,
      config: {},
      model: 'gemini-3-flash-preview'
    })
  });

  if (!response.ok) {
    throw new Error('API error');
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

