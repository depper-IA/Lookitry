import { Router, Request, Response } from 'express';
import { vertexService, VERTEX_MODELS } from '../services/vertex.service';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * GET /api/vertex/models
 * List all available Vertex AI models
 */
router.get('/models', (req: Request, res: Response) => {
  const models = vertexService.getAvailableModels();
  res.json({ models });
});

/**
 * POST /api/vertex/generate
 * Generate content using Vertex AI
 */
router.post('/generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { model, contents, systemInstruction, generationConfig, safetySettings } = req.body;

    // Validate model
    if (model && !vertexService.isModelAvailable(model)) {
      return res.status(400).json({
        error: 'Invalid model',
        availableModels: Object.keys(VERTEX_MODELS),
      });
    }

    // Validate contents
    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ error: 'contents is required' });
    }

    const result = await vertexService.generateContent({
      model,
      contents,
      systemInstruction,
      generationConfig,
      safetySettings,
    });

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error: any) {
    console.error('[vertex.routes] Error:', error);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

/**
 * POST /api/vertex/stream
 * Stream generate content using Vertex AI
 */
router.post('/stream', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { model, contents, systemInstruction, generationConfig } = req.body;

    // Validate model
    if (model && !vertexService.isModelAvailable(model)) {
      return res.status(400).json({
        error: 'Invalid model',
        availableModels: Object.keys(VERTEX_MODELS),
      });
    }

    // Validate contents
    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ error: 'contents is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of vertexService.streamGenerateContent({
      model,
      contents,
      systemInstruction,
      generationConfig,
    })) {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('[vertex.routes] Stream error:', error);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

export default router;