import { Injectable, OnModuleDestroy } from '@nestjs/common';

export interface IdempotencyResult<T> {
  data: T;
  isNew: boolean;
}

@Injectable()
export class IdempotencyService implements OnModuleDestroy {
  private operationsInProgress = new Map<string, Promise<any>>();
  private completedOperations = new Map<
    string,
    { data: any; timestamp: number }
  >();
  private cleanupInterval: NodeJS.Timeout;

  private readonly TTL_MS = 60 * 60 * 1000;

  constructor() {
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      15 * 60 * 1000,
    );
  }

  async executeWithIdempotency<T>(
    idempotencyKey: string,
    operation: () => Promise<T>,
  ): Promise<IdempotencyResult<T>> {
    const existing = this.completedOperations.get(idempotencyKey);
    if (existing) {
      return { data: existing.data, isNew: false };
    }

    const inProgress = this.operationsInProgress.get(idempotencyKey);
    if (inProgress) {
      const result = await inProgress;
      return { data: result, isNew: false };
    }

    const operationPromise = this.executeOperation(idempotencyKey, operation);
    this.operationsInProgress.set(idempotencyKey, operationPromise);

    try {
      const result = await operationPromise;

      this.completedOperations.set(idempotencyKey, {
        data: result,
        timestamp: Date.now(),
      });

      return { data: result, isNew: true };
    } finally {
      this.operationsInProgress.delete(idempotencyKey);
    }
  }

  private async executeOperation<T>(
    key: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    return await operation();
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, result] of this.completedOperations.entries()) {
      if (now - result.timestamp > this.TTL_MS) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => {
      this.completedOperations.delete(key);
    });
  }

  getStats() {
    return {
      operationsInProgress: this.operationsInProgress.size,
      completedOperations: this.completedOperations.size,
    };
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
