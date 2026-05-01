// routes/ai.routes.ts
// Phase 4: AI Product Descriptor route endpoint

import { Router, Request, Response } from 'express';
import { descriptorService, ValidationError, VertexError } from '../services/ai-descriptor/ai-descriptor.service';
import { DescribeProductInputSchema } from '../services/ai-descriptor/schemas';

const router = Router();

/**
 * POST /api/ai/describe-product
 * Generate AI product description using Vertex AI with polymorphic schemas.
 *
 * Input: { name, category, brand_description? }
 * Output: Discriminated union { CLOTHING | ACCESSORY | FOOTWEAR }
 */
router.post('/describe-product', async (req: Request, res: Response) => {
  try {
    // Validate input with Zod schema
    const parseResult = DescribeProductInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      const fieldName = issue.path.includes('name') ? 'name' : issue.path.includes('category') ? 'category' : null;
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: fieldName ? `${fieldName} is required` : issue.message,
      });
    }

    // Call the descriptor service
    const description = await descriptorService.describeProduct(parseResult.data);

    return res.status(200).json(description);
  } catch (err: any) {
    // Handle ValidationError (Zod validation failed) — HTTP 502
    if (err instanceof ValidationError) {
      return res.status(502).json({
        error: 'VALIDATION_ERROR',
        message: 'AI response validation failed',
      });
    }

    // Handle VertexError (Vertex AI errors, non-JSON, timeout) — HTTP 500
    if (err instanceof VertexError) {
      return res.status(500).json({
        error: 'VERTEX_ERROR',
        message: 'AI service error',
      });
    }

    // Generic error — HTTP 500
    console.error('[ai.routes] Unexpected error:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

export default router;