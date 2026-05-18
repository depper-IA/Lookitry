import { CONFIG } from '../config.ts';

export const minimaxService = {
  async callMiniMax(systemPrompt: string, userMessage: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.MINIMAX_TIMEOUT_MS);
    
    try {
      const apiKey = Deno.env.get('MINIMAX_API_KEY');
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
      console.log('[MiniMax] Response:', JSON.stringify(result).substring(0, 500));
      return result.choices?.[0]?.message?.content || 'Error generating response';
    } catch (error: any) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error('MINIMAX_TIMEOUT');
      }
      throw error;
    }
  }
};
