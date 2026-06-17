import { Request, Response, NextFunction } from 'express';
import { sanitizeUrl } from '../utils/logSanitizer';

// Log para rutas importantes (pagos, tryon, integraciones)
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400 || duration > 1000 || req.path.includes('/payment') || req.path.includes('/generate')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${sanitizeUrl(req.originalUrl)} (${res.statusCode}) - ${duration}ms`);
    }
  });

  next();
};
