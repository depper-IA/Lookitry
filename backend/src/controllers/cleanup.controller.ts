import { Request, Response } from 'express';

import { CleanupService } from '../services/cleanup.service';

import { sanitizeError } from '../utils/sanitizeError';



const cleanupService = new CleanupService();



/**

 * Endpoint manual para ejecutar limpieza (solo admin)

 */

export const runCleanup = async (_req: Request, res: Response) => {

  try {

    console.log('[Cleanup Controller] Ejecutando limpieza manual...');



    const result = await cleanupService.runFullCleanup();



    return res.status(200).json({

      success: true,

      message: 'Limpieza completada',

      deleted: result.totalDeleted,

      errors: result.totalErrors,

    });

  } catch (error: any) {

    console.error('[Cleanup Controller] Error:', error);

    return res.status(500).json({

      error: 'INTERNAL_ERROR',

      message: sanitizeError(error, 'Error al ejecutar limpieza'),

    });

  }

};



/**

 * Endpoint para obtener estadísticas de almacenamiento

 */

export const getStorageStats = async (_req: Request, res: Response) => {

  try {

    // TODO: Implementar estadísticas de almacenamiento

    // - Total de imágenes

    // - Espacio usado estimado

    // - Imágenes pendientes de limpieza



    return res.status(200).json({

      success: true,

      message: 'Estadísticas no implementadas aún',

    });

  } catch (error: any) {

    console.error('[Cleanup Controller] Error:', error);

    return res.status(500).json({

      error: 'INTERNAL_ERROR',

      message: sanitizeError(error, 'Error al obtener estadísticas'),

    });

  }

};

