/**
 * sanitizeError â Utilidad para sanitizar mensajes de error antes de enviarlos al cliente.
 * En producción retorna mensajes genéricos para evitar fuga de información interna.
 * En desarrollo retorna el mensaje original para facilitar debugging.
 */

const GENERIC_ERROR = 'Error interno del servidor';
const GENERIC_DB_ERROR = 'Error de base de datos';
const GENERIC_VALIDATION_ERROR = 'Error de validación';

const isDev = process.env.NODE_ENV !== 'production';

export function sanitizeError(err: unknown, fallbackMessage?: string): string {
  if (isDev && err instanceof Error) {
    return err.message;
  }

  const message = (err as any)?.message ?? fallbackMessage ?? GENERIC_ERROR;

  // Nunca exponer detalles internos de Supabase/PostgreSQL
  if (typeof message === 'string') {
    // Detectar errores de base de datos por código o patrón
    if (
      message.includes('violates unique constraint') ||
      message.includes('duplicate key') ||
      message.includes('23505') ||
      message.includes('column') ||
      message.includes('relation') ||
      message.includes('syntax error') ||
      message.includes('permission denied')
    ) {
      return fallbackMessage ?? GENERIC_DB_ERROR;
    }

    // Detectar errores de validación
    if (
      message.includes('violates check constraint') ||
      message.includes('23514') ||
      message.includes('23502') ||
      message.includes('23503')
    ) {
      return fallbackMessage ?? GENERIC_VALIDATION_ERROR;
    }
  }

  return fallbackMessage ?? GENERIC_ERROR;
}
