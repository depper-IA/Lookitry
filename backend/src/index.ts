import app from './app';
import { setupUncaughtExceptionHandlers } from './middleware/errorHandler';
import { startCleanupJob } from './jobs/cleanup.job';

// Configurar manejadores de excepciones no capturadas
setupUncaughtExceptionHandlers();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`🏢 Brands endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/brands/me`);
  console.log(`   PATCH http://localhost:${PORT}/api/brands/me`);
  console.log(`📈 Usage endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/usage/stats`);
  
  // Iniciar cron job de limpieza
  startCleanupJob();
});
