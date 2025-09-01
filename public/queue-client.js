/**
 * 📋 FASE 2: Cliente JavaScript para Polling de Jobs
 * 
 * Este cliente implementa la estrategia de polling básica para consultar
 * el estado de jobs en las colas y obtener los resultados finales.
 */

class QueueClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    // Configuración por defecto, se puede sobrescribir con setConfig()
    this.pollingInterval = 2000; // 2 segundos
    this.maxPollingTime = 120000; // 2 minutos
    this.activePolls = new Map(); // Tracking de polls activos
  }

  /**
   * Configura los intervalos de polling desde el servidor
   * @param {Object} config - Configuración del polling
   */
  setConfig(config) {
    if (config.pollingInterval) {
      this.pollingInterval = config.pollingInterval;
    }
    if (config.maxPollingTime) {
      this.maxPollingTime = config.maxPollingTime;
    }
    console.log(`📋 Queue Client config updated - Interval: ${this.pollingInterval}ms, Max time: ${this.maxPollingTime}ms`);
  }

  /**
   * Obtiene la configuración del servidor
   * @returns {Promise} Configuración del servidor
   */
  async loadConfigFromServer() {
    try {
      const response = await fetch(`${this.baseUrl}/monitoring/config`);
      if (response.ok) {
        const config = await response.json();
        if (config.polling) {
          this.setConfig({
            pollingInterval: config.polling.interval,
            maxPollingTime: config.polling.maxTime,
          });
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not load config from server, using defaults:', error.message);
    }
  }

  /**
   * Envía una petición que va a ser encolada y inicia el polling automático
   * @param {string} url - URL del endpoint
   * @param {Object} options - Opciones de fetch (method, body, headers, etc.)
   * @param {Object} pollOptions - Opciones de polling
   * @returns {Promise} Promise que se resuelve con el resultado final
   */
  async queueRequest(url, options = {}, pollOptions = {}) {
    try {
      console.log(`🚀 Sending request to queue: ${options.method || 'GET'} ${url}`);
      
      // Hacer la petición inicial que será interceptada por el QueueInterceptor
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const queueResponse = await response.json();
      
      // Verificar que la respuesta tenga el formato esperado de cola
      if (!queueResponse.jobId || queueResponse.status !== 'queued') {
        // Si no es una respuesta de cola, devolver directamente
        return queueResponse;
      }

      console.log(`📥 Job queued successfully:`, queueResponse);

      // Iniciar polling automático
      return this.pollJobStatus(queueResponse.jobId, pollOptions);

    } catch (error) {
      console.error('❌ Error in queue request:', error);
      throw error;
    }
  }

  /**
   * Hace polling del estado de un job hasta que complete
   * @param {string} jobId - ID del job a consultar
   * @param {Object} options - Opciones de polling
   * @returns {Promise} Promise que se resuelve con el resultado final
   */
  async pollJobStatus(jobId, options = {}) {
    const {
      onProgress = () => {},
      onUpdate = () => {},
      interval = this.pollingInterval,
      maxTime = this.maxPollingTime,
    } = options;

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let pollCount = 0;

      console.log(`🔄 Starting polling for job ${jobId}`);

      const poll = async () => {
        try {
          pollCount++;
          const elapsed = Date.now() - startTime;

          // Timeout check
          if (elapsed > maxTime) {
            this.activePolls.delete(jobId);
            reject(new Error(`Polling timeout after ${maxTime}ms for job ${jobId}`));
            return;
          }

          // Consultar estado del job
          const status = await this.getJobStatus(jobId);
          
          console.log(`📊 Poll #${pollCount} for job ${jobId}:`, status.status);

          // Callback para updates
          onUpdate(status);

          // Manejar progreso si está disponible
          if (status.progress !== undefined) {
            onProgress(status.progress);
          }

          // Verificar si el job completó
          if (status.status === 'completed') {
            this.activePolls.delete(jobId);
            console.log(`✅ Job ${jobId} completed successfully`);
            resolve(status.result);
            return;
          }

          if (status.status === 'failed') {
            this.activePolls.delete(jobId);
            console.log(`❌ Job ${jobId} failed:`, status.error);
            reject(new Error(status.error || 'Job failed'));
            return;
          }

          // Continuar polling
          setTimeout(poll, interval);

        } catch (error) {
          console.error(`💥 Error polling job ${jobId}:`, error);
          this.activePolls.delete(jobId);
          reject(error);
        }
      };

      // Guardar referencia para cancelación
      this.activePolls.set(jobId, { poll, startTime });

      // Iniciar primer poll
      poll();
    });
  }

  /**
   * Consulta el estado de un job específico
   * @param {string} jobId - ID del job
   * @returns {Promise} Estado del job
   */
  async getJobStatus(jobId) {
    try {
      const response = await fetch(`${this.baseUrl}/queues/job/${jobId}/status`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const status = await response.json();
      
      // Si el job no se encuentra
      if (status.error && status.error === 'Job not found') {
        throw new Error(`Job ${jobId} not found`);
      }

      return {
        jobId: status.id || status.jobId,
        status: this.normalizeStatus(status.status),
        progress: status.progress || 0,
        result: status.result,
        error: status.error,
        data: status.data,
        processedOn: status.processedOn,
        finishedOn: status.finishedOn,
      };

    } catch (error) {
      console.error(`❌ Error getting job status for ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Normaliza los estados de BullMQ a estados simples
   * @param {string} bullStatus - Estado de BullMQ
   * @returns {string} Estado normalizado
   */
  normalizeStatus(bullStatus) {
    switch (bullStatus) {
      case 'waiting':
      case 'delayed':
        return 'waiting';
      case 'active':
        return 'processing';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      default:
        return bullStatus || 'unknown';
    }
  }

  /**
   * Cancela el polling de un job (no cancela el job en sí)
   * @param {string} jobId - ID del job
   */
  cancelPolling(jobId) {
    if (this.activePolls.has(jobId)) {
      this.activePolls.delete(jobId);
      console.log(`🛑 Polling cancelled for job ${jobId}`);
    }
  }

  /**
   * Cancela todos los pollings activos
   */
  cancelAllPolling() {
    const activeCount = this.activePolls.size;
    this.activePolls.clear();
    console.log(`🛑 Cancelled ${activeCount} active polls`);
  }

  /**
   * Obtiene estadísticas de las colas
   * @returns {Promise} Estadísticas de las colas
   */
  async getQueuesStats() {
    try {
      const response = await fetch(`${this.baseUrl}/queues/stats`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error getting queue stats:', error);
      throw error;
    }
  }

  /**
   * Método de conveniencia para GET requests
   */
  async get(url, options = {}) {
    return this.queueRequest(url, { method: 'GET', ...options });
  }

  /**
   * Método de conveniencia para POST requests
   */
  async post(url, data, options = {}) {
    return this.queueRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * Método de conveniencia para PUT requests
   */
  async put(url, data, options = {}) {
    return this.queueRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * Método de conveniencia para DELETE requests
   */
  async delete(url, options = {}) {
    return this.queueRequest(url, { method: 'DELETE', ...options });
  }
}

// Crear instancia global
const queueClient = new QueueClient();

// Exportar para Node.js si está disponible
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QueueClient, queueClient };
}

// Hacer disponible globalmente en el browser
if (typeof window !== 'undefined') {
  window.QueueClient = QueueClient;
  window.queueClient = queueClient;
}

console.log('📋 Queue Client initialized - Ready for async job processing!');

