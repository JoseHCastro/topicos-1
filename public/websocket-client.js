/**
 * 🔌 FASE 6: Cliente WebSocket para Updates en Tiempo Real
 * 
 * Este cliente implementa WebSockets para recibir actualizaciones en tiempo real
 * de los jobs con fallback automático a polling si WebSocket no está disponible.
 */

class RealTimeJobClient {
  constructor(baseUrl = '', options = {}) {
    this.baseUrl = baseUrl;
    this.options = {
      enableWebSocket: true,
      fallbackToPolling: true,
      pollingInterval: 2000,
      maxPollingTime: 120000,
      reconnectAttempts: 3,
      reconnectDelay: 1000,
      ...options,
    };

    // Estado de conexión
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.activeSubscriptions = new Map(); // jobId -> subscription info
    this.eventListeners = new Map(); // event -> Set of callbacks

    // Fallback polling
    this.pollingJobs = new Map(); // jobId -> polling interval
    this.pollingEnabled = false;

    this.init();
  }

  async init() {
    // Cargar configuración del servidor
    await this.loadServerConfig();

    if (this.options.enableWebSocket) {
      this.connectWebSocket();
    } else {
      console.log('📡 WebSocket disabled, using polling only');
      this.pollingEnabled = true;
    }
  }

  /**
   * Carga la configuración desde el servidor
   */
  async loadServerConfig() {
    try {
      const response = await fetch(`${this.baseUrl}/monitoring/config`);
      if (response.ok) {
        const config = await response.json();
        if (config.polling) {
          this.options.pollingInterval = config.polling.interval;
          this.options.maxPollingTime = config.polling.maxTime;
        }
        console.log('📋 Server config loaded:', config);
      }
    } catch (error) {
      console.warn('⚠️ Could not load server config:', error.message);
    }
  }

  /**
   * Conecta al WebSocket
   */
  connectWebSocket() {
    if (typeof io === 'undefined') {
      console.warn('⚠️ Socket.IO not available, falling back to polling');
      this.enablePollingFallback();
      return;
    }

    try {
      this.socket = io(`${this.baseUrl}/jobs`, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.options.reconnectAttempts,
        reconnectionDelay: this.options.reconnectDelay,
      });

      this.setupWebSocketEvents();
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.enablePollingFallback();
    }
  }

  /**
   * Configura los eventos del WebSocket
   */
  setupWebSocketEvents() {
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('🔌 WebSocket connected');
      this.emit('connected');

      // Re-suscribirse a jobs activos
      for (const [jobId, subscription] of this.activeSubscriptions) {
        this.socket.emit('subscribe', { jobId });
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('🔌 WebSocket disconnected:', reason);
      this.emit('disconnected', reason);

      // Si falla la conexión, activar polling como fallback
      if (this.options.fallbackToPolling) {
        this.enablePollingFallback();
      }
    });

    this.socket.on('welcome', (data) => {
      console.log('👋 Welcome message:', data);
    });

    this.socket.on('job-update', (update) => {
      console.log('📡 Job update received:', update);
      this.handleJobUpdate(update);
    });

    this.socket.on('subscription-confirmed', (data) => {
      console.log('✅ Subscription confirmed for job:', data.jobId);
    });

    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      this.emit('error', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.enablePollingFallback();
    });
  }

  /**
   * Habilita el fallback a polling
   */
  enablePollingFallback() {
    if (!this.pollingEnabled && this.options.fallbackToPolling) {
      this.pollingEnabled = true;
      console.log('🔄 Enabling polling fallback');

      // Iniciar polling para jobs activos
      for (const [jobId, subscription] of this.activeSubscriptions) {
        this.startPolling(jobId);
      }
    }
  }

  /**
   * Suscribirse a actualizaciones de un job
   */
  subscribeToJob(jobId, callbacks = {}) {
    const subscription = {
      jobId,
      callbacks: {
        onUpdate: callbacks.onUpdate || (() => {}),
        onProgress: callbacks.onProgress || (() => {}),
        onCompleted: callbacks.onCompleted || (() => {}),
        onFailed: callbacks.onFailed || (() => {}),
      },
      startTime: Date.now(),
    };

    this.activeSubscriptions.set(jobId, subscription);

    if (this.isConnected && this.socket) {
      // Usar WebSocket
      this.socket.emit('subscribe', { jobId });
    } else if (this.pollingEnabled) {
      // Usar polling
      this.startPolling(jobId);
    }

    console.log(`📺 Subscribed to job ${jobId}`);
    return subscription;
  }

  /**
   * Desuscribirse de un job
   */
  unsubscribeFromJob(jobId) {
    const subscription = this.activeSubscriptions.get(jobId);
    if (subscription) {
      this.activeSubscriptions.delete(jobId);

      if (this.isConnected && this.socket) {
        this.socket.emit('unsubscribe', { jobId });
      }

      // Detener polling
      this.stopPolling(jobId);

      console.log(`📺 Unsubscribed from job ${jobId}`);
    }
  }

  /**
   * Inicia polling para un job específico
   */
  startPolling(jobId) {
    if (this.pollingJobs.has(jobId)) {
      return; // Ya está en polling
    }

    const subscription = this.activeSubscriptions.get(jobId);
    if (!subscription) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${this.baseUrl}/queues/job/${jobId}/status`);
        if (response.ok) {
          const status = await response.json();
          this.handleJobUpdate({
            jobId,
            ...status,
            timestamp: Date.now(),
          });

          // Si el job terminó, detener polling
          if (status.status === 'completed' || status.status === 'failed') {
            this.stopPolling(jobId);
          }
        }
      } catch (error) {
        console.error(`❌ Polling error for job ${jobId}:`, error);
      }
    }, this.options.pollingInterval);

    this.pollingJobs.set(jobId, pollInterval);

    // Timeout para detener polling después del tiempo máximo
    setTimeout(() => {
      this.stopPolling(jobId);
    }, this.options.maxPollingTime);
  }

  /**
   * Detiene polling para un job
   */
  stopPolling(jobId) {
    const interval = this.pollingJobs.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.pollingJobs.delete(jobId);
    }
  }

  /**
   * Maneja las actualizaciones de jobs
   */
  handleJobUpdate(update) {
    const subscription = this.activeSubscriptions.get(update.jobId);
    if (!subscription) return;

    const { callbacks } = subscription;

    // Callback general de actualización
    callbacks.onUpdate(update);

    // Callbacks específicos por estado
    switch (update.status) {
      case 'progress':
        if (update.progress !== undefined) {
          callbacks.onProgress(update.progress, update);
        }
        break;
      case 'completed':
        callbacks.onCompleted(update.result, update);
        this.unsubscribeFromJob(update.jobId);
        break;
      case 'failed':
        callbacks.onFailed(update.error, update);
        this.unsubscribeFromJob(update.jobId);
        break;
    }

    // Emitir evento global
    this.emit('job-update', update);
  }

  /**
   * Solicita el estado actual de un job
   */
  async getJobStatus(jobId) {
    if (this.isConnected && this.socket) {
      return new Promise((resolve) => {
        this.socket.emit('status', { jobId });
        this.socket.once('job-status-response', (response) => {
          resolve(response.status);
        });
      });
    } else {
      // Fallback a HTTP
      try {
        const response = await fetch(`${this.baseUrl}/queues/job/${jobId}/status`);
        return response.ok ? await response.json() : null;
      } catch (error) {
        console.error('❌ Error getting job status:', error);
        return null;
      }
    }
  }

  /**
   * Obtiene estadísticas del sistema
   */
  async getSystemStats() {
    if (this.isConnected && this.socket) {
      return new Promise((resolve) => {
        this.socket.emit('stats');
        this.socket.once('statistics-response', resolve);
      });
    } else {
      try {
        const response = await fetch(`${this.baseUrl}/monitoring/websocket/stats`);
        return response.ok ? await response.json() : null;
      } catch (error) {
        console.error('❌ Error getting stats:', error);
        return null;
      }
    }
  }

  /**
   * Sistema de eventos personalizado
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Desconecta y limpia recursos
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }

    // Limpiar polling
    for (const interval of this.pollingJobs.values()) {
      clearInterval(interval);
    }
    this.pollingJobs.clear();

    this.activeSubscriptions.clear();
    this.eventListeners.clear();

    console.log('🔌 RealTimeJobClient disconnected');
  }

  /**
   * Obtiene estadísticas de conexión
   */
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      transport: this.socket?.io?.engine?.transport?.name || 'polling',
      activeSubscriptions: this.activeSubscriptions.size,
      pollingJobs: this.pollingJobs.size,
      pollingEnabled: this.pollingEnabled,
    };
  }
}

// Crear instancia global
const realTimeJobClient = new RealTimeJobClient();

// Exportar para Node.js si está disponible
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RealTimeJobClient, realTimeJobClient };
}

// Hacer disponible globalmente en el browser
if (typeof window !== 'undefined') {
  window.RealTimeJobClient = RealTimeJobClient;
  window.realTimeJobClient = realTimeJobClient;
}

console.log('🔌 RealTime Job Client initialized - WebSocket with polling fallback ready!');