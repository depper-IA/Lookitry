import sharp from 'sharp';
import axios from 'axios';
import path from 'path';
import fs from 'fs';

export class ImageService {
  private readonly assetsPath = path.join(process.cwd(), 'assets');
  private readonly watermarkBasic = path.join(this.assetsPath, 'watermark-basic.webp');
  private readonly watermarkTrial = path.join(this.assetsPath, 'watermark-trial.webp');

  /**
   * Procesa una imagen aplicando una marca de agua según el plan.
   * @param imageUrl URL de la imagen original en MinIO
   * @param plan Plan de la marca (BASIC, TRIAL, PRO)
   * @returns Buffer de la imagen procesada
   */
  async processWithWatermark(imageUrl: string, plan: string): Promise<Buffer> {
    try {
      // 1. Descargar la imagen
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 8000 });
      const imageBuffer = Buffer.from(response.data);

      // Si es PRO, no aplicamos marca de agua (solo optimizamos un poco)
      if (plan === 'PRO') {
        return await sharp(imageBuffer)
          .jpeg({ quality: 90 })
          .toBuffer();
      }

      // 2. Obtener dimensiones de la imagen original
      const metadata = await sharp(imageBuffer).metadata();
      const { width, height } = metadata;

      if (!width || !height) {
        throw new Error('No se pudieron obtener las dimensiones de la imagen');
      }

      // 3. Seleccionar marca de agua
      let watermarkPath = plan === 'BASIC' ? this.watermarkBasic : this.watermarkTrial;
      
      // Verificar que el archivo existe
      if (!fs.existsSync(watermarkPath)) {
        console.warn(`[ImageService] Marca de agua no encontrada en ${watermarkPath}, devolviendo imagen limpia`);
        return imageBuffer;
      }

      const watermarkBuffer = fs.readFileSync(watermarkPath);

      // 4. Calcular dimensiones y posición de la marca de agua
      if (plan === 'BASIC') {
        // BASIC: Marca de agua pequeña en la esquina inferior derecha
        const wmWidth = Math.round(width * 0.10); // 10% del ancho es suficiente y elegante

        const resizedWatermark = await sharp(watermarkBuffer)
          .resize({ width: wmWidth })
          .toBuffer();

        return await sharp(imageBuffer)
          .composite([
            {
              input: resizedWatermark,
              gravity: 'southeast',
              blend: 'over'
            }
          ])
          .jpeg({ quality: 85 })
          .toBuffer();
      } else {
        // TRIAL: Marca de agua central más grande con opacidad (el archivo ya debe tenerla o se puede ajustar)
        const wmWidth = Math.round(width * 0.45);
        
        const resizedWatermark = await sharp(watermarkBuffer)
          .resize({ width: wmWidth })
          .toBuffer();

        return await sharp(imageBuffer)
          .composite([
            {
              input: resizedWatermark,
              gravity: 'center',
              blend: 'over'
            }
          ])
          .jpeg({ quality: 85 })
          .toBuffer();
      }
    } catch (error: any) {
      console.error('[ImageService] Error procesando imagen:', error.message);
      throw error;
    }
  }

  /**
   * Refina el posicionamiento usando gravity nativo de Sharp para mayor simplicidad
   */
  async applyWatermarkSimple(imageUrl: string, plan: string): Promise<Buffer> {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data);

    if (plan !== 'BASIC' && plan !== 'TRIAL') return imageBuffer;

    const metadata = await sharp(imageBuffer).metadata();
    const watermarkPath = plan === 'BASIC' ? this.watermarkBasic : this.watermarkTrial;
    
    if (!fs.existsSync(watermarkPath)) return imageBuffer;

    const wmWidth = plan === 'BASIC' ? Math.round(metadata.width! * 0.15) : Math.round(metadata.width! * 0.45);
    const resizedWm = await sharp(watermarkPath).resize(wmWidth).toBuffer();

    return await sharp(imageBuffer)
      .composite([{
        input: resizedWm,
        gravity: plan === 'BASIC' ? 'southeast' : 'center',
      }])
      .jpeg({ quality: 90 })
      .toBuffer();
  }
}
