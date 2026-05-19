import axios from 'axios';
import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

process.env.GOOGLE_APPLICATION_CREDENTIALS = '/home/travis/Lookitry/Lookitry/backend/secrets/vertex-key.json';

const googleAuth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

async function testNanoBanana() {
  console.log('Probando Nano Banana (Gemini format) desde Backend...');
  try {
    const client = await googleAuth.getClient();
    const token = await client.getAccessToken();
    const projectId = 'gen-lang-client-0591001769';
    const region = 'us-central1';
    
    // Probamos con el nombre que está en n8n
    const modelId = 'gemini-2.5-flash-image'; // El nombre exacto de n8n
    const url = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${modelId}:generateContent`;

    // Selfie y Producto de prueba (pequeños para el test)
    const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

    const payload = {
      contents: [{
        role: 'user',
        parts: [
          { text: "Virtual try-on: put this red cup on the table in the selfie" },
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
        ]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
        // responseModalities: ["TEXT", "IMAGE"] // Algunos modelos no lo soportan así
      }
    };

    console.log(`Enviando request a ${url}...`);
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Éxito!');
    console.log('Keys en respuesta:', Object.keys(response.data));
    if (response.data.candidates) {
       console.log('Número de candidatos:', response.data.candidates.length);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.response?.status, error.response?.data?.error?.message || error.message);
    if (error.response?.data) {
        console.error('Detalle:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testNanoBanana();
