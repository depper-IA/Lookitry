import { VertexAI, SafetySetting, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';

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
let vertexAIInstance: VertexAI | null = null;

function getVertexAI(): VertexAI {
  if (!vertexAIInstance) {
    vertexAIInstance = new VertexAI({
      project: VERTEX_PROJECT_ID,
      location: VERTEX_LOCATION,
    });
  }
  return vertexAIInstance;
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
   * Generate content using Vertex AI Gemini models
   */
  async generateContent(options: VertexGenerateOptions): Promise<VertexGenerateResult> {
    const modelId = options.model || 'gemini-2.5-flash';
    const vertexAI = getVertexAI();

    try {
      // First try using the Vertex AI SDK (requires ADC credentials)
      const model = vertexAI.getGenerativeModel({
        model: modelId,
        systemInstruction: options.systemInstruction ? {
          role: 'system',
          parts: options.systemInstruction.parts,
        } : undefined,
        generationConfig: options.generationConfig ? {
          temperature: options.generationConfig.temperature,
          topP: options.generationConfig.topP,
          topK: options.generationConfig.topK,
          maxOutputTokens: options.generationConfig.maxOutputTokens,
          stopSequences: options.generationConfig.stopSequences,
        } : undefined,
        safetySettings: options.safetySettings as SafetySetting[] || undefined,
      });

      const result = await model.generateContent({
        contents: options.contents as any,
      });

      const response = result.response;

      return {
        candidates: response.candidates?.map(candidate => ({
          content: {
            role: candidate.content?.role || 'model',
            parts: candidate.content?.parts?.map(part => ({
              text: part.text,
            })) || [],
          },
          finishReason: candidate.finishReason || 'STOP',
        })),
        usageMetadata: response.usageMetadata ? {
          promptTokenCount: response.usageMetadata.promptTokenCount || 0,
          candidatesTokenCount: response.usageMetadata.candidatesTokenCount || 0,
          totalTokenCount: response.usageMetadata.totalTokenCount || 0,
        } : undefined,
      };
    } catch (error: any) {
      console.error(`[VertexService] Error generating content with Vertex AI, falling back to REST:`, error?.message || error);

      // Fallback to Gemini REST API using GOOGLE_API_KEY if Vertex fails due to missing ADC
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
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
    const vertexAI = getVertexAI();

    const model = vertexAI.getGenerativeModel({
      model: modelId,
      systemInstruction: options.systemInstruction ? {
        role: 'system',
        parts: options.systemInstruction.parts,
      } : undefined,
      generationConfig: options.generationConfig ? {
        temperature: options.generationConfig.temperature,
        topP: options.generationConfig.topP,
        topK: options.generationConfig.topK,
        maxOutputTokens: options.generationConfig.maxOutputTokens,
        stopSequences: options.generationConfig.stopSequences,
      } : undefined,
    });

    const streamResult = await model.generateContentStream({
      contents: options.contents as any,
    });

    for await (const chunk of streamResult.stream) {
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