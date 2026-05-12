import { Router } from 'express';

import { SubscriptionController } from '../controllers/subscription.controller';

import { authMiddleware } from '../middleware/auth';

import { adminAuthMiddleware } from '../middleware/adminAuth';



const router = Router();

const subscriptionController = new SubscriptionController();



/**

 * Rutas de suscripción para marcas

 * Requieren autenticación de marca

 */



/**

 * GET /api/brands/subscription

 * Obtener estado de suscripción actual de la marca autenticada

 * 

 * Requirement 11.5: Marca puede consultar su estado de suscripción

 */

router.get('/brands/subscription', authMiddleware, (req: any, res: any) => {

  subscriptionController.getBrandSubscription(req, res);

});



/**

 * Rutas de administración de suscripciones

 * Requieren autenticación de administrador

 */



/**

 * GET /api/admin/subscriptions

 * Listar todas las suscripciones con filtros opcionales

 * Query params: status (active, expiring_soon, expired, suspended)

 * 

 * Requirements 12.1, 12.2: Admin puede ver todas las suscripciones con filtros

 */

router.get('/admin/subscriptions', adminAuthMiddleware, (req: any, res: any) => {

  subscriptionController.getAllSubscriptions(req, res);

});



/**

 * PATCH /api/admin/subscriptions/:brandId/renew

 * Renovar suscripción manualmente

 * Body: { amount, currency, payment_date, payment_method, notes }

 * 

 * Requirement 12.4: Admin puede renovar suscripciones manualmente

 */

router.patch('/admin/subscriptions/:brandId/renew', adminAuthMiddleware, (req: any, res: any) => {

  subscriptionController.renewSubscription(req, res);

});



/**

 * PATCH /api/admin/subscriptions/:brandId/suspend

 * Suspender marca

 * 

 * Requirement 12.5: Admin puede suspender marcas

 */

router.patch('/admin/subscriptions/:brandId/suspend', adminAuthMiddleware, (req: any, res: any) => {

  subscriptionController.suspendSubscription(req, res);

});



/**

 * PATCH /api/admin/subscriptions/:brandId/reactivate

 * Reactivar marca suspendida

 * 

 * Requirement 12.6: Admin puede reactivar marcas suspendidas

 */

router.patch('/admin/subscriptions/:brandId/reactivate', adminAuthMiddleware, (req: any, res: any) => {

  subscriptionController.reactivateSubscription(req, res);

});



/**

 * POST /api/admin/subscriptions/:brandId/payment

 * Registrar pago manual

 * Body: { amount, currency, payment_date, payment_method, notes }

 * 

 * Requirement 11.14: Registrar pagos en historial

 */

router.post('/admin/subscriptions/:brandId/payment', adminAuthMiddleware, (req: any, res: any) => {

  subscriptionController.registerPayment(req, res);

});



/**

 * POST /api/admin/subscriptions/reprocess-wompi/:reference

 * Reprocessa un pago de Wompi que fue cobrado pero no activó la suscripción.

 * ñtil cuando el webhook falló silenciosamente. Requiere auth de admin.

 */

router.post('/admin/reprocess-wompi/:reference', adminAuthMiddleware, (req: any, res: any) => {

  subscriptionController.reprocessWompiPayment(req, res);

});



export default router;

