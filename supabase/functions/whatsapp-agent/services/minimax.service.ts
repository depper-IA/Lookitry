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
          temperature: CONFIG.TEMPERATURE
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
      // MiniMax puts text in content[0].text OR content[0].thinking (reasoning)
      let responseText = result.content?.[0]?.text;

      // MiniMax-M2.7 puts actual response in thinking block, strip the tags
      if (!responseText && result.content?.[0]?.thinking) {
        const thinkingContent = result.content[0].thinking;
        // Remove <think> and </think> tags
        responseText = thinkingContent
          .replace(/<think>/gi, '')
          .replace(/<\/think>/gi, '')
          .trim();
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
