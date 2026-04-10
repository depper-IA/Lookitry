import app from './app';
import { setupUncaughtExceptionHandlers } from './middleware/errorHandler';
import { startCleanupJob } from './jobs/cleanup.job';
import { startBlogJob } from './jobs/blog.job';

// Capturar CUALQUIER error no manejado antes de que mate el proceso
process.on('uncaughtException', (err) => {
  console.error('[FATAL] uncaughtException:', err.message, err.stack);
});

process.on('unhandledRejection', (reason: any) => {
  const msg = reason instanceof Error ? reason.stack || reason.message : String(reason);
  console.error('[FATAL] unhandledRejection:', msg);
  // En producción NO matar el proceso
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Configurar manejadores de excepciones no capturadas
setupUncaughtExceptionHandlers();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Auth: POST /api/auth/register | POST /api/auth/login`);

  // Iniciar cron job de limpieza y blog
  startCleanupJob();
  startBlogJob();
});
