import { Router } from 'express';
import { adminAuthMiddleware, requirePermission } from '../middleware/adminAuth';
import {
  listEnterpriseSyncConfigs,
  upsertEnterpriseSyncConfig,
  triggerEnterpriseSync,
  updateSyncStatus,
  createEnterpriseClient,
} from '../controllers/enterprise.controller';
import { syncProductWebhook } from '../controllers/enterprise.controller';

const router = Router();

// ââ Alta completa de cliente Enterprise (requiere permiso brands + subscriptions) ââ
router.post('/create-client', adminAuthMiddleware, requirePermission('brands'), createEnterpriseClient);

// ââ Listar todas las configs de sync Enterprise ââââââââââââââââââââââââââââââ
router.get('/', adminAuthMiddleware, listEnterpriseSyncConfigs);

// ââ Crear / actualizar config de sync para una marca âââââââââââââââââââââââââ
router.post('/:brandId/sync-config', adminAuthMiddleware, upsertEnterpriseSyncConfig);

// ââ Disparar sync manual desde el panel de admin âââââââââââââââââââââââââââââ
router.post('/:brandId/trigger-sync', adminAuthMiddleware, triggerEnterpriseSync);

// ââ Actualizar estado del sync (llamado por n8n al finalizar) ââââââââââââââââ
router.patch('/:brandId/sync-status', updateSyncStatus);

// ââ Webhook para insertar/actualizar productos (llamado por n8n por producto) â
router.post('/sync-product', syncProductWebhook);

export default router;
