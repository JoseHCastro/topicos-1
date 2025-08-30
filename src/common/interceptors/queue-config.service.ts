import { Injectable } from '@nestjs/common';

@Injectable()
export class QueueConfigService {
  private queueEnabled: boolean = false; // Inicialmente deshabilitado para testing

  isQueueEnabled(): boolean {
    // Leer de variable de entorno o configuración
    return process.env.QUEUE_ENABLED === 'true' || this.queueEnabled;
  }

  enableQueue(): void {
    this.queueEnabled = true;
    console.log('🔄 Queue system ENABLED - All requests will go through queues');
  }

  disableQueue(): void {
    this.queueEnabled = false;
    console.log('⚪ Queue system DISABLED - Requests processed directly');
  }

  toggleQueue(): boolean {
    this.queueEnabled = !this.queueEnabled;
    console.log(`🔄 Queue system ${this.queueEnabled ? 'ENABLED' : 'DISABLED'}`);
    return this.queueEnabled;
  }
}