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
      console.log('[MiniMax] Raw response:', JSON.stringify(result).substring(0, 1000));

      // Handle Anthropic-compatible response format
      // MiniMax-M2.7 returns content blocks: [{type: "thinking", thinking: "..."}, {type: "text", text: "..."}]
      // The actual response is in the "text" block, NOT the "thinking" block
      let responseText = '';

      if (result.content && Array.isArray(result.content)) {
        // First, look for the text block (the actual response)
        for (const block of result.content) {
          if (block.type === 'text' && block.text && block.text.trim().length > 0) {
            responseText = block.text.trim();
            break;
          }
        }

        // If no text block found, the model may not have produced a valid response
        // This can happen if max_tokens is too low
        if (!responseText) {
          console.warn('[MiniMax] No text block found in response');
          
          // Check for thinking block - but this is internal reasoning, NOT the answer
          const thinkingBlock = result.content.find((b: any) => b.type === 'thinking');
          if (thinkingBlock?.thinking) {
            console.warn('[MiniMax] Only thinking block found - model may have run out of tokens');
            // DO NOT use thinking content as response - it contains internal reasoning
            // Instead throw an error to trigger fallback
            throw new Error('MINIMAX_NO_VALID_RESPONSE');
          }
        }
      }

      // Final safety check
      if (!responseText || responseText.trim().length === 0) {
        console.error('[MiniMax] Empty response text');
        throw new Error('MINIMAX_EMPTY_RESPONSE');
      }

      // Clean the response
      responseText = responseText
        .replace(/<think>[\s\S]*?<\/think>/gi, '') // Remove thinking tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      // Final check - if response still looks like internal reasoning, reject it
      if (responseText.startsWith('(') || responseText.includes('(瓜子)') || responseText.includes('<think>')) {
        console.error('[MiniMax] Response appears to be internal reasoning, not valid output');
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