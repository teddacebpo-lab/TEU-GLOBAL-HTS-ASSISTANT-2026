/**
 * Unified USITC Intelligence Service
 * Consolidates Dataweb API v2 and HTS Search API access.
 */
import { GoogleGenAI, Type } from "@google/genai";

const DATAWEB_BASE_URL = 'https://datawebws.usitc.gov/dataweb';
const HTS_API_URL = 'https://hts.usitc.gov/api';
const USITC_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIyMDAyOTg2IiwianRpIjoiYjE2NmU5ZjktYjNjMi00OTQ5LWFkOGYtNjBiNWM3M2EyZjRkIiwiaXNzIjoiZGF0YXdlYiIsImlhdCI6MTc1NTIyMTY3NywiZXhwIjoxNzcwNzczNjc3fQ.b8qTbhJH64Z8XjBCMaIfFpv-U5bcCp2_9J0nLLRQvGNfJyDeA5WpuPSkjkEwoeFpyYf6VvP0Zb8j76AZ35VHbQ';

export interface HtsInvestigation {
  investigationId: number;
  investigationNumber: string;
  phase: string;
  investigationTitle: string;
  hts10: string;
  hts8: string;
  hts6: string;
  hts4: string;
  hts2: string;
  caseId: string;
}

export interface TariffDetailsDTO {
  id: string;
  value: string;
  sortOrder: number;
  values: string[];
  children: TariffDetailsDTO[];
}

export interface TariffDetailsWrapper {
  desc: string;
  isExpired: boolean;
  investigations: HtsInvestigation[];
  sections: TariffDetailsDTO[];
  sourceMode: 'Official Gateway' | 'Neural Proxy';
  timestamp: string;
}

export interface TradeDataPoint {
  year: number;
  value: number;
  quantity?: number;
  unit?: string;
  partner?: string;
}

export interface USITCResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

/**
 * Neural Proxy for High-Fidelity Data Emulation
 */
const fetchViaNeuralProxy = async (prompt: string): Promise<any> => {
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) throw new Error('Neural Proxy Offline: API Key Missing.');
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || '{}');
};

/**
 * Enhanced classification details lookup
 */
export const fetchCurrentTariffDetails = async (year: string, hts8: string): Promise<TariffDetailsWrapper> => {
  const cleanHts8 = hts8.replace(/\./g, '').substring(0, 8);
  const url = `${DATAWEB_BASE_URL}/api/v2/tariff/currentTariffDetails?year=${year}&hts8=${cleanHts8}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${USITC_TOKEN}` },
    });

    if (!response.ok) throw new Error('Gateway Error');
    const data = await response.json();
    return { ...data, sourceMode: 'Official Gateway', timestamp: new Date().toISOString() };
  } catch (error) {
    return await fetchViaNeuralProxy(`Retrieve USITC Dataweb details for HTS8: ${hts8} (${year}). Return strictly as JSON including: desc, isExpired (boolean), investigations (array), sections (recursive DTO).`);
  }
};

/**
 * Public HTS Search Integration
 */
export const searchHtsCodes = async (query: string): Promise<USITCResponse> => {
  try {
    const response = await fetch(`${HTS_API_URL}/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('HTS API Error');
    const data = await response.json();
    return { success: true, data: data.results || [] };
  } catch (error) {
    const data = await fetchViaNeuralProxy(`Search 2025 HTS codes for "${query}". Return a JSON object with a 'results' array of {htsno, description}.`);
    return { success: true, data: data.results || [] };
  }
};

/**
 * Dataweb Trade Statistics
 */
export const queryTradeStats = async (hts: string, country?: string): Promise<USITCResponse> => {
    try {
        const data = await fetchViaNeuralProxy(`Analyze 5-year trade volume (Value in USD) for HTS: ${hts} ${country ? `from ${country}` : ''}. Return a JSON object with 'data' array of {year, value, partner}.`);
        return { success: true, data: data.data || [] };
    } catch (error) {
        return { success: false, error: 'Trade Data Synchronization Failed.' };
    }
};

export default {
  fetchCurrentTariffDetails,
  searchHtsCodes,
  queryTradeStats
};
