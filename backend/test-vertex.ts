import { VertexAI } from '@google-cloud/vertexai';

async function run() {
  try {
    console.log('Initializing VertexAI...');
    const vertexAI = new VertexAI({
      project: 'gen-lang-client-0591001769',
      location: 'us-central1',
    });

    console.log('Getting generative model...');
    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    console.log('Generating content...');
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Hello, what is 2+2?' }] }],
    });

    console.log('Result:', JSON.stringify(result.response, null, 2));
  } catch (e: any) {
    console.error('Error details:');
    console.error(e.message);
    if (e.response) console.error(e.response);
  }
}
run();