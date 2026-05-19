import { verifyToken } from './src/utils/jwt';
import dotenv from 'dotenv';
dotenv.config();
process.env.JWT_SECRET = 'PE5uvUMbFsyrxjyL8JPmvxxtcxY9lMDnqePvfy3LRtmDIJIGFvg+N+i6FpVxulVPTYZfvo5rVmzb5V5Y/WWSsA==';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJicmFuZElkIjoiY2Y5NWYyNzItOGRlOS00NWUyLTkyOTAtZDAyNjMxMmYyYzMxIiwiZW1haWwiOiJzYW13aWxraWVkZXZzQGdtYWlsLmNvbSIsImlhdCI6MTc3Nzk5NTQ4MSwiZXhwIjoxNzgwNTg3NDgxfQ.RLhzrzCJkOqgCePHPOACMbu2pGtKoe_Z3rHUVzBvk7o';

try {
  const payload = verifyToken(token);
  console.log('Token is valid:', payload);
} catch (e: any) {
  console.error('Token is invalid:', e.message);
}
