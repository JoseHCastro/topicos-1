#!/usr/bin/env node

/**
 * 🧪 TEST SCRIPT PARA BATCH QUERIES Y EXCLUSIONES
 * 
 * Ejecutar: node scripts/test-batch-queries.js
 * 
 * Prueba las nuevas funcionalidades implementadas:
 * 1. Batch Status Queries
 * 2. Configuración de exclusiones
 * 3. Integración del interceptor
 */

const http = require('http');

const CONFIG = {
  baseUrl: process.env.API_URL || 'http://localhost:3000',
};

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return colors[color] + text + colors.reset;
}

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, CONFIG.baseUrl);
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testBatchQueries() {
  console.log(colorize('\n🧪 TESTING BATCH STATUS QUERIES', 'bright'));
  console.log('═'.repeat(50));

  try {
    // 1. Test sin parámetros
    console.log(colorize('\n1. Testing without parameters...', 'yellow'));
    const emptyTest = await makeRequest('/queues/status');
    console.log(`Status: ${emptyTest.status}`);
    console.log(`Response: ${emptyTest.data.error || 'OK'}`);

    // 2. Test con IDs inválidos
    console.log(colorize('\n2. Testing with invalid job IDs...', 'yellow'));
    const invalidTest = await makeRequest('/queues/status?ids=invalid1,invalid2,invalid3');
    console.log(`Status: ${invalidTest.status}`);
    console.log(`Jobs found: ${invalidTest.data.summary?.total || 0}`);
    console.log(`Not found: ${invalidTest.data.summary?.notFound || 0}`);

    // 3. Test con demasiados IDs
    console.log(colorize('\n3. Testing with too many IDs...', 'yellow'));
    const tooManyIds = Array.from({length: 60}, (_, i) => `job${i}`).join(',');
    const limitTest = await makeRequest(`/queues/status?ids=${tooManyIds}`);
    console.log(`Status: ${limitTest.status}`);
    console.log(`Error: ${limitTest.data.error || 'None'}`);

    console.log(colorize('\n✅ Batch queries test completed', 'green'));

  } catch (error) {
    console.log(colorize(`❌ Batch queries test failed: ${error.message}`, 'red'));
  }
}

async function testExclusionConfig() {
  console.log(colorize('\n🎛️ TESTING EXCLUSION CONFIGURATION', 'bright'));
  console.log('═'.repeat(50));

  try {
    // 1. Ver exclusiones actuales
    console.log(colorize('\n1. Getting current exclusions...', 'yellow'));
    const currentExclusions = await makeRequest('/queue-control/exclusions');
    console.log(`Status: ${currentExclusions.status}`);
    console.log(`Total exclusions: ${currentExclusions.data.totalCount || 0}`);
    console.log(`Default: ${currentExclusions.data.exclusions?.default?.length || 0}`);
    console.log(`Custom: ${currentExclusions.data.exclusions?.custom?.length || 0}`);

    // 2. Agregar exclusión personalizada
    console.log(colorize('\n2. Adding custom exclusion...', 'yellow'));
    const addExclusion = await makeRequest('/queue-control/exclusions', {
      method: 'POST',
      body: { urlPattern: '/test-endpoint' }
    });
    console.log(`Status: ${addExclusion.status}`);
    console.log(`Message: ${addExclusion.data.message || 'OK'}`);

    // 3. Verificar que se agregó
    console.log(colorize('\n3. Verifying exclusion was added...', 'yellow'));
    const verifyAdd = await makeRequest('/queue-control/exclusions');
    const customCount = verifyAdd.data.exclusions?.custom?.length || 0;
    console.log(`Custom exclusions: ${customCount}`);

    // 4. Remover exclusión
    console.log(colorize('\n4. Removing custom exclusion...', 'yellow'));
    const removeExclusion = await makeRequest('/queue-control/exclusions/%2Ftest-endpoint', {
      method: 'DELETE'
    });
    console.log(`Status: ${removeExclusion.status}`);
    console.log(`Message: ${removeExclusion.data.message || 'OK'}`);

    console.log(colorize('\n✅ Exclusion configuration test completed', 'green'));

  } catch (error) {
    console.log(colorize(`❌ Exclusion configuration test failed: ${error.message}`, 'red'));
  }
}

async function testQueueSystemStatus() {
  console.log(colorize('\n🔄 TESTING QUEUE SYSTEM STATUS', 'bright'));
  console.log('═'.repeat(50));

  try {
    // 1. Estado actual
    console.log(colorize('\n1. Getting current status...', 'yellow'));
    const status = await makeRequest('/queue-control/status');
    console.log(`Status: ${status.status}`);
    console.log(`Queue enabled: ${status.data.queueSystemEnabled}`);
    console.log(`Total exclusions: ${status.data.exclusions?.total || 0}`);

    // 2. Toggle sistema
    console.log(colorize('\n2. Toggling queue system...', 'yellow'));
    const toggle = await makeRequest('/queue-control/toggle', { method: 'POST' });
    console.log(`Status: ${toggle.status}`);
    console.log(`New status: ${toggle.data.status}`);

    console.log(colorize('\n✅ Queue system status test completed', 'green'));

  } catch (error) {
    console.log(colorize(`❌ Queue system status test failed: ${error.message}`, 'red'));
  }
}

async function createTestJobs() {
  console.log(colorize('\n🚀 CREATING TEST JOBS FOR BATCH TESTING', 'bright'));
  console.log('═'.repeat(50));

  try {
    // Habilitar sistema de colas primero
    await makeRequest('/queue-control/enable', { method: 'POST' });

    const jobIds = [];

    // Crear algunos jobs de prueba
    for (let i = 0; i < 5; i++) {
      const testJob = await makeRequest(`/queue-control/test-job/standard`);
      if (testJob.status === 200 && testJob.data.jobId) {
        jobIds.push(testJob.data.jobId);
        console.log(`Created job: ${testJob.data.jobId}`);
      }
    }

    if (jobIds.length > 0) {
      // Esperar un poco para que los jobs se procesen
      console.log(colorize('\n⏳ Waiting for jobs to process...', 'yellow'));
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Probar batch query con jobs reales
      console.log(colorize('\n📊 Testing batch query with real jobs...', 'yellow'));
      const batchTest = await makeRequest(`/queues/status?ids=${jobIds.join(',')}`);
      console.log(`Status: ${batchTest.status}`);
      console.log(`Total jobs: ${batchTest.data.summary?.total || 0}`);
      console.log(`Completed: ${batchTest.data.summary?.completed || 0}`);
      console.log(`Success rate: ${batchTest.data.summary?.successRate || 0}%`);
    }

    console.log(colorize('\n✅ Test jobs creation completed', 'green'));

  } catch (error) {
    console.log(colorize(`❌ Test jobs creation failed: ${error.message}`, 'red'));
  }
}

async function runAllTests() {
  console.log(colorize('🧪 TESTING NEW FUNCTIONALITY', 'bright'));
  console.log(colorize(`📡 Testing against: ${CONFIG.baseUrl}`, 'cyan'));
  console.log('═'.repeat(80));

  // Verificar conectividad
  try {
    await makeRequest('/health');
    console.log(colorize('✅ Server is reachable', 'green'));
  } catch (error) {
    console.log(colorize(`❌ Cannot reach server: ${error.message}`, 'red'));
    console.log(colorize('Make sure the server is running!', 'yellow'));
    process.exit(1);
  }

  // Ejecutar todos los tests
  await testQueueSystemStatus();
  await testExclusionConfig();
  await testBatchQueries();
  await createTestJobs();

  console.log(colorize('\n🎉 ALL TESTS COMPLETED!', 'bright'));
  console.log(colorize('Check the results above for any issues.', 'cyan'));
}

// Mostrar ayuda si se solicita
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
${colorize('🧪 TEST SCRIPT FOR NEW FUNCTIONALITY', 'bright')}

${colorize('Usage:', 'yellow')}
  node scripts/test-batch-queries.js

${colorize('Environment variables:', 'yellow')}
  API_URL    Base URL of the API (default: http://localhost:3000)

${colorize('What this script tests:', 'yellow')}
  • Batch status queries (/queues/status?ids=...)
  • Exclusion configuration (/queue-control/exclusions)
  • Queue system status and toggling
  • Real job creation and batch checking

${colorize('Examples:', 'yellow')}
  node scripts/test-batch-queries.js
  API_URL=http://localhost:3001 node scripts/test-batch-queries.js
`);
  process.exit(0);
}

// Ejecutar tests
runAllTests().catch(error => {
  console.error(colorize(`💥 Fatal error: ${error.message}`, 'red'));
  process.exit(1);
});