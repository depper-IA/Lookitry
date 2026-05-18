import { CONFIG } from '../config.ts';

export const minimaxService = {
  async callMiniMax(systemPrompt: string, userMessage: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.MINIMAX_TIMEOUT_MS);

    try {
      const apiKey = Deno.env.get('MINIMAX_API');

      if (!apiKey) {
        throw new Error('MINIMAX_API_KEY not configured');
      }

      const response = await fetch(CONFIG.MINIMAX_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: CONFIG.MINIMAX_MODEL,
          max_tokens: CONFIG.MAX_TOKENS,
          system: systemPrompt,
          messages: [
            { role: 'user', content: [{ type: 'text', text: userMessage }] }
          ],
          temperature: CONFIG.TEMPERATURE,
          thinking: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[MiniMax] Error response:', errorText);
        throw new Error(`MINIMAX_ERROR: ${response.status}`);
      }

      const result = await response.json();
      console.log('[MiniMax] Raw response:', JSON.stringify(result).substring(0, 1500));

// Handle Anthropic-compatible response format
      // MiniMax-M2.7 returns content blocks: [{type: "thinking", thinking: "..."}, {type: "text", text: "..."}]
      // We need to find the text block, NOT the thinking block
      let responseText = '';

      // Look for content blocks with type "text"
      if (result.content && Array.isArray(result.content)) {
        for (const block of result.content) {
          if (block.type === 'text' && block.text) {
            responseText = block.text;
            break;
          }
        }

        // If no text block found, try thinking block (but this is internal reasoning, not the answer)
        if (!responseText && result.content?.[0]?.thinking) {
          // This is the thinking/reasoning, not the actual response
          // Try to find a second content block
          if (result.content.length > 1) {
            responseText = result.content[1].text || '';
          }
          // If still nothing, use thinking but it will be the prompt instructions
          if (!responseText) {
            responseText = result.content[0].thinking
              .replace(/<think>/gi, '')
              .replace(/<\/think>/gi, '')
              .trim();
          }
        }
      }

      if (!responseText && result.error) {
        console.error('[MiniMax] API Error:', result.error);
        throw new Error(`MINIMAX_API_ERROR: ${result.error}`);
      }

      if (!responseText) {
        console.error('[MiniMax] No text found in response:', JSON.stringify(result).substring(0, 500));
        throw new Error('MINIMAX_NO_RESPONSE');
      }

      // Remove thinking tags if present
      responseText = responseText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

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
