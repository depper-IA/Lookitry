import { Request, Response, NextFunction } from 'express';

// Mock Redis client connection status
jest.mock('../../config/redis', () => ({
  redis: {
    status: 'ready',
    call: jest.fn(),
  },
}));

// Mock express-rate-limit to check if it's called
jest.mock('express-rate-limit', () => {
  return jest.fn().mockImplementation(() => {
    return (req: Request, res: Response, next: NextFunction) => {
      next();
    };
  });
});

// Mock rate-limit-redis to avoid real redis protocol calls
jest.mock('rate-limit-redis', () => {
  return jest.fn().mockImplementation(() => {
    return {};
  });
});

import { loginRateLimiter, adminLoginRateLimiter } from '../rateLimiter';
import { redis } from '../../config/redis';

describe('Rate Limiter Fail-Closed', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      ip: '127.0.0.1',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    (redis as any).status = 'ready';
  });

  it('should call next (pass to express-rate-limit) when Redis is ready for user login', () => {
    loginRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should return 503 when Redis is not ready for user login', () => {
    (redis as any).status = 'close';
    loginRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(503);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'SERVICE_UNAVAILABLE',
      })
    );
  });

  it('should call next (pass to express-rate-limit) when Redis is ready for admin login', () => {
    adminLoginRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should return 503 when Redis is not ready for admin login', () => {
    (redis as any).status = 'connecting';
    adminLoginRateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(503);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'SERVICE_UNAVAILABLE',
      })
    );
  });
});