import { Response } from 'express';
import { CategoryAttributesService, AttributeDefinition } from '../services/categoryAttributes.service';
import { AuthRequest } from '../middleware/auth';
import { sanitizeError } from '../utils/sanitizeError';

const categoryAttributesService = new CategoryAttributesService();

export class CategoryAttributesController {
  /**
   * GET /api/category-attributes - Obtener todos los atributos por categoría
   */
  async getAll(req: AuthRequest, res: Response) {
    try {
      const attributes = await categoryAttributesService.getAllCategoryAttributes();
      return res.status(200).json(attributes);
    } catch (error: any) {
      console.error('Error en getAllCategoryAttributes:', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Error al obtener atributos de categorías',
      });
    }
  }

  /**
   * GET /api/category-attributes/:category - Obtener atributos para una categoría específica
   */
  async getByCategory(req: AuthRequest, res: Response) {
    try {
      const { category } = req.params;

      if (!category) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Categoría requerida',
        });
      }

      const attributes = await categoryAttributesService.getAttributesByCategory(category);

      if (!attributes) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'No se encontraron atributos para esta categoría',
        });
      }

      return res.status(200).json(attributes);
    } catch (error: any) {
      console.error('Error en getByCategory:', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Error al obtener atributos de la categoría',
      });
    }
  }

  /**
   * POST /api/category-attributes - Crear o actualizar atributos de una categoría
   */
  async upsert(req: AuthRequest, res: Response) {
    try {
      const { category_key, category_label, attributes } = req.body;

      if (!category_key || !category_label) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'category_key y category_label son requeridos',
        });
      }

      if (!Array.isArray(attributes)) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'attributes debe ser un array',
        });
      }

      // Validar estructura de cada atributo
      for (const attr of attributes) {
        if (!attr.key || !attr.label || !attr.type) {
          return res.status(400).json({
            error: 'VALIDATION_ERROR',
            message: 'Cada atributo debe tener key, label y type',
          });
        }
        if (!['text', 'number', 'select', 'tags', 'boolean'].includes(attr.type)) {
          return res.status(400).json({
            error: 'VALIDATION_ERROR',
            message: 'Tipo de atributo inválido. Valores válidos: text, number, select, tags, boolean',
          });
        }
      }

      const result = await categoryAttributesService.upsertCategoryAttributes(
        category_key,
        category_label,
        attributes as AttributeDefinition[]
      );

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error en upsertCategoryAttributes:', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: sanitizeError(error, 'Error al guardar atributos de categoría'),
      });
    }
  }

  /**
   * DELETE /api/category-attributes/:categoryKey - Eliminar atributos de una categoría
   */
  async delete(req: AuthRequest, res: Response) {
    try {
      const { categoryKey } = req.params;

      if (!categoryKey) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'CategoryKey requerida',
        });
      }

      await categoryAttributesService.deleteCategoryAttributes(categoryKey);

      return res.status(200).json({
        success: true,
        message: 'Atributos de categoría eliminados correctamente',
      });
    } catch (error: any) {
      console.error('Error en deleteCategoryAttributes:', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: sanitizeError(error, 'Error al eliminar atributos de categoría'),
      });
    }
  }
}
