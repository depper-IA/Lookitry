/**
 * Admin Controller Facade
 * 
 * Este archivo actúa como un hub de re-exports para los controladores modulares,
 * manteniendo la compatibilidad con las rutas existentes mientras se migra a una
 * arquitectura de controladores por dominio.
 * 
 * @module AdminController
 */

// 1. Autenticación y Gestión de Administradores
export * from './admin/auth.admin.controller';

// 2. Gestión de Marcas (Brands)
export * from './admin/brand.admin.controller';

// 3. Estadísticas y Métricas (Stats)
export * from './admin/stats.admin.controller';

// 4. Pagos y Suscripciones (Payments)
export * from './admin/payment.admin.controller';

// 5. Operaciones, Configuración e IA (Operational)
export * from './admin/operational.admin.controller';

// 6. Promociones y Cupones (Promotion)
export * from './admin/promotion.admin.controller';

// 7. Feedback de Generación y Calidad (Feedback)
export * from './admin/feedback.admin.controller';

// 8. Integración WooCommerce (Woo)
export * from './admin/woo.admin.controller';

// 9. Operaciones del Sistema (System)
export * from './admin/system.admin.controller';
