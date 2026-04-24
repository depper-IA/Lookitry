import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { supabaseAdmin } from '../config/supabase';
import { UploadService } from '../services/upload.service';

const router = Router();

// Products for home tryon (Wilkie Devs brand)
const HOME_TRYON_PRODUCT_IDS = [
  '219f8a80-c7a2-46fd-bf4a-42c31621cede', // Camisa a Cuadros
  'ee5bf4ec-da9b-4cd5-b8da-2484797d0a71', // Bolso Nike Verde
  '7bee6762-3791-4330-86c4-7ec424adfb01', // Casco para moto multi-modular Harley-Davidson
];
const HOME_TRYON_BRAND_SLUG = 'wilkie-devs';

/**
 * Sanitizes product name for use in AI prompts.
 * Prevents prompt injection by stripping dangerous characters.
 * Only allows alphanumeric, spaces, hyphens, underscores, and basic punctuation.
 */
function sanitizeProductNameForPrompt(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[^a-zA-Z0-9\s\-_,.#()]/g, '') // Whitelist: letters, numbers, spaces, safe punctuation
    .trim()
    .slice(0, 50); // Limit length to prevent buffer overflow
}

// GET /api/home/tryon/config - Get products and brand config for home tryon
router.get('/config', asyncHandler(async (req, res) => {
  // Get brand info
  const { data: brand } = await supabaseAdmin
    .from('brands')
    .select('id, name, slug')
    .eq('slug', HOME_TRYON_BRAND_SLUG)
    .single();

  if (!brand) {
    return res.status(404).json({ error: 'Brand not found' });
  }

  // Get products
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, name, short_description, image_url, category, price')
    .in('id', HOME_TRYON_PRODUCT_IDS)
    .eq('is_active', true);

  return res.json({
    brand: {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
    },
    products: products || [],
  });
}));

// GET /api/home/tryon/check - Check if IP has already trialed
router.get('/check', asyncHandler(async (req, res) => {
  const ip = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown';
  const userAgent = req.headers['user-agent'] || '';

  const { data: existingTrial } = await supabaseAdmin
    .from('home_tryon_trials')
    .select('id, created_at')
    .eq('ip_address', ip)
    .maybeSingle();

  return res.json({
    hasTrialed: !!existingTrial,
    trialCount: existingTrial ? 1 : 0,
  });
}));

// POST /api/home/tryon/generate - Generate try-on for home demo
// NOTA: Sin restricciones para testing - cualquier persona puede probar
router.post('/generate', asyncHandler(async (req, res) => {
  // NO verificamos IP ni trial limit - solo procesamos la generación
  const { productId, selfieBase64 } = req.body;

  if (!productId || !selfieBase64) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'productId and selfieBase64 are required' });
  }

  // Validate product is one of our home tryon products
  if (!HOME_TRYON_PRODUCT_IDS.includes(productId)) {
    return res.status(400).json({ error: 'INVALID_PRODUCT', message: 'Product not allowed for home tryon' });
  }

  // Get brand and product info
  const { data: brand } = await supabaseAdmin
    .from('brands')
    .select('id, name, slug')
    .eq('slug', HOME_TRYON_BRAND_SLUG)
    .single();

  if (!brand) {
    return res.status(404).json({ error: 'Brand not found' });
  }

  const { data: product } = await supabaseAdmin
    .from('products')
    .select('id, name, image_url')
    .eq('id', productId)
    .single();

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // NOTE: Trial recording disabled for easier testing
  // TODO: Re-enable after testing is complete

  // 1. Convert base64 to buffer and upload to MinIO
  let selfieUrl: string;
  const uploadService = new UploadService();
  try {
    // Remove data:image/...;base64, prefix if present
    const base64Data = selfieBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const uploadResult = await uploadService.uploadImageBuffer({
      buffer,
      filename: `selfie-${Date.now()}.jpg`,
      temporary: true,
    });
    selfieUrl = uploadResult.url;
    console.log(`[HomeTryon] Selfie uploaded to: ${selfieUrl}`);
  } catch (uploadError: any) {
    console.error('[HomeTryon] Error uploading selfie:', uploadError);
    return res.status(500).json({ error: 'UPLOAD_ERROR', message: 'Error uploading selfie' });
  }

  // 2. Call n8n with URL instead of base64
  try {
    const webhookUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.wilkiedevs.com/webhook/tryon';
    console.log(`[HomeTryon] Calling n8n at ${webhookUrl}`);

    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_WEBHOOK_SECRET || ''}`
      },
      body: JSON.stringify({
        brand_id: brand.id,
        product_id: product.id,
        selfie_url: selfieUrl,
        product_image_url: product.image_url,
        prompt: `Virtual try-on with: ${sanitizeProductNameForPrompt(product.name)}`,
        category: 'demo-home',
        generation_id: `home-demo-${Date.now()}`,
      }),
    });

    console.log(`[HomeTryon] n8n response status: ${n8nResponse.status}`);

    if (!n8nResponse.ok) {
      throw new Error(`N8N error: ${n8nResponse.status}`);
    }

    const text = await n8nResponse.text();
    console.log(`[HomeTryon] n8n response text length: ${text?.length || 0}`);

    if (!text || !text.trim()) {
      throw new Error('N8N returned empty response');
    }

    const result = JSON.parse(text) as { result_image_url?: string; image_url?: string; imageUrl?: string; generation_id?: string };
    console.log(`[HomeTryon] parsed result:`, result);

    return res.json({
      success: true,
      resultImageUrl: result.result_image_url || result.image_url || result.imageUrl,
      generationId: result.generation_id,
    });
  } catch (error: any) {
    console.error('[HomeTryon] Generation error:', error);
    return res.status(500).json({
      error: 'GENERATION_ERROR',
      message: 'Error generating try-on'
    });
  }
}));

export default router;