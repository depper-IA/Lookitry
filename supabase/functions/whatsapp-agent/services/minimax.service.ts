import { CONFIG } from '../config.ts';

export const minimaxService = {
  async callMiniMax(systemPrompt: string, userMessage: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.MINIMAX_TIMEOUT_MS);
    
    try {
      const apiKey = Deno.env.get('MINIMAX_API');
      const groupId = Deno.env.get('MINIMAX_GROUP_ID');
      
      if (!apiKey) {
        throw new Error('MINIMAX_API_KEY not configured');
      }
      
      const response = await fetch(CONFIG.MINIMAX_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: CONFIG.MINIMAX_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: CONFIG.MAX_TOKENS,
          temperature: CONFIG.TEMPERATURE,
          group_id: groupId
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`MINIMAX_ERROR: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[MiniMax] Raw response:', JSON.stringify(result).substring(0, 1000));

      // Handle different MiniMax response formats
      let responseText = result.choices?.[0]?.message?.content;
      if (!responseText && result.choices?.[0]?.text) {
        responseText = result.choices?.[0]?.text;
      }
      if (!responseText && result.choices?.[0]?.messages?.[0]?.content) {
        // MiniMax returns messages array inside choices
        responseText = result.choices?.[0]?.messages?.[0]?.content;
      }
      if (!responseText && result.output?.text) {
        responseText = result.output.text;
      }
      if (!responseText && result.generation?.text) {
        responseText = result.generation.text;
      }
      if (!responseText && result.text) {
        responseText = result.text;
      }
      if (!responseText) {
        console.error('[MiniMax] No text found in response:', JSON.stringify(result).substring(0, 500));
        throw new Error('MINIMAX_NO_RESPONSE');
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
