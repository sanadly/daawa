import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { 
  incrementHttpRequest, 
  observeHttpRequestDuration,
  incrementError 
} from '../config/monitoring.config';
import { logger } from '../config/logger.config';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const startHrTime = process.hrtime();

    // Extract request information
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || '';
    const contentLength = headers['content-length'] || '0';
    
    // Generate request ID for tracing
    const requestId = this.generateRequestId();
    req['requestId'] = requestId;

    // Log request start
    this.logger.debug(`Incoming ${method} ${originalUrl}`, {
      requestId,
      method,
      url: originalUrl,
      ip,
      userAgent,
      contentLength,
    });

    // Log structured request data
    logger.http('HTTP Request', {
      requestId,
      method,
      url: originalUrl,
      ip,
      userAgent,
      contentLength: parseInt(contentLength),
      timestamp: new Date().toISOString(),
    });

    // Override res.end to capture response data
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any): Response {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const durationSeconds = duration / 1000;
      const [seconds, nanoseconds] = process.hrtime(startHrTime);
      const preciseDuration = seconds + nanoseconds / 1e9;

      // Get response size
      const responseSize = res.get('Content-Length') || 
        (chunk ? Buffer.byteLength(chunk, encoding) : 0);

      // Log response
      const logData = {
        requestId,
        method,
        url: originalUrl,
        statusCode: res.statusCode,
        duration,
        durationSeconds: preciseDuration,
        responseSize,
        ip,
        userAgent,
        timestamp: new Date().toISOString(),
      };

      // Determine log level based on status code
      if (res.statusCode >= 500) {
        logger.error('HTTP Response - Server Error', logData);
        incrementError('http_5xx', 'high');
      } else if (res.statusCode >= 400) {
        logger.warn('HTTP Response - Client Error', logData);
        incrementError('http_4xx', 'medium');
      } else {
        logger.http('HTTP Response', logData);
      }

      // Update Prometheus metrics
      incrementHttpRequest(method, originalUrl, res.statusCode);
      observeHttpRequestDuration(method, originalUrl, res.statusCode, preciseDuration);

      // Call original end and return its result
      return originalEnd.call(this, chunk, encoding);
    };

    // Handle errors
    res.on('error', (error) => {
      logger.error('Response error', {
        requestId,
        method,
        url: originalUrl,
        error: error.message,
        stack: error.stack,
      });
      incrementError('response_error', 'high');
    });

    next();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

@Injectable()
export class ErrorLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ErrorLoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    // Capture unhandled errors
    const originalJson = res.json;
    res.json = function(body?: any): Response {
      if (res.statusCode >= 400 && body) {
        logger.error('API Error Response', {
          requestId: req['requestId'],
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          errorBody: body,
          timestamp: new Date().toISOString(),
        });
      }
      
      return originalJson.call(this, body);
    };

    next();
  }
}

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PerformanceMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = process.hrtime.bigint();
    
    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds
      
      // Log slow requests
      const slowRequestThreshold = 1000; // 1 second
      if (duration > slowRequestThreshold) {
        logger.warn('Slow Request Detected', {
          requestId: req['requestId'],
          method: req.method,
          url: req.originalUrl,
          duration,
          statusCode: res.statusCode,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Log performance metrics for all requests
      logger.debug('Request Performance', {
        requestId: req['requestId'],
        method: req.method,
        url: req.originalUrl,
        duration,
        statusCode: res.statusCode,
        memoryUsage: process.memoryUsage(),
      });
    });

    next();
  }
}

// Security logging middleware
@Injectable()
export class SecurityLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityLoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip, headers } = req;
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\.\.\//,           // Directory traversal
      /<script/i,         // XSS attempts
      /union.*select/i,   // SQL injection
      /javascript:/i,     // JavaScript injection
      /vbscript:/i,       // VBScript injection
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(originalUrl) || 
      pattern.test(JSON.stringify(req.body || {}))
    );

    if (isSuspicious) {
      logger.warn('Suspicious Request Detected', {
        requestId: req['requestId'],
        method,
        url: originalUrl,
        ip,
        userAgent: headers['user-agent'],
        body: req.body,
        timestamp: new Date().toISOString(),
        severity: 'medium',
      });
    }

    // Log authentication attempts
    if (originalUrl.includes('/auth') || originalUrl.includes('/login')) {
      logger.info('Authentication Attempt', {
        requestId: req['requestId'],
        method,
        url: originalUrl,
        ip,
        userAgent: headers['user-agent'],
        timestamp: new Date().toISOString(),
      });
    }

    // Check for rate limiting indicators
    const requestCount = res.getHeader('X-RateLimit-Remaining');
    if (requestCount !== undefined && Number(requestCount) < 10) {
      logger.warn('Rate Limit Approaching', {
        requestId: req['requestId'],
        ip,
        remaining: requestCount,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  }
} 