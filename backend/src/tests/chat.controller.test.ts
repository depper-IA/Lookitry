import { Request, Response } from 'express';
import { receiveWebhook, getConversations } from '../controllers/chat.controller';
import { supabaseAdmin } from '../config/supabase';

jest.mock('../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis()
  }
}));

describe('Chat Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  it('receiveWebhook should return 400 if platform_id is missing', async () => {
    mockRequest.body = { content: 'hello' };
    await receiveWebhook(mockRequest as Request, mockResponse as Response);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
  });

  it('getConversations should return 200 with data', async () => {
    (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValueOnce({ data: [], error: null })
    });
    
    await getConversations(mockRequest as Request, mockResponse as Response);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });
});
