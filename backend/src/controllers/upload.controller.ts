import { Request, Response } from 'express';
import multer from 'multer';
import { UploadService } from '../services/upload.service';
import { AuthRequest } from '../middleware/auth';

// Multer en memoria para recibir archivos binarios desde n8n
export const multerMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const uploadService = new UploadService();

export const uploadImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.brand) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'No autenticado',
      });
    }

    const { image_base64, filename, temporary } = req.body;

    if (!image_base64 || !filename) {
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

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[Upload Controller] Error:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: error.message || 'Error al subir imagen',
    });
  }
};

/**
 * POST /api/upload/selfie
 * Endpoint para que n8n suba imágenes a MinIO.
 * Autenticado con Bearer token fijo (N8N_BEARER_TOKEN).
 * Acepta:
 *   - JSON: { image_base64, filename, temporary? }
 *   - multipart/form-data: campo "file" (binario) + campo "filename" opcional
 */
export const uploadSelfie = async (req: Request, res: Response) => {
  try {
    // Verificar token de n8n
    const authHeader = req.headers.authorization || '';
    const expectedToken = process.env.N8N_BEARER_TOKEN || '';
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token inválido' });
    }

    const isMultipart = req.is('multipart/form-data');

    if (isMultipart) {
      // Caso multipart: el archivo viene en req.file (procesado por multer en app.ts)
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Campo "file" requerido en multipart' });
      }
      const filename = (req.body.filename as string) || file.originalname || 'upload.jpg';
      const temporary = req.body.temporary !== 'false' && req.body.temporary !== false;

      const result = await uploadService.uploadImageBuffer({
        buffer: file.buffer,
        filename,
        temporary,
      });
      return res.status(200).json(result);
    }

    // Caso JSON base64
    const { image_base64, filename, temporary } = req.body;
    if (!image_base64 || !filename) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'image_base64 y filename son requeridos',
      });
    }

    const result = await uploadService.uploadImage({
      image_base64,
      filename,
      temporary: temporary !== false,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[Upload Selfie] Error:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: error.message || 'Error al subir selfie',
    });
  }
};

/**
 * DELETE /api/upload/cleanup-temp
 * Elimina selfies temporales del bucket MinIO.
 *body: { selfie_paths: string[] } o ?path=nombre_archivo
 */
export const cleanupTempSelfies = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization || '';
    const expectedToken = process.env.N8N_BEARER_TOKEN || '';
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token inválido' });
    }

    const { selfie_paths } = req.body;
    
    if (!selfie_paths || !Array.isArray(selfie_paths) || selfie_paths.length === 0) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'selfie_paths es requerido y debe ser un array' });
    }

    const results = await uploadService.cleanupTempFiles(selfie_paths);

    return res.status(200).json({ 
      success: true, 
      deleted: results.deleted, 
      errors: results.errors 
    });
  } catch (error: any) {
    console.error('[Cleanup Temp] Error:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: error.message || 'Error al limpiar archivos temporales',
    });
  }
};
