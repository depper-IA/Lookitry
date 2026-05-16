import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import { GoogleAuth } from 'google-auth-library';
dotenv.config({ path: path.join(__dirname, '.env') });

process.env.GOOGLE_APPLICATION_CREDENTIALS = 'C:\\Users\\Matt\\Lookitry\\gen-lang-client-0591001769-06f04cbf5e1a.json';

const googleAuth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

async function testImagenV2() {
  console.log('Probando Imagen 2 (imagegeneration@006) en modo Serverless...');
  try {
    const client = await googleAuth.getClient();
    const token = await client.getAccessToken();
    const projectId = 'gen-lang-client-0591001769';
    const region = 'us-central1';
    
    const modelId = 'imagegeneration';
    const url = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${modelId}:predict`;

    console.log(`URL: ${url}`);

    const response = await axios.post(url, {
      instances: [
        {
          prompt: "A beautiful tropical beach at sunset, high quality",
        }
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: "1:1"
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ ¡Éxito con Imagen 2!');
    console.log('Respuesta:', Object.keys(response.data));
    if (response.data.predictions) {
       console.log('Imagen generada (base64 length):', response.data.predictions[0].bytesBase64Encoded?.length);
    }
  } catch (error: any) {
    console.error('❌ Falló Imagen 2:', error.response?.status);
    if (error.response?.data) {
        console.error('Detalle:', JSON.stringify(error.response.data, null, 2));
    } else {
        console.error('Mensaje:', error.message);
    }
  }
}

testImagenV2();
