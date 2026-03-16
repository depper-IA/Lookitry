import { Request, Response } from 'express';
import { UploadService } from '../services/upload.service';
import { AuthRequest } from '../middleware/auth';

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
 * Endpoint para que n8n suba selfies temporales a MinIO.
 * Autenticado con Bearer token fijo (N8N_BEARER_TOKEN).
 * Acepta base64 o multipart/form-data con campo "file".
 */
export const uploadSelfie = async (req: Request, res: Response) => {
  try {
    // Verificar token de n8n
    const authHeader = req.headers.authorization || '';
    const expectedToken = process.env.N8N_BEARER_TOKEN || '';
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token inválido' });
    }

    const { image_base64, filename } = req.body;

    if (!image_base64 || !filename) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'image_base64 y filename son requeridos',
      });
    }

    const result = await uploadService.uploadImage({
      image_base64,
      filename,
      temporary: true, // siempre en carpeta temp/
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
