export interface JobData {
  /** Unique job identifier */
  id: string;
  
  /** HTTP method (GET, POST, PUT, DELETE, etc.) */
  method: string;
  
  /** Request URL path */
  url: string;
  
  /** Request payload data (body for POST/PUT, query params for GET, etc.) */
  data?: any;
  
  /** Essential headers for request reconstruction */
  headers: {
    authorization?: string;
    'content-type'?: string;
    'user-agent'?: string;
  };
  
  /** Extracted user ID from JWT token (if available) */
  userId?: string;
  
  /** Timestamp when the job was created */
  timestamp: number;
  
  /** Query parameters from URL (if any) */
  queryParams?: Record<string, any>;
  
  /** IP address of the client (for logging/security) */
  clientIp?: string;
}

export interface QueueResponse {
  /** Unique job identifier for tracking */
  jobId: string;
  
  /** Current status of the job */
  status: 'queued' | 'processing' | 'completed' | 'failed';
  
  /** Estimated processing time */
  estimatedTime: string;
  
  /** URL to check job status */
  checkStatusUrl: string;
  
  /** Type of queue where job was placed */
  queueType: 'critical' | 'standard' | 'background';
  
  /** Timestamp of response */
  timestamp: string;
  
  /** Additional metadata */
  metadata?: {
    priority?: number;
    retryCount?: number;
    timeout?: number;
  };
}