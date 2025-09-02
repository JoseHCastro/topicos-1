#!/usr/bin/env node

/**
 * 🔥 MONITOR EN TIEMPO REAL PARA DEMO DE 100K REQUESTS
 * 
 * Ejecutar: node scripts/demo-100k-monitor.js
 * 
 * Monitorea las métricas del sistema durante la demo de carga masiva
 */

const http = require('http');

const CONFIG = {
  baseUrl: process.env.API_URL || 'http://localhost:3000',
  refreshInterval: 2000, // 2 segundos
  displayRows: 30,
};

let lastStats = null;

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `${CONFIG.baseUrl}${path}`;
    
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function getSystemStats() {
  try {
    const [queueStats, monitoringStats, loadTestStats, cacheStats] = await Promise.all([
      makeRequest('/queues/stats'),
      makeRequest('/monitoring/stats'),
      makeRequest('/load-test/active'),
      makeRequest('/monitoring/cache').catch(() => null), // Cache might not be available yet
    ]);

    return {
      queues: queueStats,
      monitoring: monitoringStats,
      loadTests: loadTestStats,
      cache: cacheStats,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching stats:', error.message);
    return null;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatNumber(num) {
  return num.toLocaleString();
}

function displayStats(stats) {
  if (!stats) return;

  // Clear screen
  console.clear();
  
  // Header
  console.log(colorize('═'.repeat(80), 'blue'));
  console.log(colorize('🚀 DEMO 100K REQUESTS - MONITOR EN TIEMPO REAL', 'bright'));
  console.log(colorize(`📅 ${stats.timestamp.toLocaleString()}`, 'cyan'));
  console.log(colorize('═'.repeat(80), 'blue'));

  // Queue Stats
  console.log(colorize('\n📊 ESTADO DE COLAS:', 'yellow'));
  console.log('┌─────────────┬─────────────┬─────────────┬─────────────┐');
  console.log('│    Cola     │   Waiting   │ Processing  │   Timeout   │');
  console.log('├─────────────┼─────────────┼─────────────┼─────────────┤');
  
  const queues = stats.queues.queues || {};
  Object.entries(queues).forEach(([name, queue]) => {
    const nameCol = name.padEnd(11);
    const waitingCol = String(queue.waiting || 0).padStart(9);
    const processingCol = String(queue.processing || 0).padStart(9);
    const timeoutCol = `${queue.timeout || 'N/A'}s`.padStart(9);
    
    console.log(`│ ${nameCol} │ ${waitingCol}   │ ${processingCol}   │ ${timeoutCol}   │`);
  });
  console.log('└─────────────┴─────────────┴─────────────┴─────────────┘');

  // System Resources
  if (stats.monitoring.memory) {
    console.log(colorize('\n💾 RECURSOS DEL SISTEMA:', 'yellow'));
    const memory = stats.monitoring.memory;
    
    console.log(`Heap Used:     ${colorize(formatBytes(memory.current.heapUsed), 'green')}`);
    console.log(`Heap Total:    ${formatBytes(memory.current.heapTotal)}`);
    console.log(`RSS:           ${formatBytes(memory.current.rss)}`);
    console.log(`Memory Usage:  ${colorize(`${memory.usagePercent.toFixed(1)}%`, 
      memory.usagePercent > 80 ? 'red' : 'green')}`);
  }

  // Workers
  if (stats.monitoring.workers) {
    console.log(colorize('\n⚡ WORKERS:', 'yellow'));
    const workers = stats.monitoring.workers;
    
    console.log(`Jobs Processed: ${colorize(formatNumber(workers.totalJobsProcessed), 'green')}`);
    console.log(`Heavy Jobs:     ${formatNumber(workers.heavyJobsProcessed)}`);
    console.log(`Uptime:         ${Math.round(workers.uptime / 1000)}s`);
  }

  // Cache Statistics
  if (stats.cache && stats.cache.status === 'success') {
    console.log(colorize('\n🚀 CACHE LRU:', 'yellow'));
    const cache = stats.cache.cache;
    
    console.log(`Hit Rate:       ${colorize(`${cache.hitRate.toFixed(1)}%`, 
      cache.hitRate > 70 ? 'green' : cache.hitRate > 30 ? 'yellow' : 'red')}`);
    console.log(`Entries:        ${cache.size}/${cache.maxSize}`);
    console.log(`Memory Usage:   ${cache.performance.memoryUsageMB}MB`);
    console.log(`Avg Response:   ${cache.performance.averageResponseTimeMs}ms`);
    console.log(`Operations:     ${formatNumber(cache.totalOperations)}`);
    console.log(`Evictions:      ${cache.evictions}`);
    
    if (cache.health.issues.length > 0) {
      console.log(`Issues:         ${colorize(cache.health.issues.join(', '), 'red')}`);
    }
  }

  // Active Load Tests
  if (stats.loadTests && stats.loadTests.length > 0) {
    console.log(colorize('\n🔥 TESTS DE CARGA ACTIVOS:', 'yellow'));
    
    stats.loadTests.forEach(test => {
      const duration = Math.round((Date.now() - test.startTime) / 1000);
      const jobsPerSecond = duration > 0 ? (test.totalJobsCreated / duration).toFixed(1) : '0';
      const successRate = test.totalJobsCreated > 0 
        ? ((test.totalJobsCompleted / test.totalJobsCreated) * 100).toFixed(1)
        : '0';

      console.log(`Test ID: ${colorize(test.testId, 'cyan')}`);
      console.log(`Progress: ${test.totalJobsCompleted}/${test.config.totalJobs} ` +
                 `(${((test.totalJobsCompleted / test.config.totalJobs) * 100).toFixed(1)}%)`);
      console.log(`Throughput: ${colorize(`${jobsPerSecond} jobs/sec`, 'green')}`);
      console.log(`Success Rate: ${colorize(`${successRate}%`, 
        parseFloat(successRate) > 95 ? 'green' : 'red')}`);
      console.log(`Duración: ${duration}s`);
      console.log(`Errores: ${colorize(test.errors.length, test.errors.length > 0 ? 'red' : 'green')}`);
      console.log('');
    });
  }

  // Performance indicators
  console.log(colorize('\n🎯 MÉTRICAS OBJETIVO:', 'yellow'));
  console.log(`Throughput Target: ${colorize('> 1000 jobs/sec', 'cyan')}`);
  console.log(`Success Rate Target: ${colorize('> 95%', 'cyan')}`);
  console.log(`Memory Target: ${colorize('< 1GB', 'cyan')}`);

  // Footer
  console.log(colorize('\n═'.repeat(80), 'blue'));
  console.log(colorize('Presiona Ctrl+C para salir', 'magenta'));
}

async function startMonitoring() {
  console.log(colorize('🚀 Iniciando monitor para demo de 100K requests...', 'bright'));
  console.log(colorize(`📡 Conectando a: ${CONFIG.baseUrl}`, 'cyan'));
  console.log(colorize(`🔄 Actualizando cada ${CONFIG.refreshInterval/1000}s\n`, 'cyan'));

  // Primer check de conectividad
  try {
    await makeRequest('/health');
    console.log(colorize('✅ Conexión establecida\n', 'green'));
  } catch (error) {
    console.error(colorize(`❌ Error de conexión: ${error.message}`, 'red'));
    console.log(colorize('Asegúrate de que el servidor esté ejecutándose en ' + CONFIG.baseUrl, 'yellow'));
    process.exit(1);
  }

  // Loop principal
  const interval = setInterval(async () => {
    const stats = await getSystemStats();
    if (stats) {
      displayStats(stats);
      lastStats = stats;
    }
  }, CONFIG.refreshInterval);

  // Cleanup on exit
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log(colorize('\n\n👋 Monitor detenido. ¡Gracias!', 'bright'));
    process.exit(0);
  });

  // Primera actualización inmediata
  const stats = await getSystemStats();
  if (stats) {
    displayStats(stats);
  }
}

// Información de uso
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
${colorize('🔥 DEMO 100K REQUESTS MONITOR', 'bright')}

${colorize('Uso:', 'yellow')}
  node scripts/demo-100k-monitor.js

${colorize('Variables de entorno:', 'yellow')}
  API_URL    URL base de la API (default: http://localhost:3000)

${colorize('Ejemplos:', 'yellow')}
  node scripts/demo-100k-monitor.js
  API_URL=http://localhost:3001 node scripts/demo-100k-monitor.js

${colorize('Para iniciar la demo:', 'yellow')}
  curl -X POST http://localhost:3000/load-test/demo-100k

${colorize('Para ver diferentes configuraciones:', 'yellow')}
  # Cambiar concurrencia
  curl -X POST "http://localhost:3000/load-test/demo-100k?concurrency=1000"
  
  # Cambiar tipo de cola
  curl -X POST "http://localhost:3000/load-test/demo-100k?queueType=critical"
`);
  process.exit(0);
}

// Iniciar
startMonitoring().catch(error => {
  console.error(colorize(`💥 Error fatal: ${error.message}`, 'red'));
  process.exit(1);
});
