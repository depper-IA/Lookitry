import { Router } from 'express';
import { getPublicPricingConfig } from '../controllers/publicPricing.controller';

const router = Router();

// GET /api/pricing-config - Configuración de precios pública (usa service_role key)
router.get('/', getPublicPricingConfig);

export default router;