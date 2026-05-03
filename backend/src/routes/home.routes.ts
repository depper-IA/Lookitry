import { Router } from 'express';

import { asyncHandler } from '../middleware/errorHandler';

import { supabaseAdmin } from '../config/supabase';

import { UploadService } from '../services/upload.service';

import { isWhitelistedSync } from '../middleware/rateLimiter';

import multer from 'multer';

const router = Router();

// Multer middleware for multipart binary upload (avoids base64 inflation)
const multerMem = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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

// GET /api/home/tryon/check - Check if IP has already trialed for a specific product
router.get('/check', asyncHandler(async (req, res) => {
  const ip = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || 'unknown';
  const productId = req.query.productId as string;

  // Whitelisted IPs (Travis & Sam's dev PCs) bypass trial limit
  if (isWhitelistedSync(ip)) {
    return res.json({
      hasTrialed: false,
      trialCount: 0,
      isWhitelisted: true,
    });
  }

  // If no productId provided, return neutral (frontend should always pass productId)
  if (!productId) {
    return res.json({
      hasTrialed: false,
      trialCount: 0,
      isWhitelisted: false,
    });
  }

  // Count trials for THIS specific product and IP (per-product trial limit of 3)
  const { count } = await supabaseAdmin
    .from('home_tryon_trials')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .eq('product_id', productId);

  const trialCount = count || 0;

  return res.json({
    hasTrialed: trialCount >= 3,
    trialCount: Math.min(trialCount, 3), // cap at 3 for display
    isWhitelisted: false,
  });
}));

// POST /api/home/tryon/generate - Generate try-on for home demo

// Whitelisted IPs bypass trial limit, others get 1 trial only

router.post('/generate', multerMem.single('selfie'), asyncHandler(async (req: any, res) => {
  const productId = req.body.productId as string;

  // Support both multipart (binary) and JSON (base64 legacy)
  const ip = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || 'unknown';

  const isTestIp = isWhitelistedSync(ip);

  if (!productId) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'productId is required' });
  }

  const selfieFile = req.file;
  if (!selfieFile) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'selfie file is required' });
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

// Check trial for non-whitelisted IPs only (per-product limit of 3)
  if (!isTestIp) {
    const { count } = await supabaseAdmin
      .from('home_tryon_trials')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .eq('product_id', productId);

    const trialCount = count || 0;

    if (trialCount >= 3) {
      return res.status(429).json({
        error: 'TRIAL_LIMIT_EXCEEDED',
        message: 'Ya usaste tu prueba gratuita',
        redirectTo: '/planes',
      });
    }
  }

  // 1. Upload selfie as binary multipart (avoids base64 inflation)
  let selfieUrl: string;
  const uploadService = new UploadService();

  try {
    const uploadResult = await uploadService.uploadImageBuffer({
      buffer: selfieFile.buffer,
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

    // Record trial for non-whitelisted IPs
    if (!isTestIp) {
      await supabaseAdmin
        .from('home_tryon_trials')
        .insert({
          ip_address: ip,
          product_id: productId,
          brand_id: brand.id,
        });
    }

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