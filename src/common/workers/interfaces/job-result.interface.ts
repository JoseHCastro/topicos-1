export type JobErrorType = 'http' | 'timeout' | 'exception' | 'unknown';

export interface JobErrorInfo {
  message: string;
  type: JobErrorType;
  statusCode?: number;
  data?: any;
  stack?: string;
}

export interface CacheMetadata {
  hit: boolean;
  key?: string;
  timestamp?: string;
}

export interface JobResultRecord {
  jobId: string;
  queueName: string;
  method: string;
  url: string;
  status: 'completed' | 'failed';
  success: boolean;
  statusCode?: number;
  responseBody?: any;
  responseHeaders?: Record<string, string>;
  executedAt?: string;
  requestBody?: any;
  query?: Record<string, any> | undefined;
  cache?: CacheMetadata | null;
  error?: JobErrorInfo | null;
  attemptsMade: number;
  finishedAt: string;
  workerId?: number;
  result?: any;
}
