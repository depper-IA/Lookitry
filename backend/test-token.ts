import { verifyToken } from './src/utils/jwt';
import dotenv from 'dotenv';
dotenv.config();
process.env.JWT_SECRET = '***REMOVED-SECRET***';

const token = '***REMOVED-SECRET***';

try {
  const payload = verifyToken(token);
  console.log('Token is valid:', payload);
} catch (e: any) {
  console.error('Token is invalid:', e.message);
}
