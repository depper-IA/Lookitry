import { Response } from 'express';
import { UploadService } from '../services/upload.service';
import { AuthRequest } from '../middleware/auth';

const uploadService = new UploadService();

export const uploadImage = async (req: AuthRequest, res: Response) => {
  try {
    console.log('[Upload Controller] Petición recibida');
    
    if (!req.brand) {
      console.log('[Upload Controller] No autenticado');
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'No autenticado',
      });
    }

    const { image_base64, filename, temporary } = req.body;

    console.log('[Upload Controller] Datos:', { 
      filename, 
      temporary, 
      base64Length: image_base64?.length,
      brandId: req.brand.id 
    });

    if (!image_base64 || !filename) {
      console.log('[Upload Controller] Faltan parámetros');
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'image_base64 y filename son requeridos',
      });
    }

    const result = await uploadService.uploadImage({
      image_base64,
      filename,
      temporary: temporary || false,
    });

    console.log('[Upload Controller] Éxito:', result);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[Upload Controller] Error:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: error.message || 'Error al subir imagen',
    });
  }
};
