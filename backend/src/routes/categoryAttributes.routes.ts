import { Router } from 'express';
import { CategoryAttributesController } from '../controllers/categoryAttributes.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const categoryAttributesController = new CategoryAttributesController();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/category-attributes - Obtener todos los atributos por categoría
router.get('/', (req, res) => categoryAttributesController.getAll(req, res));

// GET /api/category-attributes/:category - Obtener atributos para una categoría específica
router.get('/:category', (req, res) => categoryAttributesController.getByCategory(req, res));

// POST /api/category-attributes - Crear o actualizar atributos de una categoría
router.post('/', (req, res) => categoryAttributesController.upsert(req, res));

// DELETE /api/category-attributes/:categoryKey - Eliminar atributos de una categoría
router.delete('/:categoryKey', (req, res) => categoryAttributesController.delete(req, res));

export default router;
