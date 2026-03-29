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

// ── Alta completa de cliente Enterprise (requiere permiso brands + subscriptions) ──
router.post('/create-client', adminAuthMiddleware, requirePermission('brands'), createEnterpriseClient);

// ── Listar todas las configs de sync Enterprise ──────────────────────────────
router.get('/', adminAuthMiddleware, listEnterpriseSyncConfigs);

// ── Crear / actualizar config de sync para una marca ─────────────────────────
router.post('/:brandId/sync-config', adminAuthMiddleware, upsertEnterpriseSyncConfig);

// ── Disparar sync manual desde el panel de admin ─────────────────────────────
router.post('/:brandId/trigger-sync', adminAuthMiddleware, triggerEnterpriseSync);

// ── Actualizar estado del sync (llamado por n8n al finalizar) ────────────────
router.patch('/:brandId/sync-status', updateSyncStatus);

// ── Webhook para insertar/actualizar productos (llamado por n8n por producto) ─
router.post('/sync-product', syncProductWebhook);

export default router;
