import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '.env') });

import { generateMaskWithSAM2, generateWithNanoBanana } from './src/services/vertex-ai.service';

async function test() {
  console.log('Iniciando prueba E2E (SAM + Nano Banana) con .env saneado...');
  try {
    const testImageUrl = 'https://raw.githubusercontent.com/facebookresearch/segment-anything/main/notebooks/images/truck.jpg';
    
    console.log('\n--- 1. PROBANDO SAM (Máscara) ---');
    const maskResult = await generateMaskWithSAM2(testImageUrl);
    console.log('✅ Máscara generada con éxito:', maskResult.maskUrl);

    console.log('\n--- 2. PROBANDO NANO BANANA (Try-On) ---');
    const prompt = "A high-quality editorial photo of a subject wearing a casual red hoodie";
    const tryonResult = await generateWithNanoBanana(testImageUrl, testImageUrl, prompt, maskResult.maskUrl);
    console.log('✅ Try-On generado con éxito:', tryonResult.resultImageUrl);
    
    console.log('\n¡PRUEBA E2E TOTAL EXITOSA! 🎉');
  } catch (error: any) {
    console.error('\n❌ ERROR EN LA PRUEBA E2E:');
    console.error(error.message);
    if (error.originalError?.response?.data) {
       console.error('Detalle del error:', JSON.stringify(error.originalError.response.data, null, 2));
    }
  }
}

test();
