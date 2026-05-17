import { supabaseAdmin } from '../config/supabase';
import { rebeccaIdentityService } from './rebecca-identity.service';
import { vertexService } from './vertex.service';
import type { VertexModelId } from './vertex.service';

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface KnowledgeCacheEntry {
  context: string;
  expiresAt: number;
}

const KNOWLEDGE_CACHE_TTL_MS = 5 * 60 * 1000;
const knowledgeCache = new Map<'web', KnowledgeCacheEntry>();

async function getKnowledgeContext(): Promise<string> {
  const cached = knowledgeCache.get('web');
  if (cached && Date.now() < cached.expiresAt) {
    return cached.context;
  }

  const { data, error } = await supabaseAdmin
    .from('lookitry_knowledge')
    .select('title, content')
    .eq('is_active', true);

  if (error) {
    console.error('[RebeccaChatService] Error loading knowledge:', error);
    return '';
  }

  const context = (data ?? [])
    .map((item: { title: string; content: string }) => `${item.title}\n${item.content}`)
    .join('\n\n---\n\n');

  knowledgeCache.set('web', { context, expiresAt: Date.now() + KNOWLEDGE_CACHE_TTL_MS });
  return context;
}

export class RebeccaChatService {
  async replyForChannel(
    channel: 'web',
    sessionId: string,
    message: string,
    history: HistoryMessage[]
  ): Promise<string> {
    const maxHistory = parseInt(process.env.REBECCA_WIDGET_MAX_HISTORY ?? '10', 10);
    const trimmedHistory = history.slice(-maxHistory);

    const knowledgeContext = await getKnowledgeContext();
    const systemPrompt = rebeccaIdentityService.getSystemPrompt(channel, knowledgeContext);
    const model = (process.env.REBECCA_VERTEX_MODEL ?? 'gemini-2.5-flash') as VertexModelId;

    const contents = [
      ...trimmedHistory.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const result = await vertexService.generateContent({
      model,
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
    });

    if (result.error) {
      throw new Error(`[RebeccaChatService] Vertex error: ${result.error}`);
    }

    const reply = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      throw new Error('[RebeccaChatService] Empty response from Vertex');
    }

    return reply;
  }
}

export const rebeccaChatService = new RebeccaChatService();
