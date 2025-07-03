import { registerAs } from '@nestjs/config';
import * as promClient from 'prom-client';

// Initialize Prometheus metrics
const register = new promClient.Registry();

// Default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'daawa_',
});

// Custom metrics
export const httpRequestsTotal = new promClient.Counter({
  name: 'daawa_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new promClient.Histogram({
  name: 'daawa_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

export const databaseQueryDuration = new promClient.Histogram({
  name: 'daawa_database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

export const databaseConnectionsActive = new promClient.Gauge({
  name: 'daawa_database_connections_active',
  help: 'Number of active database connections',
  registers: [register],
});

export const cacheHitsTotal = new promClient.Counter({
  name: 'daawa_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type', 'key_prefix'],
  registers: [register],
});

export const cacheMissesTotal = new promClient.Counter({
  name: 'daawa_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type', 'key_prefix'],
  registers: [register],
});

export const businessEventsTotal = new promClient.Counter({
  name: 'daawa_business_events_total',
  help: 'Total number of business events',
  labelNames: ['event_type', 'entity'],
  registers: [register],
});

export const errorsTotal = new promClient.Counter({
  name: 'daawa_errors_total',
  help: 'Total number of errors',
  labelNames: ['error_type', 'severity'],
  registers: [register],
});

export const activeUsersGauge = new promClient.Gauge({
  name: 'daawa_active_users',
  help: 'Number of currently active users',
  registers: [register],
});

export const memoryUsageGauge = new promClient.Gauge({
  name: 'daawa_memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type'],
  registers: [register],
});

// Export the metrics registry
export const metricsRegistry = register;

// Monitoring configuration
export interface MonitoringConfig {
  sentry: {
    dsn?: string;
    environment: string;
    tracesSampleRate: number;
    profilesSampleRate: number;
    debug: boolean;
    integrations: string[];
  };
  prometheus: {
    enabled: boolean;
    endpoint: string;
    collectDefaultMetrics: boolean;
  };
  healthCheck: {
    enabled: boolean;
    endpoint: string;
    timeout: number;
  };
  logging: {
    level: string;
    structured: boolean;
    enableRequestLogging: boolean;
    enableErrorLogging: boolean;
    enablePerformanceLogging: boolean;
  };
  alerts: {
    enabled: boolean;
    webhook?: string;
    email?: string;
    thresholds: {
      errorRate: number;
      responseTime: number;
      memoryUsage: number;
      cpuUsage: number;
    };
  };
}

const createMonitoringConfig = (): MonitoringConfig => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  return {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: nodeEnv,
      tracesSampleRate: nodeEnv === 'production' ? 0.1 : 1.0,
      profilesSampleRate: nodeEnv === 'production' ? 0.1 : 1.0,
      debug: nodeEnv === 'development',
      integrations: ['Http', 'Express', 'Postgres', 'Redis'],
    },
    prometheus: {
      enabled: process.env.PROMETHEUS_ENABLED !== 'false',
      endpoint: process.env.PROMETHEUS_ENDPOINT || '/metrics',
      collectDefaultMetrics: true,
    },
    healthCheck: {
      enabled: true,
      endpoint: process.env.HEALTH_CHECK_ENDPOINT || '/health',
      timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000'),
    },
    logging: {
      level: process.env.LOG_LEVEL || (nodeEnv === 'development' ? 'debug' : 'info'),
      structured: nodeEnv !== 'development',
      enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false',
      enableErrorLogging: process.env.ENABLE_ERROR_LOGGING !== 'false',
      enablePerformanceLogging: process.env.ENABLE_PERFORMANCE_LOGGING !== 'false',
    },
    alerts: {
      enabled: process.env.ALERTS_ENABLED === 'true',
      webhook: process.env.ALERT_WEBHOOK_URL,
      email: process.env.ALERT_EMAIL,
      thresholds: {
        errorRate: parseFloat(process.env.ALERT_ERROR_RATE_THRESHOLD || '0.05'), // 5%
        responseTime: parseInt(process.env.ALERT_RESPONSE_TIME_THRESHOLD || '2000'), // 2s
        memoryUsage: parseFloat(process.env.ALERT_MEMORY_THRESHOLD || '0.85'), // 85%
        cpuUsage: parseFloat(process.env.ALERT_CPU_THRESHOLD || '0.8'), // 80%
      },
    },
  };
};

export default registerAs('monitoring', createMonitoringConfig);

// Utility functions for metrics
export const incrementHttpRequest = (
  method: string,
  route: string,
  statusCode: number
) => {
  httpRequestsTotal.inc({
    method: method.toUpperCase(),
    route,
    status_code: statusCode.toString(),
  });
};

export const observeHttpRequestDuration = (
  method: string,
  route: string,
  statusCode: number,
  durationSeconds: number
) => {
  httpRequestDuration.observe(
    {
      method: method.toUpperCase(),
      route,
      status_code: statusCode.toString(),
    },
    durationSeconds
  );
};

export const observeDatabaseQuery = (
  queryType: string,
  table: string,
  durationSeconds: number
) => {
  databaseQueryDuration.observe(
    {
      query_type: queryType.toUpperCase(),
      table,
    },
    durationSeconds
  );
};

export const updateDatabaseConnections = (count: number) => {
  databaseConnectionsActive.set(count);
};

export const incrementCacheHit = (cacheType: string, keyPrefix: string) => {
  cacheHitsTotal.inc({ cache_type: cacheType, key_prefix: keyPrefix });
};

export const incrementCacheMiss = (cacheType: string, keyPrefix: string) => {
  cacheMissesTotal.inc({ cache_type: cacheType, key_prefix: keyPrefix });
};

export const incrementBusinessEvent = (eventType: string, entity: string) => {
  businessEventsTotal.inc({ event_type: eventType, entity });
};

export const incrementError = (errorType: string, severity: string) => {
  errorsTotal.inc({ error_type: errorType, severity });
};

export const updateActiveUsers = (count: number) => {
  activeUsersGauge.set(count);
};

export const updateMemoryUsage = () => {
  const memUsage = process.memoryUsage();
  memoryUsageGauge.set({ type: 'rss' }, memUsage.rss);
  memoryUsageGauge.set({ type: 'heap_used' }, memUsage.heapUsed);
  memoryUsageGauge.set({ type: 'heap_total' }, memUsage.heapTotal);
  memoryUsageGauge.set({ type: 'external' }, memUsage.external);
};

// Start memory monitoring
setInterval(updateMemoryUsage, 30000); // Update every 30 seconds

// Health check utilities
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: { status: string; latency?: number; error?: string };
    redis: { status: string; latency?: number; error?: string };
    external_apis: { status: string; details?: Record<string, any> };
  };
  metrics: {
    memory: NodeJS.MemoryUsage;
    cpu: number;
    requests_per_minute: number;
    errors_per_minute: number;
  };
}

export const createHealthStatus = async (): Promise<HealthStatus> => {
  const now = new Date();
  const uptime = process.uptime();
  
  // Basic health status
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: now.toISOString(),
    uptime,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: { status: 'unknown' },
      redis: { status: 'unknown' },
      external_apis: { status: 'unknown' },
    },
    metrics: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage().user / 1000000, // Convert to seconds
      requests_per_minute: 0, // Would need to calculate from metrics
      errors_per_minute: 0, // Would need to calculate from metrics
    },
  };

  // TODO: Add actual service health checks
  // This would be implemented with actual database and Redis connections
  
  return health;
}; 