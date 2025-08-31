# 📋 Sistema de Colas Universal - Fase 2: Cliente Polling

## 🎯 ¿Qué es la Fase 2?

La **Fase 2** implementa el sistema de **polling automático** que permite a los clientes obtener los resultados de las operaciones que fueron enviadas a las colas.

### Flujo completo:
1. **Cliente envía request** → **Interceptor lo envía a cola** → **Cliente recibe `jobId`**
2. **Cliente hace polling** → **Consulta `/queues/job/:jobId/status` cada 2 segundos**
3. **Cuando job completa** → **Cliente obtiene resultado final**

## 🚀 Cómo Usar

### 1. Demo Web Interface

Accede a la interfaz de demo:
```
http://localhost:3000/queue-demo
```

Esta interfaz te permite:
- ✅ Probar diferentes tipos de endpoints (Critical, Standard, Background)
- ✅ Ver el polling automático en acción
- ✅ Monitorear estadísticas de las colas
- ✅ Ver logs en tiempo real

### 2. Cliente JavaScript

#### Uso Básico:
```javascript
// Incluir el cliente
<script src="/queue-demo/queue-client.js"></script>

// Hacer una petición con polling automático
const result = await queueClient.post('/auth/login', {
  email: 'user@test.com',
  password: 'password123'
});

console.log('Login exitoso:', result);
```

#### Uso Avanzado con Callbacks:
```javascript
const result = await queueClient.queueRequest('/courses', {
  method: 'GET'
}, {
  onUpdate: (status) => {
    console.log('Estado actualizado:', status.status);
  },
  onProgress: (progress) => {
    console.log('Progreso:', progress + '%');
  },
  interval: 1000, // Polling cada 1 segundo
  maxTime: 60000   // Timeout después de 1 minuto
});
```

#### Métodos Disponibles:
```javascript
// Métodos de conveniencia
await queueClient.get('/students');
await queueClient.post('/courses', courseData);
await queueClient.put('/students/123', updateData);
await queueClient.delete('/courses/456');

// Consulta manual de estado
const status = await queueClient.getJobStatus('jobId_123');

// Estadísticas de colas
const stats = await queueClient.getQueuesStats();

// Cancelar polling (no cancela el job)
queueClient.cancelPolling('jobId_123');
```

## 🔧 API Endpoints

### Consulta de Estado de Job
```
GET /queues/job/:jobId/status

Respuesta:
{
  "jobId": "20250829_143052_abc123",
  "status": "waiting|processing|completed|failed",
  "result": {...},      // Resultado cuando está completed
  "error": "...",       // Error si falló
  "progress": 50,       // Progreso 0-100%
  "processedOn": "timestamp",
  "finishedOn": "timestamp"
}
```

### Estadísticas de Colas
```
GET /queues/stats

Respuesta:
{
  "timestamp": "2025-01-27T...",
  "queues": {
    "critical": { "waiting": 0, "timeout": 30 },
    "standard": { "waiting": 2, "timeout": 60 },
    "background": { "waiting": 1, "timeout": 120 }
  },
  "status": "healthy"
}
```

## 🎮 Colas por Tipo de Endpoint

### 🔴 Cola Critical (Procesamiento Inmediato)
- `/atomic-enrollment/*` - Inscripciones atómicas
- `/auth/login` - Login de usuarios
- `/auth/logout` - Logout de usuarios
- **Timeout:** 30 segundos
- **Estimado:** 5-30 segundos

### 🟡 Cola Standard (Procesamiento Normal)
- `/courses/*` - Operaciones de cursos
- `/students/*` - Operaciones de estudiantes
- `/grades/*` - Operaciones de calificaciones
- `/academic-validations/*` - Validaciones académicas
- **Timeout:** 60 segundos
- **Estimado:** 15-60 segundos

### 🟢 Cola Background (Procesamiento Diferido)
- `/reports/*` - Generación de reportes
- `/notifications/*` - Envío de notificaciones
- `/database-performance/*` - Operaciones de optimización
- **Timeout:** 120 segundos
- **Estimado:** 30-120 segundos

## ⚙️ Configuración

### Variables de Entorno:
```bash
QUEUE_ENABLED=true        # Habilitar sistema de colas
REDIS_HOST=localhost      # Host de Redis
REDIS_PORT=6379          # Puerto de Redis
```

### Activar/Desactivar Colas:
```bash
# Habilitar colas
POST /queue-control/enable

# Deshabilitar colas (procesamiento directo)
POST /queue-control/disable

# Alternar estado
POST /queue-control/toggle
```

## 🔍 Debugging

### Logs del Cliente:
El cliente JavaScript muestra logs detallados en la consola del browser:
```
[14:30:52] 🚀 Sending request to queue: POST /auth/login
[14:30:52] 📥 Job queued successfully: {jobId: "20250829_143052_abc123", ...}
[14:30:52] 🔄 Starting polling for job 20250829_143052_abc123
[14:30:54] 📊 Poll #1 for job 20250829_143052_abc123: processing
[14:30:56] 📊 Poll #2 for job 20250829_143052_abc123: completed
[14:30:56] ✅ Job 20250829_143052_abc123 completed successfully
```

### Endpoints de Debug:
- `GET /queues/stats` - Estado de todas las colas
- `GET /queues/health` - Health check del sistema
- `GET /health` - Health check general de la aplicación

## 📊 Métricas de Éxito

### Fase 2 Targets:
- ✅ **Job creation:** < 100ms
- ✅ **Polling response:** < 50ms
- ✅ **Simple job processing:** < 10s
- ✅ **Success rate:** > 95%

## 🎯 Próximos Pasos

La Fase 2 está **COMPLETA** y funcional. Las siguientes fases incluyen:

- **Fase 3:** Especialización avanzada de colas
- **Fase 4:** Optimizaciones (cache, deduplicación)
- **Fase 5:** Performance y estabilidad
- **Fase 6:** WebSockets y monitoreo avanzado

## 🐛 Troubleshooting

### Error "Job not found":
- El job puede haber expirado (TTL de 1 hora)
- Verificar que Redis esté ejecutándose
- Revisar logs del servidor

### Polling timeout:
- Aumentar `maxTime` en opciones de polling
- Verificar que los workers estén procesando jobs
- Revisar estado de las colas con `GET /queues/stats`

### El sistema no responde a colas:
- Verificar que `QUEUE_ENABLED=true`
- Usar `POST /queue-control/enable` para activar
- Revisar logs del servidor para errores de Redis

---

**✅ FASE 2 IMPLEMENTADA EXITOSAMENTE** - ¡El sistema de colas ahora es completamente funcional!

