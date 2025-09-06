import { Injectable } from '@nestjs/common';

@Injectable()
export class QueueConfigService {
  private queueEnabled: boolean = false; // Inicialmente deshabilitado para testing
  
  // Exclusiones configurables del interceptor
  private readonly defaultExclusions = [
    '/queues/', // Consulta de estado de colas
    '/admin/queues', // Administración de workers y colas - NO debe ir a cola
    '/health', // Health checks para load balancers
    '/metrics', // Métricas de Prometheus
    '/queue-dashboard', // Dashboard de monitoreo
    '/queue-control', // Control del sistema de colas
    '/websocket', // Endpoints de WebSocket
    '/sse', // Server-Sent Events
    '/__', // Rutas internas de desarrollo
    '/monitoring', // Endpoints de monitoreo
    '/public', // Archivos estáticos
  ];

  private customExclusions: string[] = [];

  isQueueEnabled(): boolean {
    // Leer de variable de entorno o configuración
    return process.env.QUEUE_ENABLED === 'true' || this.queueEnabled;
  }

  enableQueue(): void {
    this.queueEnabled = true;
    console.log(
      '🔄 Queue system ENABLED - All requests will go through queues',
    );
  }

  disableQueue(): void {
    this.queueEnabled = false;
    console.log('⚪ Queue system DISABLED - Requests processed directly');
  }

  toggleQueue(): boolean {
    this.queueEnabled = !this.queueEnabled;
    console.log(
      `🔄 Queue system ${this.queueEnabled ? 'ENABLED' : 'DISABLED'}`,
    );
    return this.queueEnabled;
  }

  /**
   * Verificar si una URL debe excluirse del sistema de colas
   */
  shouldExcludeFromQueue(url: string): boolean {
    const allExclusions = [...this.defaultExclusions, ...this.customExclusions];
    
    // También considerar exclusiones desde variables de entorno
    const envExclusions = process.env.QUEUE_EXCLUSIONS?.split(',') || [];
    allExclusions.push(...envExclusions);

    return allExclusions.some((exclusion) => url.startsWith(exclusion.trim()));
  }

  /**
   * Agregar exclusión personalizada
   */
  addExclusion(urlPattern: string): void {
    if (!this.customExclusions.includes(urlPattern)) {
      this.customExclusions.push(urlPattern);
      console.log(`➕ Added queue exclusion: ${urlPattern}`);
    }
  }

  /**
   * Remover exclusión personalizada
   */
  removeExclusion(urlPattern: string): void {
    const index = this.customExclusions.indexOf(urlPattern);
    if (index > -1) {
      this.customExclusions.splice(index, 1);
      console.log(`➖ Removed queue exclusion: ${urlPattern}`);
    }
  }

  /**
   * Obtener todas las exclusiones actuales
   */
  getExclusions(): { default: string[]; custom: string[]; env: string[] } {
    const envExclusions = process.env.QUEUE_EXCLUSIONS?.split(',').map(e => e.trim()).filter(e => e) || [];
    
    return {
      default: this.defaultExclusions,
      custom: this.customExclusions,
      env: envExclusions,
    };
  }

  /**
   * Limpiar todas las exclusiones personalizadas
   */
  clearCustomExclusions(): void {
    this.customExclusions = [];
    console.log('🧹 Cleared all custom queue exclusions');
  }
}
