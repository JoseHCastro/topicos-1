import { Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';

export interface TransactionCallback<T> {
  (manager: EntityManager): Promise<T>;
}

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Ejecuta una operación dentro de una transacción con manejo automático de rollback
   * @param callback Función que contiene la lógica de la transacción
   * @param timeoutMs Timeout en milisegundos (default: 5000)
   * @returns Resultado de la operación
   */
  async executeTransaction<T>(
    callback: TransactionCallback<T>,
    timeoutMs: number = 5000,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction('READ COMMITTED');

      this.logger.debug('Transacción iniciada');

      // Configurar timeout para la transacción
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Transacción timeout después de ${timeoutMs}ms`));
        }, timeoutMs);
      });

      // Ejecutar la lógica de negocio con timeout
      const result = await Promise.race([
        callback(queryRunner.manager),
        timeoutPromise,
      ]);

      await queryRunner.commitTransaction();
      this.logger.debug('Transacción confirmada exitosamente');

      return result;
    } catch (error) {
      this.logger.error('Error en transacción, ejecutando rollback', error);

      try {
        await queryRunner.rollbackTransaction();
        this.logger.debug('Rollback ejecutado exitosamente');
      } catch (rollbackError) {
        this.logger.error('Error durante rollback', rollbackError);
      }

      throw error;
    } finally {
      try {
        await queryRunner.release();
        this.logger.debug('QueryRunner liberado');
      } catch (releaseError) {
        this.logger.error('Error liberando QueryRunner', releaseError);
      }
    }
  }

  /**
   * Ejecuta una transacción con retry automático en caso de deadlocks
   * @param callback Función que contiene la lógica de la transacción
   * @param maxRetries Número máximo de reintentos (default: 3)
   * @param timeoutMs Timeout por intento en milisegundos (default: 5000)
   * @returns Resultado de la operación
   */
  async executeWithRetry<T>(
    callback: TransactionCallback<T>,
    maxRetries: number = 3,
    timeoutMs: number = 5000,
  ): Promise<T> {
    let lastError: Error = new Error('Transacción falló sin error específico');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(`Intento de transacción ${attempt}/${maxRetries}`);

        const result = await this.executeTransaction(callback, timeoutMs);

        if (attempt > 1) {
          this.logger.log(`Transacción exitosa en intento ${attempt}`);
        }

        return result;
      } catch (error) {
        lastError = error;

        // Si es un deadlock o lock timeout, reintentamos
        if (this.shouldRetry(error) && attempt < maxRetries) {
          const delay = Math.min(100 * Math.pow(2, attempt - 1), 1000); // Exponential backoff
          this.logger.warn(
            `Reintentando transacción en ${delay}ms debido a: ${error.message}`,
          );
          await this.sleep(delay);
          continue;
        }

        // Si no debemos reintentar o agotamos los intentos, lanzamos el error
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Determina si un error es recuperable y debería reintentarse
   */
  private shouldRetry(error: any): boolean {
    if (!error?.code) return false;

    const retryableCodes = [
      '40001', // serialization_failure
      '40P01', // deadlock_detected
      '55P03', // lock_not_available
    ];

    return retryableCodes.includes(error.code);
  }

  /**
   * Función auxiliar para sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
