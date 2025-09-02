import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WebSocketService } from './websocket.service';
import { JobStatusService } from './job-status.service';

@WSGateway({
  cors: {
    origin: process.env.WEBSOCKET_CORS_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/jobs',
  transports: ['websocket', 'polling'],
})
export class WebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WebSocketGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly webSocketService: WebSocketService,
    private readonly jobStatusService: JobStatusService,
  ) {}

  afterInit(server: Server) {
    this.webSocketService.setServer(server);
    this.logger.log('🚀 WebSocket Gateway initialized');

    // Configurar cleanup automático cada 5 minutos
    setInterval(() => {
      this.webSocketService.cleanupInactiveClients();
      this.jobStatusService.cleanupOldJobs();
    }, 5 * 60 * 1000);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`🔌 Client connected: ${client.id}`);
    this.webSocketService.registerClient(client);

    // Enviar mensaje de bienvenida
    client.emit('welcome', {
      message: 'Connected to job status updates',
      clientId: client.id,
      timestamp: Date.now(),
      server: 'FASE-2 Queue System',
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Client disconnected: ${client.id}`);
    this.webSocketService.unregisterClient(client.id, 'client-disconnect');
  }

  /**
   * Cliente solicita suscribirse a actualizaciones de un job específico
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { jobId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.jobId) {
      client.emit('error', { message: 'Job ID is required' });
      return;
    }

    this.logger.debug(`📺 Subscription request for job ${data.jobId} from client ${client.id}`);
    client.emit('subscribe-job', data.jobId);
  }

  /**
   * Cliente solicita desuscribirse de un job
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { jobId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.jobId) {
      client.emit('error', { message: 'Job ID is required' });
      return;
    }

    this.logger.debug(`📺 Unsubscription request for job ${data.jobId} from client ${client.id}`);
    client.emit('unsubscribe-job', data.jobId);
  }

  /**
   * Cliente solicita el estado actual de un job
   */
  @SubscribeMessage('status')
  handleGetStatus(
    @MessageBody() data: { jobId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.jobId) {
      client.emit('error', { message: 'Job ID is required' });
      return;
    }

    this.logger.debug(`📊 Status request for job ${data.jobId} from client ${client.id}`);
    client.emit('get-job-status', data.jobId);
  }

  /**
   * Cliente solicita estadísticas generales del sistema
   */
  @SubscribeMessage('stats')
  handleGetStats(@ConnectedSocket() client: Socket) {
    this.logger.debug(`📈 Stats request from client ${client.id}`);
    client.emit('get-statistics');
  }

  /**
   * Ping para mantener conexión activa
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('ping');
  }

  /**
   * Método para enviar actualizaciones desde otros servicios
   */
  notifyJobUpdate(jobId: string, status: any) {
    this.jobStatusService.updateJobStatus({
      jobId,
      ...status,
      timestamp: Date.now(),
    });
  }

  /**
   * Obtener estadísticas del gateway
   */
  getGatewayStats() {
    return {
      connectedClients: this.server?.engine?.clientsCount || 0,
      namespace: '/jobs',
      ...this.webSocketService.getConnectionStats(),
    };
  }
}