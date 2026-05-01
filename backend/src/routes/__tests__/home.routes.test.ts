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

import homeRouter from '../home.routes';

const app = express();
app.set('trust proxy', true);
app.use(express.json());
app.use('/api/home/tryon', homeRouter);

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
    const res = await request(app)
      .get('/api/home/tryon/check?productId=219f8a80-c7a2-46fd-bf4a-42c31621cede')
      .set('x-forwarded-for', 'WHITELISTED_IP');

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

    const res = await request(app)
      .get('/api/home/tryon/check?productId=219f8a80-c7a2-46fd-bf4a-42c31621cede')
      .set('x-forwarded-for', 'UNWHITELISTED_IP');

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

    const res = await request(app)
      .get('/api/home/tryon/check?productId=219f8a80-c7a2-46fd-bf4a-42c31621cede')
      .set('x-forwarded-for', 'UNWHITELISTED_IP');

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

    const res = await request(app)
      .get('/api/home/tryon/check?productId=219f8a80-c7a2-46fd-bf4a-42c31621cede')
      .set('x-forwarded-for', 'UNWHITELISTED_IP');

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
    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 3, error: null }),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      }),
    }));

    const res = await request(app)
      .post('/api/home/tryon/generate')
      .send({
        productId: '219f8a80-c7a2-46fd-bf4a-42c31621cede',
        selfieBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      })
      .set('x-forwarded-for', 'UNWHITELISTED_IP');

    expect(res.status).toBe(429);
    expect(res.body.error).toBe('TRIAL_LIMIT_EXCEEDED');
  });

  it('allows generation when product has fewer than 3 trials', async () => {
    let chainIndex = 0;
    mockFrom.mockImplementation(() => {
      chainIndex++;
      if (chainIndex === 1) {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
            }),
          }),
        };
      } else if (chainIndex === 2) {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: Promise.resolve({
                data: { id: 'brand-id', name: 'Test', slug: 'wilkie-devs' },
                error: null,
              }),
            }),
          }),
        };
      } else if (chainIndex === 3) {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: Promise.resolve({
                data: { id: '219f8a80-c7a2-46fd-bf4a-42c31621cede', name: 'Test Product', image_url: 'https://example.com/product.jpg' },
                error: null,
              }),
            }),
          }),
        };
      } else {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
          }),
        };
      }
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({
        result_image_url: 'https://example.com/result.jpg',
        generation_id: 'gen-123',
      })),
    });

    const res = await request(app)
      .post('/api/home/tryon/generate')
      .send({
        productId: '219f8a80-c7a2-46fd-bf4a-42c31621cede',
        selfieBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      })
      .set('x-forwarded-for', 'UNWHITELISTED_IP');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.resultImageUrl).toBe('https://example.com/result.jpg');
  });

  it('does NOT insert trial record when n8n generation fails', async () => {
    const insertSpy = jest.fn();
    let chainIndex = 0;
    mockFrom.mockImplementation(() => {
      chainIndex++;
      if (chainIndex === 1) {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 1, error: null }),
            }),
          }),
        };
      } else if (chainIndex === 2) {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: Promise.resolve({
                data: { id: 'brand-id', name: 'Test', slug: 'wilkie-devs' },
                error: null,
              }),
            }),
          }),
        };
      } else if (chainIndex === 3) {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: Promise.resolve({
                data: { id: '219f8a80-c7a2-46fd-bf4a-42c31621cede', name: 'Test Product', image_url: 'https://example.com/product.jpg' },
                error: null,
              }),
            }),
          }),
        };
      } else {
        return { insert: insertSpy };
      }
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const res = await request(app)
      .post('/api/home/tryon/generate')
      .send({
        productId: '219f8a80-c7a2-46fd-bf4a-42c31621cede',
        selfieBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      })
      .set('x-forwarded-for', 'UNWHITELISTED_IP');

    expect(res.status).toBe(500);
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it('allows different products independently — P1 exhausted but P2 has trials', async () => {
    // === First request: P1 with 3 trials (exhausted) ===
    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 3, error: null }),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      }),
    }));

    const resP1 = await request(app)
      .post('/api/home/tryon/generate')
      .send({
        productId: '219f8a80-c7a2-46fd-bf4a-42c31621cede',
        selfieBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      })
      .set('x-forwarded-for', 'UNWHITELISTED_IP');

    expect(resP1.status).toBe(429);

    // === Second request: P2 with 0 trials (allowed) ===
    let chainIndex = 0;
    mockFrom.mockImplementation(() => {
      chainIndex++;
      if (chainIndex === 1) {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
            }),
          }),
        };
      } else if (chainIndex === 2) {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: Promise.resolve({
                data: { id: 'brand-id', name: 'Test', slug: 'wilkie-devs' },
                error: null,
              }),
            }),
          }),
        };
      } else if (chainIndex === 3) {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: Promise.resolve({
                data: { id: 'ee5bf4ec-da9b-4cd5-b8da-2484797d0a71', name: 'Test Product 2', image_url: 'https://example.com/product2.jpg' },
                error: null,
              }),
            }),
          }),
        };
      } else {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
          }),
        };
      }
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({
        result_image_url: 'https://example.com/result.jpg',
        generation_id: 'gen-123',
      })),
    });

    const resP2 = await request(app)
      .post('/api/home/tryon/generate')
      .send({
        productId: 'ee5bf4ec-da9b-4cd5-b8da-2484797d0a71',
        selfieBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      })
      .set('x-forwarded-for', 'UNWHITELISTED_IP');

    expect(resP2.status).toBe(200);
  });
});