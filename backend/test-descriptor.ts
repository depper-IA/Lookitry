import { descriptorService } from './src/services/ai-descriptor/ai-descriptor.service';
import { vertexService } from './src/services/vertex.service';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  console.log('Probando el descriptor IA (CLOTHING)...');
  try {
    const res = await descriptorService.describeProduct({
      name: 'Vestido Rojo Elegante',
      category: 'Vestidos',
      brand_description: 'Un vestido rojo muy bonito para fiestas',
      image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop'
    });
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}
run();