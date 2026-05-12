import dotenv from 'dotenv';
dotenv.config();

import { vertexService } from './src/services/vertex.service';

async function run() {
  console.log('Testing VertexService directly...');
  try {
    const result = await vertexService.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error(e);
  }
}
run();