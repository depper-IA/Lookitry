import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/adminAuth';
import {
  listEnterpriseSyncConfigs,
  upsertEnterpriseSyncConfig,
  triggerEnterpriseSync,
  updateSyncStatus,
} from '../controllers/enterprise.controller';

const router = Router();

// Listar todas las configs de sync Enterprise
router.get('/', adminAuthMiddleware, listEnterpriseSyncConfigs);

// Crear / actualizar config de sync para una marca
router.post('/:brandId/sync-config', adminAuthMiddleware, upsertEnterpriseSyncConfig);

// Disparar sync manual desde el panel de admin
router.post('/:brandId/trigger-sync', adminAuthMiddleware, triggerEnterpriseSync);

// Actualizar estado del sync (llamado por n8n al finalizar el proceso o por admin)
router.patch('/:brandId/sync-status', updateSyncStatus);

export default router;
