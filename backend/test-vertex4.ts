import { VertexAI } from '@google-cloud/vertexai';

async function run() {
  try {
    const vertexAI = new VertexAI({
      project: 'gen-lang-client-0591001769',
      location: 'us-central1',
    });

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: undefined,
        topK: undefined,
        maxOutputTokens: 1024,
        stopSequences: undefined,
      } as any
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
    });

    console.log(JSON.stringify(result.response, null, 2));
  } catch (e: any) {
    console.error(e.message);
  }
}
run();