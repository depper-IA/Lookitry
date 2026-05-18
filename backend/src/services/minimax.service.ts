const MINIMAX_API_URL = 'https://api.minimax.io/anthropic/v1/messages';
const MINIMAX_MODEL = 'MiniMax-M2.7';
const MINIMAX_TIMEOUT_MS = 15000;
const MAX_TOKENS = 2048;
const TEMPERATURE = 0.7;

export type ConvMessage = { role: 'user' | 'assistant'; content: string };

export const minimaxService = {
  async callMiniMax(systemPrompt: string, userMessage: string, history: ConvMessage[] = []): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MINIMAX_TIMEOUT_MS);

    try {
      const apiKey = process.env.MINIMAX_API;

      if (!apiKey) {
        throw new Error('MINIMAX_API not configured');
      }

      // Build multi-turn messages: history + current user message
      const messages = [
        ...history.map(m => ({
          role: m.role,
          content: [{ type: 'text', text: m.content }]
        })),
        { role: 'user', content: [{ type: 'text', text: userMessage }] }
      ];

      const response = await fetch(MINIMAX_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: MINIMAX_MODEL,
          max_tokens: MAX_TOKENS,
          system: systemPrompt,
          messages,
          temperature: TEMPERATURE
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[MiniMax] Error response:', errorText);
        throw new Error(`MINIMAX_ERROR: ${response.status}`);
      }

      const result: any = await response.json();
      console.log('[MiniMax] Raw response:', JSON.stringify(result).substring(0, 1000));

      // Handle Anthropic-compatible response format
      // MiniMax-M2.7 returns content blocks: [{type: "thinking", thinking: "..."}, {type: "text", text: "..."}]
      let responseText = '';

      if (result.content && Array.isArray(result.content)) {
        for (const block of result.content) {
          if (block.type === 'text' && block.text && block.text.trim().length > 0) {
            responseText = block.text.trim();
            break;
          }
        }

        if (!responseText) {
          console.warn('[MiniMax] No text block found');
          const thinkingBlock = result.content.find((b: any) => b.type === 'thinking');
          if (thinkingBlock?.thinking) {
            throw new Error('MINIMAX_NO_VALID_RESPONSE');
          }
        }
      }

      if (!responseText || responseText.trim().length === 0) {
        console.error('[MiniMax] Empty response text');
        throw new Error('MINIMAX_EMPTY_RESPONSE');
      }

      // Clean the response
      responseText = responseText
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Final validation
      if (responseText.startsWith('(') || responseText.includes('<think>')) {
        console.error('[MiniMax] Response appears to be internal reasoning');
        throw new Error('MINIMAX_INVALID_RESPONSE_FORMAT');
      }

      return responseText;
    } catch (error: any) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error('MINIMAX_TIMEOUT');
      }
      throw error;
    }
  }
};