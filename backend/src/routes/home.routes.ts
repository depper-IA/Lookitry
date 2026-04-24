import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { supabaseAdmin } from '../config/supabase';
import { publicRateLimiter, isWhitelistedSync } from '../middleware/rateLimiter';

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
router.get('/config', publicRateLimiter, asyncHandler(async (req, res) => {
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
router.get('/check', publicRateLimiter, asyncHandler(async (req, res) => {
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
router.post('/generate', publicRateLimiter, asyncHandler(async (req, res) => {
  const ip = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown';
  const userAgent = req.headers['user-agent'] || '';
  const { productId, selfieBase64 } = req.body;

  // Check if IP is whitelisted (use real IP from x-forwarded-for, not req.ip which is Docker internal)
  const isTestIp = isWhitelistedSync(ip);

if (!productId || !selfieBase64) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'productId and selfieBase64 are required' });
  }

  // Check if IP already trialed (skip for whitelisted IPs)
  // isTestIp was already declared above (line 83)
  if (!isTestIp) {
    const { data: existingTrial } = await supabaseAdmin
      .from('home_tryon_trials')
      .select('id')
      .eq('ip_address', ip)
      .maybeSingle();

    if (existingTrial) {
      return res.status(429).json({
        error: 'TRIAL_LIMIT_EXCEEDED',
        message: 'Ya usaste tu prueba gratuita',
        redirectTo: '/planes'
      });
    }
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

  // Record this trial BEFORE generation (skip for whitelisted test IPs)
  if (!isTestIp) {
    const { error: insertError } = await supabaseAdmin
      .from('home_tryon_trials')
      .insert({
        ip_address: ip,
        product_id: productId,
        brand_id: brand.id,
        user_agent: userAgent,
      });

    if (insertError) {
      console.error('[HomeTryon] Error recording trial:', insertError);
    }
  } else {
    console.log(`[HomeTryon] Skipping trial recording for whitelisted test IP: ${ip}`);
  }

  // Call the existing pruebalo controller to generate
  // We re-use the existing n8n integration
  try {
    const webhookUrl = process.env.N8N_TRYON_URL || 'https://n8n.wilkiedevs.com/webhook/tryon';

    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_WEBHOOK_SECRET || ''}`
      },
      body: JSON.stringify({
        brand_id: brand.id,
        product_id: product.id,
        selfie_url: `data:image/jpeg;base64,${selfieBase64}`,
        product_image_url: product.image_url,
        prompt: `Virtual try-on with: ${sanitizeProductNameForPrompt(product.name)}`,
        category: 'demo-home',
        generation_id: `home-demo-${Date.now()}`,
      }),
    });

    if (!n8nResponse.ok) {
      throw new Error(`N8N error: ${n8nResponse.status}`);
    }

    const result = await n8nResponse.json() as { result_image_url?: string; image_url?: string; generation_id?: string };

    return res.json({
      success: true,
      resultImageUrl: result.result_image_url || result.image_url,
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