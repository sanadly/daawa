import { registerAs } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';

const { combine, timestamp, printf, colorize, errors, json, prettyPrint } = winston.format;

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, context, trace, ...meta }) => {
    const contextStr = context ? `[${context}] ` : '';
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const traceStr = trace ? `\n${trace}` : '';
    
    return `${timestamp} ${level}: ${contextStr}${message}${metaStr}${traceStr}`;
  })
);

// Custom format for file output
const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  json(),
  prettyPrint()
);

// Log levels configuration
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(logColors);

// Create transports based on environment
const createTransports = (nodeEnv: string) => {
  const transports: winston.transport[] = [];

  // Console transport (always enabled in development)
  if (nodeEnv === 'development') {
    transports.push(
      new winston.transports.Console({
        level: 'debug',
        format: consoleFormat,
        handleExceptions: true,
        handleRejections: true,
      })
    );
  } else {
    // In production, limit console output
    transports.push(
      new winston.transports.Console({
        level: 'warn',
        format: consoleFormat,
        handleExceptions: true,
        handleRejections: true,
      })
    );
  }

  // File transport for errors
  transports.push(
    new winston.transports.DailyRotateFile({
      level: 'error',
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
      handleExceptions: true,
      handleRejections: true,
    })
  );

  // File transport for all logs
  transports.push(
    new winston.transports.DailyRotateFile({
      level: nodeEnv === 'development' ? 'debug' : 'info',
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
    })
  );

  // HTTP access logs
  transports.push(
    new winston.transports.DailyRotateFile({
      level: 'http',
      filename: path.join(logsDir, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: fileFormat,
    })
  );

  return transports;
};

// Logger configuration factory
const createLoggerConfig = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const logLevel = process.env.LOG_LEVEL || (nodeEnv === 'development' ? 'debug' : 'info');

  return {
    level: logLevel,
    levels: logLevels,
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true })
    ),
    transports: createTransports(nodeEnv),
    exitOnError: false,
    silent: process.env.NODE_ENV === 'test', // Disable logging in tests
  };
};

// Export logger configuration
export default registerAs('logger', createLoggerConfig);

// Export Winston logger instance for direct use
export const logger = winston.createLogger(createLoggerConfig());

// Request logging middleware configuration
export const requestLoggerConfig = {
  level: 'http',
  format: combine(
    timestamp(),
    printf(({ timestamp, message }) => `${timestamp} ${message}`)
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'requests-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
};

// Structured logging helpers
export const createLogEntry = (
  level: string,
  message: string,
  context?: string,
  metadata?: Record<string, any>
) => ({
  level,
  message,
  context,
  timestamp: new Date().toISOString(),
  ...metadata,
});

// Performance logging helper
export const logPerformance = (
  operation: string,
  startTime: number,
  context?: string,
  metadata?: Record<string, any>
) => {
  const duration = Date.now() - startTime;
  logger.info(
    `Performance: ${operation} completed in ${duration}ms`,
    {
      context: context || 'Performance',
      operation,
      duration,
      ...metadata,
    }
  );
};

// Database query logging helper
export const logDatabaseQuery = (
  query: string,
  duration: number,
  context: string = 'Database'
) => {
  logger.debug('Database query executed', {
    context,
    query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
    duration,
  });
};

// Error logging helper with structured data
export const logError = (
  error: Error,
  context?: string,
  metadata?: Record<string, any>
) => {
  logger.error(error.message, {
    context: context || 'Error',
    stack: error.stack,
    name: error.name,
    ...metadata,
  });
};

// Security event logging
export const logSecurityEvent = (
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: Record<string, any>
) => {
  logger.warn(`Security Event: ${event}`, {
    context: 'Security',
    event,
    severity,
    ...details,
  });
};

// Business logic logging
export const logBusinessEvent = (
  event: string,
  entity: string,
  entityId: string | number,
  details?: Record<string, any>
) => {
  logger.info(`Business Event: ${event}`, {
    context: 'Business',
    event,
    entity,
    entityId,
    ...details,
  });
}; 