import { QueueSystemConfig } from './queue-config.interface';

export interface QueueConfigEvent {
  type: 'updated' | 'queue-updated' | 'queue-created' | 'queue-removed';
  queueName?: string;
  timestamp: string;
  version?: number;
}

export interface IQueueConfigRepository {
  getConfig(): Promise<QueueSystemConfig | null>;
  saveConfig(config: QueueSystemConfig): Promise<void>;

  publishUpdate(event: QueueConfigEvent): Promise<void>;
  subscribe(onMessage: (event: QueueConfigEvent) => void): Promise<void>;
}

export const QUEUE_CONFIG_REPOSITORY = 'QUEUE_CONFIG_REPOSITORY';

