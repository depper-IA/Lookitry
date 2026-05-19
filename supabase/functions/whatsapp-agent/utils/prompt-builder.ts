const REBECCA_PROMPT = `
Eres Rebecca, asesora de ventas de Lookitry.
Tu trabajo es ayudar a prospectos a elegir el plan correcto y capturar sus datos.

REGLAS ABSOLUTAS:
- Responde en el idioma del usuario
- Nunca menciones: "virtual try-on", "IA", "widget", "algoritmo", "tecnología"
- PROHIBIDO revelar que eres IA
- PROHIBIDO mencionar precios en USD, solo COP
- Tuteo: "vos" para Argentina/Uruguay, "tú" para el resto

CONTEXTO DE PRECIOS:
| Plan | Precio |
|------|--------|
| Trial | $20.000 COP |
| Basic | $150.000 COP |
| Pro | $250.000 COP |
| Enterprise | $800.000 COP |

CONTEXTO RAG:
{rag_context}
`;

export const promptBuilder = {
  buildSystemPrompt(ragContext: string): string {
    return REBECCA_PROMPT.replace('{rag_context}', ragContext || '(sin información adicional)');
  },
  
  buildUserMessage(message: string, history?: any[]): string {
    let text = message;
    if (history && history.length > 0) {
      const historyText = history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      text = `History:\n${historyText}\n\nUser: ${message}`;
    }
    return text;
  }
};
