import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JobStatusService, JobStatusUpdate } from './job-status.service';

export interface WebSocketClient {
  socket: Socket;
  jobIds: Set<string>;
  connectedAt: number;
}

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private server: Server;
  private clients = new Map<string, WebSocketClient>();

  constructor(private readonly jobStatusService: JobStatusService) {
    // Escuchar actualizaciones de estado de jobs
    this.jobStatusService.on('job-status-update', (update: JobStatusUpdate) => {
      this.broadcastJobUpdate(update);
    });
  }

  /**
   * Establece la instancia del servidor WebSocket
   */
  setServer(server: Server): void {
    this.server = server;
    this.logger.log('🔌 WebSocket server configured');
  }

  /**
   * Registra un nuevo cliente WebSocket
   */
  registerClient(socket: Socket): void {
    const client: WebSocketClient = {
      socket,
      jobIds: new Set(),
      connectedAt: Date.now(),
    };

    this.clients.set(socket.id, client);
    this.logger.log(`👤 Client ${socket.id} connected`);

    // Configurar event listeners del cliente
    this.setupClientListeners(socket, client);
  }

  /**
   * Configura los event listeners para un cliente
   */
  private setupClientListeners(socket: Socket, client: WebSocketClient): void {
    // Cliente se suscribe a un job específico
    socket.on('subscribe-job', (jobId: string) => {
      if (typeof jobId === 'string' && jobId.length > 0) {
        client.jobIds.add(jobId);
        this.logger.debug(`📺 Client ${socket.id} subscribed to job ${jobId}`);

        // Enviar estado actual si existe
        const currentStatus = this.jobStatusService.getJobStatus(jobId);
        if (currentStatus) {
          socket.emit('job-update', currentStatus);
        }

        // Confirmar suscripción
        socket.emit('subscription-confirmed', { jobId });
      }
    });

    // Cliente se desuscribe de un job
    socket.on('unsubscribe-job', (jobId: string) => {
      if (typeof jobId === 'string') {
        client.jobIds.delete(jobId);
        this.logger.debug(`📺 Client ${socket.id} unsubscribed from job ${jobId}`);
        socket.emit('unsubscription-confirmed', { jobId });
      }
    });

    // Cliente solicita el estado actual de un job
    socket.on('get-job-status', (jobId: string) => {
      if (typeof jobId === 'string') {
        const status = this.jobStatusService.getJobStatus(jobId);
        socket.emit('job-status-response', {
          jobId,
          status: status || null,
        });
      }
    });

    // Cliente solicita estadísticas generales
    socket.on('get-statistics', () => {
      const stats = {
        ...this.jobStatusService.getJobStatistics(),
        clients: this.clients.size,
        uptime: process.uptime(),
      };
      socket.emit('statistics-response', stats);
    });

    // Ping/Pong para mantener conexión
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Manejar desconexión
    socket.on('disconnect', (reason) => {
      this.unregisterClient(socket.id, reason);
    });
  }

  /**
   * Desregistra un cliente WebSocket
   */
  unregisterClient(socketId: string, reason?: string): void {
    const client = this.clients.get(socketId);
    if (client) {
      this.clients.delete(socketId);
      this.logger.log(
        `👋 Client ${socketId} disconnected (${reason || 'unknown reason'}) - was subscribed to ${client.jobIds.size} jobs`,
      );
    }
  }

  /**
   * Envía una actualización de job a todos los clientes suscritos
   */
  private broadcastJobUpdate(update: JobStatusUpdate): void {
    let sentCount = 0;

    const clients = Array.from(this.clients.entries());
    for (const [socketId, client] of clients) {
      if (client.jobIds.has(update.jobId)) {
        try {
          client.socket.emit('job-update', update);
          sentCount++;
        } catch (error) {
          this.logger.warn(
            `❌ Failed to send update to client ${socketId}: ${error.message}`,
          );
          // Cliente probablemente desconectado, limpiarlo
          this.unregisterClient(socketId, 'send-error');
        }
      }
    }

    if (sentCount > 0) {
      this.logger.debug(
        `📡 Job ${update.jobId} update sent to ${sentCount} clients`,
      );
    }
  }

  /**
   * Envía un mensaje a todos los clientes conectados
   */
  broadcastToAll(event: string, data: any): void {
    if (!this.server) {
      this.logger.warn('❌ Cannot broadcast: WebSocket server not initialized');
      return;
    }

    this.server.emit(event, data);
    this.logger.debug(`📡 Broadcasted ${event} to all clients`);
  }

  /**
   * Obtiene estadísticas de conexiones WebSocket
   */
  getConnectionStats(): {
    totalClients: number;
    clientDetails: Array<{
      socketId: string;
      subscribedJobs: number;
      connectedFor: number;
    }>;
    averageSubscriptions: number;
  } {
    const clientDetails = Array.from(this.clients.entries()).map(
      ([socketId, client]) => ({
        socketId,
        subscribedJobs: client.jobIds.size,
        connectedFor: Date.now() - client.connectedAt,
      }),
    );

    const totalSubscriptions = clientDetails.reduce(
      (sum, client) => sum + client.subscribedJobs,
      0,
    );

    return {
      totalClients: this.clients.size,
      clientDetails,
      averageSubscriptions: this.clients.size > 0 ? totalSubscriptions / this.clients.size : 0,
    };
  }

  /**
   * Limpia clientes inactivos (más de 5 minutos sin actividad)
   */
  cleanupInactiveClients(): void {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    let cleaned = 0;

    const clients = Array.from(this.clients.entries());
    for (const [socketId, client] of clients) {
      if (client.connectedAt < fiveMinutesAgo) {
        try {
          client.socket.disconnect(true);
        } catch (error) {
          // Socket ya desconectado
        }
        this.unregisterClient(socketId, 'inactive-cleanup');
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`🧹 Cleaned up ${cleaned} inactive WebSocket clients`);
    }
  }
}