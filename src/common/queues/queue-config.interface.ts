export interface QueueDefinition {
  /** Unique queue identifier */
  name: string;
  
  /** Display name for UI */
  displayName: string;
  
  /** Queue priority (higher = more priority) */
  priority: number;
  
  /** Processing timeout in seconds */
  timeout: number;
  
  /** Number of retry attempts */
  attempts: number;
  
  /** Delay between retries in milliseconds */
  retryDelay: number;
  
  /** Estimated processing time range */
  estimatedTime: string;
  
  /** Worker concurrency level */
  concurrency: number;
  
  /** Number of workers to create for this queue */
  workers?: number;
  
  /** URL patterns that should go to this queue */
  urlPatterns: string[];
  
  /** Optional delay before processing in milliseconds */
  processingDelay?: number;
  
  /** Maximum number of jobs to keep completed */
  removeOnComplete?: number;
  
  /** Maximum number of failed jobs to keep */
  removeOnFail?: number;
  
  /** Queue description for documentation */
  description?: string;
  
  /** Whether this queue is enabled */
  enabled?: boolean;
}

export interface QueueSystemConfig {
  /** All available queue definitions */
  queues: QueueDefinition[];
  
  /** Default queue name for unmatched URLs */
  defaultQueue: string;
  
  /** Global job TTL in milliseconds */
  jobTtl: number;
  
  /** Whether the queue system is enabled */
  enabled: boolean;
  
  /** Global timeout for job status polling */
  pollingTimeout: number;
}

/**
 * Default queue configuration - can be overridden via environment or config files
 */
export const DEFAULT_QUEUE_CONFIG: QueueSystemConfig = {
  enabled: true,
  defaultQueue: 'standard',
  jobTtl: 3600000, // 1 hour
  pollingTimeout: 300000, // 5 minutes
  queues: [
    {
      name: 'critical',
      displayName: '🔴 Critical Queue',
      priority: 10,
      timeout: 30,
      attempts: 3,
      retryDelay: 1000,
      estimatedTime: '5-30 seconds',
      concurrency: 3,
      processingDelay: 0,
      removeOnComplete: 100,
      removeOnFail: 50,
      urlPatterns: [
        '/atomic-enrollment/*',
        '/auth/login',
        '/auth/logout',
        '/emergency/*'
      ],
      description: 'High priority operations that cannot wait',
      enabled: true,
    },
    {
      name: 'standard',
      displayName: '🟡 Standard Queue', 
      priority: 5,
      timeout: 60,
      attempts: 2,
      retryDelay: 2000,
      estimatedTime: '15-60 seconds',
      concurrency: 3,
      processingDelay: 100,
      removeOnComplete: 100,
      removeOnFail: 50,
      urlPatterns: [
        '/courses/*',
        '/students/*',
        '/grades/*',
        '/academic-validations/*',
        '/programs/*',
        '/enrollments/*'
      ],
      description: 'Standard operations with normal priority',
      enabled: true,
    },
    {
      name: 'background',
      displayName: '🟢 Background Queue',
      priority: 1,
      timeout: 120,
      attempts: 1,
      retryDelay: 5000,
      estimatedTime: '30-120 seconds',
      concurrency: 2,
      processingDelay: 1000,
      removeOnComplete: 50,
      removeOnFail: 25,
      urlPatterns: [
        '/reports/*',
        '/notifications/*',
        '/database-performance/*',
        '/analytics/*',
        '/batch-operations/*'
      ],
      description: 'Background operations that can be processed later',
      enabled: true,
    },
  ],
};

/**
 * Load queue configuration from environment variables or config files
 */
export function loadQueueConfig(): QueueSystemConfig {
  // First try to load from config/queues.json
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Look for queues.json in config directory
    const configPath = path.join(process.cwd(), 'config', 'queues.json');
    
    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log(`✅ Loaded queue configuration from ${configPath}`);
      return configData;
    }
  } catch (error) {
    console.warn(`⚠️ Failed to load config/queues.json: ${error.message}`);
  }
  
  // Check if custom config exists in environment
  const customConfigPath = process.env.QUEUE_CONFIG_PATH;
  
  if (customConfigPath) {
    try {
      // Load from file (JSON or YAML)
      const fs = require('fs');
      const customConfig = JSON.parse(fs.readFileSync(customConfigPath, 'utf8'));
      return { ...DEFAULT_QUEUE_CONFIG, ...customConfig };
    } catch (error) {
      console.warn(`⚠️ Failed to load custom queue config from ${customConfigPath}, using defaults`);
    }
  }
  
  // Load from environment variables
  const envConfig: Partial<QueueSystemConfig> = {
    enabled: process.env.QUEUE_SYSTEM_ENABLED === 'true',
    defaultQueue: process.env.QUEUE_DEFAULT_NAME || DEFAULT_QUEUE_CONFIG.defaultQueue,
    jobTtl: parseInt(process.env.QUEUE_JOB_TTL || '3600000', 10),
    pollingTimeout: parseInt(process.env.QUEUE_POLLING_TIMEOUT || '300000', 10),
  };
  
  console.log('📋 Using default queue configuration with environment overrides');
  return { ...DEFAULT_QUEUE_CONFIG, ...envConfig };
}