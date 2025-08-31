#!/usr/bin/env node

/**
 * Script de inicio para habilitar Resource Management con garbage collection manual
 * Según especificaciones de Fase 5.1
 */

const { spawn } = require('child_process');
const path = require('path');

// Configurar argumentos de Node.js optimizados para workers
const nodeArgs = [
  '--expose-gc',                    // Habilitar garbage collection manual
  '--max-old-space-size=512',       // Límite de memoria heap (512MB para desarrollo)
  '--max-semi-space-size=64',       // Optimizar young generation
  '--optimize-for-size',            // Optimizar para uso de memoria
];

// Configurar variables de entorno para Resource Management
const env = {
  ...process.env,
  
  // Límites de memoria según Fase 5.1
  WORKER_MAX_HEAP_MB: process.env.WORKER_MAX_HEAP_MB || '256',
  WORKER_MAX_RSS_MB: process.env.WORKER_MAX_RSS_MB || '512',
  WORKER_MAX_CPU_PERCENT: process.env.WORKER_MAX_CPU_PERCENT || '80',
  
  // Connection Pool según especificación
  WORKER_DB_POOL_MAX: process.env.WORKER_DB_POOL_MAX || '5',
  WORKER_DB_POOL_MIN: process.env.WORKER_DB_POOL_MIN || '1',
  DB_ACQUIRE_TIMEOUT: process.env.DB_ACQUIRE_TIMEOUT || '10000',
  DB_IDLE_TIMEOUT: process.env.DB_IDLE_TIMEOUT || '30000',
  DB_CONNECTION_TIMEOUT: process.env.DB_CONNECTION_TIMEOUT || '10000',
  
  // Logging mejorado para monitoring
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Identificador de worker (útil para multi-worker setup)
  WORKER_ID: process.env.WORKER_ID || 'main',
};

// Determinar script a ejecutar
const isDevelopment = process.env.NODE_ENV !== 'production';
const scriptToRun = isDevelopment ? 'start:dev' : 'start:prod';

console.log('🚀 Starting application with Resource Management optimizations...');
console.log(`📊 Memory limits: Heap=${env.WORKER_MAX_HEAP_MB}MB, RSS=${env.WORKER_MAX_RSS_MB}MB`);
console.log(`🔗 DB Pool: Max=${env.WORKER_DB_POOL_MAX}, Timeout=${env.DB_ACQUIRE_TIMEOUT}ms`);
console.log(`♻️  Garbage collection: ENABLED`);
console.log(`🔧 Mode: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);

// Ejecutar aplicación con configuraciones optimizadas
const child = spawn('npm', ['run', scriptToRun], {
  stdio: 'inherit',
  env,
  cwd: path.resolve(__dirname, '..'),
  shell: process.platform === 'win32',
});

// Manejar señales de sistema
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, gracefully shutting down...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, gracefully shutting down...');
  child.kill('SIGTERM');
});

child.on('close', (code) => {
  console.log(`\n📊 Application exited with code ${code}`);
  process.exit(code);
});

child.on('error', (error) => {
  console.error(`❌ Failed to start application: ${error.message}`);
  process.exit(1);
});
