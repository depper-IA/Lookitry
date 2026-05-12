import { descriptorService } from './src/services/ai-descriptor/ai-descriptor.service';
import { ClothingFormatter } from './src/services/ai-descriptor/formatters/clothing.formatter';
import { vertexService } from './src/services/vertex.service';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const f = new ClothingFormatter();
  const prompt = f.buildPrompt('Vestido Rojo Elegante', 'Vestidos', 'Un vestido rojo muy bonito para fiestas');
  console.log("PROMPT:");
  console.log(prompt);
  console.log("-------------------");
  
  const result = await vertexService.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  });
  
  console.log("RESULT:", JSON.stringify(result, null, 2));
}
run();