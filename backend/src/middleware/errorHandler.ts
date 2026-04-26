import { Request, Response, NextFunction } from 'express';



/**

 * Clase base para errores personalizados de la aplicación

 */

export class AppError extends Error {

  public statusCode: number;

  public isOperational: boolean;

  public code?: string;



  constructor(message: string, statusCode: number, code?: string) {

    super(message);

    this.statusCode = statusCode;

    this.isOperational = true;

    this.code = code;



    Error.captureStackTrace(this, this.constructor);

  }

}



/**

 * Errores específicos de la aplicación

 */

export class ValidationError extends AppError {

  constructor(message: string) {

    super(message, 400, 'VALIDATION_ERROR');

  }

}



export class AuthenticationError extends AppError {

  constructor(message: string = 'No autorizado') {

    super(message, 401, 'AUTHENTICATION_ERROR');

  }

}



export class AuthorizationError extends AppError {

  constructor(message: string = 'Acceso denegado') {

    super(message, 403, 'AUTHORIZATION_ERROR');

  }

}



export class NotFoundError extends AppError {

  constructor(message: string = 'Recurso no encontrado') {

    super(message, 404, 'NOT_FOUND');

  }

}



export class LimitExceededError extends AppError {
  public usage?: {

    used: number;

    limit: number;

  };



  constructor(message: string, usage?: { used: number; limit: number }) {
    super(message, 403, 'LIMIT_EXCEEDED');
    this.usage = usage;
  }
}


export class ExternalServiceError extends AppError {

  constructor(message: string, service: string) {

    super(message, 502, `EXTERNAL_SERVICE_ERROR_${service.toUpperCase()}`);

  }

}



export class ConcurrencyLimitError extends AppError {

  public queueTimeoutMs?: number;



  constructor(message: string, queueTimeoutMs?: number) {

    super(message, 429, 'CONCURRENCY_LIMIT_EXCEEDED');

    this.queueTimeoutMs = queueTimeoutMs;

  }

}



/**

 * Interfaz para respuestas de error estandarizadas

 */

interface ErrorResponse {

  error: string;

  message: string;

  details?: any;

  timestamp: string;

  path?: string;

  stack?: string;

}



/**

 * Logger simple para errores

 */

class ErrorLogger {

  private isDevelopment = process.env.NODE_ENV === 'development';



  log(error: Error, req?: Request) {

    const timestamp = new Date().toISOString();

    const logData = {

      timestamp,

      message: error.message,

      stack: error.stack,

      method: req?.method,

      path: req?.path,

      body: req?.body,

      query: req?.query,

      params: req?.params,

      ip: req?.ip,

    };



    if (error instanceof AppError && error.isOperational) {

      // Error operacional esperado

      console.warn('â ï¸  Error Operacional:', JSON.stringify(logData, null, 2));

    } else {

      // Error inesperado del sistema

      console.error('â Error del Sistema:', JSON.stringify(logData, null, 2));

    }



    // En producción, aquí podrías enviar a un servicio de logging externo

    // como Sentry, LogRocket, CloudWatch, etc.

    if (!this.isDevelopment) {

      // TODO: Integrar con servicio de logging externo

      // Ejemplo: Sentry.captureException(error);

    }

  }

}



const errorLogger = new ErrorLogger();



/**

 * Middleware de manejo de errores global

 * Debe ser el último middleware en la cadena

 */

export const errorHandler = (

  err: Error,

  req: Request,

  res: Response,

  next: NextFunction

) => {

  // Log del error

  errorLogger.log(err, req);



  // Si ya se envió la respuesta, delegar al manejador por defecto de Express

  if (res.headersSent) {

    return next(err);

  }



  // Preparar respuesta de error

  const errorResponse: ErrorResponse = {

    error: 'INTERNAL_ERROR',

    message: 'Error interno del servidor',

    timestamp: new Date().toISOString(),

    path: req.path,

  };



  let statusCode = 500;



  // Manejar errores personalizados de la aplicación

  if (err instanceof AppError) {

    statusCode = err.statusCode;

    errorResponse.error = err.code || 'APP_ERROR';

    errorResponse.message = err.message;



    // Agregar información adicional para errores de límite

    if (err instanceof LimitExceededError && err.usage) {

      errorResponse.details = {

        usage: err.usage,

      };

    }



    if (err instanceof ConcurrencyLimitError && err.queueTimeoutMs) {

      errorResponse.details = {

        queueTimeoutMs: err.queueTimeoutMs,

        retryAfter: Math.ceil(err.queueTimeoutMs / 1000),

      };

    }

  }

  // Manejar errores de validación de Supabase

  else if (err.name === 'PostgrestError') {

    statusCode = 400;

    errorResponse.error = 'DATABASE_ERROR';

    errorResponse.message = 'Error en la base de datos';

    errorResponse.details = process.env.NODE_ENV === 'development' ? err.message : undefined;

  }

  // Manejar errores de JWT

  else if (err.name === 'JsonWebTokenError') {

    statusCode = 401;

    errorResponse.error = 'INVALID_TOKEN';

    errorResponse.message = 'Token inválido';

  } else if (err.name === 'TokenExpiredError') {

    statusCode = 401;

    errorResponse.error = 'TOKEN_EXPIRED';

    errorResponse.message = 'Token expirado';

  }

  // Manejar errores de Multer (archivos)

  else if (err.name === 'MulterError') {

    statusCode = 400;

    errorResponse.error = 'FILE_UPLOAD_ERROR';

    

    if (err.message.includes('File too large')) {

      errorResponse.message = 'El archivo es demasiado grande (máximo 5MB)';

    } else if (err.message.includes('Unexpected field')) {

      errorResponse.message = 'Campo de archivo inesperado';

    } else {

      errorResponse.message = 'Error al subir el archivo';

    }

  }

  // Errores inesperados del sistema

  else {

    // En desarrollo, mostrar detalles del error

    if (process.env.NODE_ENV === 'development') {

      errorResponse.message = err.message;

      errorResponse.stack = err.stack;

    }

  }



  // Enviar respuesta

  res.status(statusCode).json(errorResponse);

};



/**

 * Middleware para capturar errores asíncronos

 * Envuelve funciones async para capturar errores automáticamente

 */

export const asyncHandler = (

  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>

) => {

  return (req: Request, res: Response, next: NextFunction) => {

    Promise.resolve(fn(req, res, next)).catch(next);

  };

};



/**

 * Middleware para manejar rutas no encontradas (404)

 */

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {

  const error = new NotFoundError(`Ruta no encontrada: ${req.method} ${req.path}`);

  next(error);

};



/**

 * Manejador de errores no capturados â no-op, los handlers reales están en index.ts

 */

export const setupUncaughtExceptionHandlers = () => {

  // Los handlers de uncaughtException y unhandledRejection se registran en index.ts

  // para tener control total sobre el comportamiento en producción vs desarrollo.

};

