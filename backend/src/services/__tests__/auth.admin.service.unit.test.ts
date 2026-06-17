import bcrypt from 'bcryptjs';

jest.mock('../../config/supabase', () => ({
  supabase: {},
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

jest.mock('../../config/redis', () => ({
  redis: {
    ttl: jest.fn().mockResolvedValue(-2),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
  },
}));

import { authAdminService } from '../admin/auth.admin.service';
import { supabaseAdmin } from '../../config/supabase';
import { redis } from '../../config/redis';

describe('AuthAdminService Lockout', () => {
  const adminId = 'admin-uuid-123';
  const email = 'admin@lookitry.com';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isLockedOut', () => {
    it('should return false if Redis has no lockout key and DB locked_until is null or past', async () => {
      (redis.ttl as jest.Mock).mockResolvedValue(-2);
      
      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { locked_until: null },
            error: null,
          }),
        }),
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({ select: selectMock });

      const result = await authAdminService.isLockedOut(adminId);
      expect(result.locked).toBe(false);
    });

    it('should return true if Redis lockout key is set', async () => {
      (redis.ttl as jest.Mock).mockResolvedValue(600); // 10 minutes left
      
      const result = await authAdminService.isLockedOut(adminId);
      expect(result.locked).toBe(true);
      expect(result.reason).toContain('Cuenta bloqueada');
    });

    it('should return true if DB locked_until is in the future', async () => {
      (redis.ttl as jest.Mock).mockResolvedValue(-2);
      
      const futureDate = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { locked_until: futureDate },
            error: null,
          }),
        }),
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({ select: selectMock });

      const result = await authAdminService.isLockedOut(adminId);
      expect(result.locked).toBe(true);
      expect(result.reason).toContain('Cuenta bloqueada');
    });
  });

  describe('recordFailedAttempt', () => {
    it('should increment attempt counter in Redis', async () => {
      (redis.incr as jest.Mock).mockResolvedValue(2);
      await authAdminService.recordFailedAttempt(adminId, '127.0.0.1');
      expect(redis.incr).toHaveBeenCalledWith(`admin:failed:${adminId}`);
    });

    it('should lock out in Redis if attempts >= 5', async () => {
      (redis.incr as jest.Mock).mockResolvedValue(5);
      await authAdminService.recordFailedAttempt(adminId, '127.0.0.1');
      expect(redis.setex).toHaveBeenCalledWith(`admin:lockout:${adminId}`, 15 * 60, '1');
      expect(redis.del).toHaveBeenCalledWith(`admin:failed:${adminId}`);
    });
  });

  describe('resetFailedAttempts', () => {
    it('should delete keys in Redis and reset attempts in DB', async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      (supabaseAdmin.from as jest.Mock).mockReturnValue({ update: updateMock });

      await authAdminService.resetFailedAttempts(adminId);

      expect(redis.del).toHaveBeenCalledWith(`admin:failed:${adminId}`);
      expect(redis.del).toHaveBeenCalledWith(`admin:lockout:${adminId}`);
      expect(supabaseAdmin.from).toHaveBeenCalledWith('admins');
      expect(updateMock).toHaveBeenCalledWith({
        failed_login_attempts: 0,
        locked_until: null,
      });
    });
  });
});