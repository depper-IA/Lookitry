import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/adminAuth';
import {
  listEnterpriseSyncConfigs,
  upsertEnterpriseSyncConfig,
  triggerEnterpriseSync,
  updateSyncStatus,
} from '../controllers/enterprise.controller';

const router = Router();

// Todas las rutas admin requieren autenticación
router.use(adminAuthMiddleware);

// Listar todas las configs de sync Enterprise
router.get('/', listEnterpriseSyncConfigs);

// Crear / actualizar config de sync para una marca
router.post('/:brandId/sync-config', upsertEnterpriseSyncConfig);

// Disparar sync manual desde el panel de admin
router.post('/:brandId/trigger-sync', triggerEnterpriseSync);

// Actualizar estado del sync (llamado por n8n al finalizar el proceso)
router.patch('/:brandId/sync-status', updateSyncStatus);

export default router;
