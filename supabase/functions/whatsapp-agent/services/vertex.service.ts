export const vertexService = {
  async callVertex(systemPrompt: string, userMessage: string): Promise<string> {
    const controller = new AbortController();
    // Use a slightly longer timeout for Vertex since it's the fallback
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    try {
      const apiKey = Deno.env.get('VERTEX_API_KEY');
      
      if (!apiKey) {
        throw new Error('VERTEX_API_KEY not configured');
      }
      
      // Using Google AI Studio REST API for Gemini 2.5 Flash
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          system_instruction: {
            parts: { text: systemPrompt }
          },
          contents: [
            {
              parts: [{ text: userMessage }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Vertex] Error response:', errorText);
        throw new Error(`VERTEX_ERROR: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[Vertex] Raw response:', JSON.stringify(result).substring(0, 500));
      
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!responseText) {
        console.error('[Vertex] No text found in response:', JSON.stringify(result).substring(0, 500));
        throw new Error('VERTEX_NO_RESPONSE');
      }

      return responseText;
    } catch (error: any) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error('VERTEX_TIMEOUT');
      }
      throw error;
    }
  }
};
