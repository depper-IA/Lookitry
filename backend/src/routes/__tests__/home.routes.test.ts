import request from 'supertest';
import express from 'express';

// Mock supabase admin - fresh chain per call via mockImplementation
let mockChain = {
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
    }),
  }),
  insert: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  }),
};

const mockFrom = jest.fn().mockImplementation(() => mockChain);

jest.mock('../../config/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

// Mock upload service
jest.mock('../../services/upload.service', () => ({
  UploadService: jest.fn().mockImplementation(() => ({
    uploadImageBuffer: jest.fn().mockResolvedValue({ url: 'https://minio.example.com/selfie.jpg' }),
  })),
}));

// Mock isWhitelistedSync
jest.mock('../../middleware/rateLimiter', () => ({
  isWhitelistedSync: jest.fn((ip) => ip === 'WHITELISTED_IP'),
}));

// Mock fetch for n8n
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Shared secret for the proxy -> backend trust gate (read live by the route helper).
const TEST_SECRET = 'test-internal-proxy-secret';
process.env.INTERNAL_PROXY_SECRET = TEST_SECRET;

import homeRouter from '../home.routes';

const app = express();
app.set('trust proxy', true);
app.use(express.json());
app.use('/api/home/tryon', homeRouter);

// Helpers that send the trusted-proxy headers (secret + real client IP) the backend now requires.
const authedGet = (path: string, ip: string) =>
  request(app).get(path).set('x-internal-proxy-secret', TEST_SECRET).set('x-real-client-ip', ip);

const authedPost = (path: string, ip: string) =>
  request(app).post(path).set('x-internal-proxy-secret', TEST_SECRET).set('x-real-client-ip', ip);

// Supabase mock chain builders matching the current route shapes.
// .single() is a callable (route awaits `.eq(...).single()`); count uses `.eq().eq()`.
const singleChain = (data: any) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({ data, error: null }),
    }),
  }),
});
const countChain = (count: number) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ count, error: null }),
    }),
  }),
});
const insertChain = (spy?: jest.Mock) => ({ insert: spy ?? jest.fn().mockResolvedValue({ error: null }) });

// Drives sequential supabaseAdmin.from() calls through the given chains, in order.
// generate() order: brands(single) -> products(single) -> home_tryon_trials(count) -> insert.
const sequenceFrom = (...chains: any[]) => {
  let i = 0;
  mockFrom.mockImplementation(() => chains[Math.min(i++, chains.length - 1)]);
};

const BRAND = { id: 'brand-id', name: 'Test', slug: 'wilkie-devs' };
const PRODUCT_1 = { id: '219f8a80-c7a2-46fd-bf4a-42c31621cede', name: 'Test Product', image_url: 'https://example.com/product.jpg' };
const PRODUCT_2 = { id: 'a15fc145-9e06-48a9-b366-9635289ce078', name: 'Test Product 2', image_url: 'https://example.com/product2.jpg' };

describe('GET /home/tryon/check', () => {
  beforeEach(() => {
    mockFrom.mockClear();
    mockChain = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      }),
    };
  });

  it('returns isWhitelisted=true for whitelisted IPs', async () => {
    const res = await authedGet('/api/home/tryon/check?productId=219f8a80-c7a2-46fd-bf4a-42c31621cede', 'WHITELISTED_IP');

    expect(res.body.isWhitelisted).toBe(true);
    expect(res.body.hasTrialed).toBe(false);
    expect(res.body.trialCount).toBe(0);
  });

  it('returns trialCount=0 and hasTrialed=false when no trials exist for product', async () => {
    mockChain.select.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
      }),
    });

    const res = await authedGet('/api/home/tryon/check?productId=219f8a80-c7a2-46fd-bf4a-42c31621cede', 'UNWHITELISTED_IP');

    expect(res.body.isWhitelisted).toBe(false);
    expect(res.body.hasTrialed).toBe(false);
    expect(res.body.trialCount).toBe(0);
  });

  it('returns trialCount=2 when product has 2 trials', async () => {
    mockChain.select.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ count: 2, error: null }),
      }),
    });

    const res = await authedGet('/api/home/tryon/check?productId=219f8a80-c7a2-46fd-bf4a-42c31621cede', 'UNWHITELISTED_IP');

    expect(res.body.isWhitelisted).toBe(false);
    expect(res.body.hasTrialed).toBe(false);
    expect(res.body.trialCount).toBe(2);
  });

  it('returns hasTrialed=true when product has 3 or more trials', async () => {
    mockChain.select.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ count: 3, error: null }),
      }),
    });

    const res = await authedGet('/api/home/tryon/check?productId=219f8a80-c7a2-46fd-bf4a-42c31621cede', 'UNWHITELISTED_IP');

    expect(res.body.isWhitelisted).toBe(false);
    expect(res.body.hasTrialed).toBe(true);
    expect(res.body.trialCount).toBe(3);
  });
});

describe('POST /home/tryon/generate', () => {
  beforeEach(() => {
    mockFrom.mockClear();
    mockFetch.mockClear();
  });

  it('rejects with 429 when product already has 3 trials', async () => {
    // brand -> product -> trial count (3, exhausted). No insert reached.
    sequenceFrom(singleChain(BRAND), singleChain(PRODUCT_1), countChain(3));

    const res = await authedPost('/api/home/tryon/generate', 'UNWHITELISTED_IP')
      .field('productId', '219f8a80-c7a2-46fd-bf4a-42c31621cede')
      .attach('selfie', Buffer.from('fake-jpeg-bytes'), 'selfie.jpg');

    expect(res.status).toBe(429);
    expect(res.body.error).toBe('TRIAL_LIMIT_EXCEEDED');
  });

  it('allows generation when product has fewer than 3 trials', async () => {
    sequenceFrom(singleChain(BRAND), singleChain(PRODUCT_1), countChain(0), insertChain());

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({
        result_image_url: 'https://example.com/result.jpg',
        generation_id: 'gen-123',
      })),
    });

    const res = await authedPost('/api/home/tryon/generate', 'UNWHITELISTED_IP')
      .field('productId', '219f8a80-c7a2-46fd-bf4a-42c31621cede')
      .attach('selfie', Buffer.from('fake-jpeg-bytes'), 'selfie.jpg');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.resultImageUrl).toBe('https://example.com/result.jpg');
  });

  it('does NOT insert trial record when n8n generation fails', async () => {
    const insertSpy = jest.fn().mockResolvedValue({ error: null });
    sequenceFrom(singleChain(BRAND), singleChain(PRODUCT_1), countChain(1), insertChain(insertSpy));

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const res = await authedPost('/api/home/tryon/generate', 'UNWHITELISTED_IP')
      .field('productId', '219f8a80-c7a2-46fd-bf4a-42c31621cede')
      .attach('selfie', Buffer.from('fake-jpeg-bytes'), 'selfie.jpg');

    expect(res.status).toBe(500);
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it('allows different products independently — P1 exhausted but P2 has trials', async () => {
    // === First request: P1 with 3 trials (exhausted) ===
    sequenceFrom(singleChain(BRAND), singleChain(PRODUCT_1), countChain(3));

    const resP1 = await authedPost('/api/home/tryon/generate', 'UNWHITELISTED_IP')
      .field('productId', '219f8a80-c7a2-46fd-bf4a-42c31621cede')
      .attach('selfie', Buffer.from('fake-jpeg-bytes'), 'selfie.jpg');

    expect(resP1.status).toBe(429);

    // === Second request: P2 with 0 trials (allowed) ===
    sequenceFrom(singleChain(BRAND), singleChain(PRODUCT_2), countChain(0), insertChain());

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({
        result_image_url: 'https://example.com/result.jpg',
        generation_id: 'gen-123',
      })),
    });

    const resP2 = await authedPost('/api/home/tryon/generate', 'UNWHITELISTED_IP')
      .field('productId', 'a15fc145-9e06-48a9-b366-9635289ce078')
      .attach('selfie', Buffer.from('fake-jpeg-bytes'), 'selfie.jpg');

    expect(resP2.status).toBe(200);
  });
});

describe('home/tryon trusted-proxy gate (security)', () => {
  beforeEach(() => {
    mockFrom.mockClear();
    mockFetch.mockClear();
  });

  it('rejects check with 403 when the proxy secret is wrong', async () => {
    const res = await request(app)
      .get('/api/home/tryon/check?productId=219f8a80-c7a2-46fd-bf4a-42c31621cede')
      .set('x-internal-proxy-secret', 'WRONG_SECRET')
      .set('x-real-client-ip', 'UNWHITELISTED_IP');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
  });

  it('rejects generate with 403 when the proxy secret is missing', async () => {
    const res = await request(app)
      .post('/api/home/tryon/generate')
      .set('x-real-client-ip', 'UNWHITELISTED_IP')
      .send({
        productId: '219f8a80-c7a2-46fd-bf4a-42c31621cede',
        selfieBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
  });

  it('rejects with 400 when the real client IP header is absent', async () => {
    const res = await request(app)
      .get('/api/home/tryon/check?productId=219f8a80-c7a2-46fd-bf4a-42c31621cede')
      .set('x-internal-proxy-secret', TEST_SECRET);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('CLIENT_IP_REQUIRED');
  });

  it('rejects with 503 when INTERNAL_PROXY_SECRET is not configured', async () => {
    const original = process.env.INTERNAL_PROXY_SECRET;
    delete process.env.INTERNAL_PROXY_SECRET;
    try {
      const res = await request(app)
        .get('/api/home/tryon/check?productId=219f8a80-c7a2-46fd-bf4a-42c31621cede')
        .set('x-internal-proxy-secret', TEST_SECRET)
        .set('x-real-client-ip', 'UNWHITELISTED_IP');

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('PROXY_NOT_CONFIGURED');
    } finally {
      process.env.INTERNAL_PROXY_SECRET = original;
    }
  });
});