const axios = require('axios');

async function runLoadTest() {
  const url = 'https://api.lookitry.com/health';
  const concurrentRequests = 20;
  
  console.log(`Iniciando prueba de carga en: ${url}`);
  console.log(`Solicitudes concurrentes: ${concurrentRequests}`);
  
  const start = Date.now();
  const requests = Array(concurrentRequests).fill(0).map((_, i) => {
    return axios.get(url)
      .then(res => ({ id: i, status: res.status, time: Date.now() - start, data: res.data }))
      .catch(err => ({ id: i, status: err.response?.status || 'ERROR', error: err.message }));
  });

  const results = await Promise.all(requests);
  const duration = Date.now() - start;
  
  const success = results.filter(r => r.status === 200).length;
  const failed = concurrentRequests - success;
  const avgTime = results.filter(r => r.status === 200).reduce((acc, r) => acc + (r.time || 0), 0) / (success || 1);

  console.log('\n--- Resultados de la prueba ---');
  console.log(`Duración total: ${duration}ms`);
  console.log(`Exitosas: ${success}`);
  console.log(`Fallidas: ${failed}`);
  console.log(`Tiempo promedio de respuesta (exitosas): ${Math.round(avgTime)}ms`);
  
  if (failed > 0) {
    console.log('\nErrores detectados:');
    results.filter(r => r.status !== 200).forEach(r => console.log(`- Req ${r.id}: ${r.status} (${r.error || 'Bad Response'})`));
  }
}

runLoadTest();
