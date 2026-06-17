import { GoogleGenAI, GenerateContentParameters } from '@google/genai';

// Configuration
const VERTEX_PROJECT_ID = process.env.VERTEX_PROJECT_ID || 'gen-lang-client-0591001769';
const VERTEX_LOCATION = process.env.VERTEX_LOCATION || 'us-central1';

// Available models
export const VERTEX_MODELS = {
  // Preview models
  'gemini-3.1-pro-preview': { contextWindow: 1048576, supportsMultimodal: true, preview: true },
  'gemini-3-pro-preview': { contextWindow: 1048576, supportsMultimodal: true, preview: true },
  'gemini-3-pro-image-preview': { contextWindow: 1048576, supportsMultimodal: true, preview: true, supportsImageGen: true },
  'gemini-3-flash-preview': { contextWindow: 1048576, supportsMultimodal: true, preview: true },
  'gemini-3.1-flash-preview': { contextWindow: 1048576, supportsMultimodal: true, preview: true },
  'gemini-3.1-flash-lite-preview': { contextWindow: 1048576, supportsMultimodal: true, preview: true },
  'gemini-2.5-flash-image': { contextWindow: 1048576, supportsMultimodal: true, preview: false, supportsImageGen: true },
  'gemini-3.1-pro-preview-customtools': { contextWindow: 1048576, supportsMultimodal: true, preview: true, supportsTools: true },

  // GA models
  'gemini-2.5-pro': { contextWindow: 1048576, supportsMultimodal: true, preview: false },
  'gemini-2.5-flash': { contextWindow: 1048576, supportsMultimodal: true, preview: false },
  'gemini-2.5-flash-lite': { contextWindow: 1048576, supportsMultimodal: true, preview: false },
  'gemini-2.0-flash': { contextWindow: 1048576, supportsMultimodal: true, preview: false },
  'gemini-2.0-flash-lite': { contextWindow: 1048576, supportsMultimodal: true, preview: false },
} as const;

export type VertexModelId = keyof typeof VERTEX_MODELS;

// Singleton instance
let genAIInstance: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAIInstance) {
    const rawLocation = process.env.VERTEX_LOCATION || 'us-central1';
    const location = rawLocation === 'global' ? 'us-central1' : rawLocation;

    genAIInstance = new GoogleGenAI({
      vertexai: true,
      project: process.env.VERTEX_PROJECT_ID || 'gen-lang-client-0591001769',
      location: location,
    });
  }
  return genAIInstance;
}

export interface VertexGenerateOptions {
  model?: VertexModelId;
  contents: {
    role?: string;
    parts: {
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string;
      };
      fileData?: {
        mimeType: string;
        fileUri: string;
      };
    }[];
  }[];
  systemInstruction?: {
    parts: { text: string }[];
  };
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
    responseMimeType?: string;
  };
  safetySettings?: {
    category: string;
    threshold: string;
  }[];
}

export interface VertexGenerateResult {
  candidates?: {
    content: {
      role: string;
      parts: { text?: string }[];
    };
    finishReason: string;
  }[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  modelVersion?: string;
  error?: string;
}

class VertexService {
  private projectId: string;
  private location: string;

  constructor() {
    this.projectId = VERTEX_PROJECT_ID;
    this.location = VERTEX_LOCATION;
  }

  /**
   * Call Vertex AI with system prompt + conversation history + current message
   */
  async callVertex(systemPrompt: string, userMessage: string, history: { role: 'user' | 'assistant'; content: string }[] = []): Promise<string> {
    // Vertex uses 'model' for assistant role
    const contents = [
      ...history.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      { role: 'user', parts: [{ text: userMessage }] }
    ];

    const result = await this.generateContent({
      model: 'gemini-2.5-flash',
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
    });

    if (result.error) {
      throw new Error(`VERTEX_ERROR: ${result.error}`);
    }

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('VERTEX_NO_RESPONSE');
    }

    return text;
  }

  /**
   * Generate content using Vertex AI Gemini models
   */
  async generateContent(options: VertexGenerateOptions): Promise<VertexGenerateResult> {
    const modelId = options.model || 'gemini-2.5-flash';
    const ai = getGenAI();

    try {
      // Clean up config to avoid sending undefined values
      const cleanConfig = options.generationConfig ? Object.fromEntries(
        Object.entries({
          temperature: options.generationConfig.temperature,
          topP: options.generationConfig.topP,
          topK: options.generationConfig.topK,
          maxOutputTokens: options.generationConfig.maxOutputTokens,
          stopSequences: options.generationConfig.stopSequences,
          responseMimeType: options.generationConfig.responseMimeType,
        }).filter(([_, v]) => v !== undefined)
      ) : undefined;

      // Build request parameters
      const requestParams: GenerateContentParameters = {
        model: modelId,
        contents: options.contents as any,
      };

      requestParams.config = cleanConfig ? { ...cleanConfig } : {};

      if (options.systemInstruction) {
        requestParams.config.systemInstruction = {
          parts: options.systemInstruction.parts,
        } as any;
      }

      if (options.safetySettings && options.safetySettings.length > 0) {
        requestParams.config.safetySettings = options.safetySettings as any;
      }

      if (Object.keys(requestParams.config).length === 0) {
        delete requestParams.config;
      }

      const result = await ai.models.generateContent(requestParams);

      return {
        candidates: result.candidates?.map(candidate => ({
          content: {
            role: candidate.content?.role || 'model',
            parts: candidate.content?.parts?.map(part => ({
              text: part.text,
            })) || [],
          },
          finishReason: candidate.finishReason || 'STOP',
        })),
        usageMetadata: result.usageMetadata ? {
          promptTokenCount: result.usageMetadata.promptTokenCount || 0,
          candidatesTokenCount: result.usageMetadata.candidatesTokenCount || 0,
          totalTokenCount: result.usageMetadata.totalTokenCount || 0,
        } : undefined,
      };
    } catch (error: any) {
      console.error(`[VertexService] Error generating content with @google/genai, falling back to REST:`, error?.message || error);

      // Fallback to Gemini REST API — GOOGLE_API_KEY has AIza format (valid for REST);
      // GEMINI_API_KEY uses AQ. format (OAuth token, invalid for this endpoint)
      const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
      if (apiKey) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

          const payload = {
            system_instruction: options.systemInstruction,
            contents: options.contents,
            generationConfig: options.generationConfig,
            safetySettings: options.safetySettings,
          };

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Gemini API Error ${res.status}: ${errorText}`);
          }

          const json: any = await res.json();
          return {
            candidates: json.candidates?.map((c: any) => ({
              content: c.content,
              finishReason: c.finishReason || 'STOP',
            })),
            usageMetadata: json.usageMetadata,
          };
        } catch (restError: any) {
          console.error(`[VertexService] REST API fallback also failed:`, restError?.message || restError);
          return { error: restError?.message || 'REST API fallback failed' };
        }
      }

      // Parse error response
      if (error?.response?.data?.error) {
        return {
          error: error.response.data.error.message || 'Vertex AI error',
        };
      }

      return {
        error: error?.message || 'Unknown error during generation',
      };
    }
  }

  /**
   * Stream generate content
   */
  async *streamGenerateContent(options: VertexGenerateOptions): AsyncGenerator<string> {
    const modelId = options.model || 'gemini-2.5-flash';
    const ai = getGenAI();

    const requestParams: GenerateContentParameters = {
      model: modelId,
      contents: options.contents as any,
    };

    requestParams.config = {};

    if (options.systemInstruction) {
      requestParams.config.systemInstruction = {
        parts: options.systemInstruction.parts,
      } as any;
    }

    if (options.generationConfig) {
      Object.assign(requestParams.config, {
        temperature: options.generationConfig.temperature,
        topP: options.generationConfig.topP,
        topK: options.generationConfig.topK,
        maxOutputTokens: options.generationConfig.maxOutputTokens,
        stopSequences: options.generationConfig.stopSequences,
      });
    }

    if (Object.keys(requestParams.config).length === 0) {
      delete requestParams.config;
    }

    const streamResult = await ai.models.generateContentStream(requestParams);

    for await (const chunk of streamResult) {
      const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        yield text;
      }
    }
  }

  /**
   * Get list of available models
   */
  getAvailableModels() {
    return Object.entries(VERTEX_MODELS).map(([id, config]) => ({
      id,
      ...config,
    }));
  }

  /**
   * Check if model exists
   */
  isModelAvailable(modelId: string): boolean {
    return modelId in VERTEX_MODELS;
  }

  /**
   * Get model info
   */
  getModelInfo(modelId: string) {
    return VERTEX_MODELS[modelId as VertexModelId] || null;
  }
}

// Export singleton
export const vertexService = new VertexService();

export default vertexService;