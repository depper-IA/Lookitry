import { Router } from 'express';

import { ProductsController } from '../controllers/products.controller';

import { uploadImage } from '../controllers/upload.controller';

import { authMiddleware } from '../middleware/auth';

import { checkActiveSubscription } from '../middleware/checkSubscription';



const router = Router();

const productsController = new ProductsController();



// Todas las rutas de products requieren autenticación

router.use(authMiddleware);



// Verificar suscripción activa

router.use(checkActiveSubscription);



// POST /api/products/upload - Subir imagen a WordPress via n8n

router.post('/upload', (req, res) => uploadImage(req, res));



// POST /api/products/describe-ai - Descripción de producto con IA (Vertex AI)
router.post('/describe-ai', (req, res) => productsController.describeProductWithAI(req, res));

// GET /api/products - Listar productos de marca autenticada
router.get('/', (req, res) => productsController.getProducts(req, res));

// GET /api/products/:id - Obtener un producto específico
router.get('/:id', (req, res) => productsController.getProduct(req, res));

// POST /api/products - Crear producto con validación de límite
router.post('/', (req, res) => productsController.createProduct(req, res));



// PUT /api/products/:id - Editar producto

router.put('/:id', (req, res) => productsController.updateProduct(req, res));



// DELETE /api/products/:id - Soft delete, mantener generaciones

router.delete('/:id', (req, res) => productsController.deleteProduct(req, res));



export default router;

