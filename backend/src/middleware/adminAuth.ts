import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { isTokenBlacklisted } from '../config/redis';
import { AdminService } from '../services/admin.service';



const adminService = new AdminService();



export type AdminPermission =

  | 'brands'

  | 'subscriptions'

  | 'revenue'

  | 'conversion'

  | 'health'

  | 'notifications'

  | 'settings'

  | 'admins'

  | 'marketing';



export interface AdminAuthRequest extends Request {

  admin?: {

    id: string;

    email: string;

    name: string;

    permissions: AdminPermission[];

  };

}



export const adminAuthMiddleware = async (

  req: any,

  res: Response,

  next: NextFunction

): Promise<Response | void> => {

  try {

    // — Prioridad: Cookie HTTP-Only (P1 Hallazgo Auditoría) ————————â

    let token = req.cookies?.admin_token;



    // — Fallback: Header Authorization (Bearer Token) ———————————â

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {

      token = req.headers.authorization.substring(7);

    }



    if (!token) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No se encontró token de administración' });
    }

    // Verificar si el token está en la blacklist (revocado)
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({ error: 'TOKEN_REVOKED', message: 'Sesión ha sido revocada' });
    }

    const payload = verifyToken(token);



    if (!(payload as any).adminId) {

      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token inválido para administrador' });

    }



    const admin = await adminService.getAdminById((payload as any).adminId);
    if (!admin) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Administrador no encontrado' });
    }


    req.admin = {

      id: admin.id,

      email: admin.email,

      name: admin.name,

      permissions: (admin as any).permissions || [],

    };



    next();

  } catch (error: any) {

    return res.status(401).json({ error: 'UNAUTHORIZED', message: error.message || 'Token inválido' });

  }

};



/**

 * Middleware de permiso granular.

 * Uso: router.get('/ruta', adminAuthMiddleware, requirePermission('brands'), handler)

 * Los admins con permissions vacío o que incluyan el permiso solicitado pasan.

 * Si permissions está vacío se asume superadmin (retrocompatibilidad).

 */

export function requirePermission(permission: AdminPermission) {

  return (req: any, res: Response, next: NextFunction): Response | void => {

    const admin = req.admin;

    if (!admin) {

      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });

    }

    // Sin permisos definidos = superadmin (retrocompatibilidad con admins existentes)

    if (!admin.permissions || admin.permissions.length === 0) {

      return next();

    }

    if (admin.permissions.includes(permission)) {

      return next();

    }

    return res.status(403).json({

      error: 'FORBIDDEN',

      message: `No tienes permiso para acceder a este recurso (requiere: ${permission})`,

    });

  };

}

