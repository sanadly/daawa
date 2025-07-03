import { Controller, Get, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { metricsRegistry } from '../config/monitoring.config';
import { logger } from '../config/logger.config';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {

  @Get()
  @ApiExcludeEndpoint() // Exclude from Swagger documentation for security
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({ summary: 'Get Prometheus metrics (Internal use only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Prometheus metrics in text format' 
  })
  async getMetrics(@Res() res: Response): Promise<void> {
    try {
      const metrics = await metricsRegistry.metrics();
      
      // Log metrics request (but don't log the actual metrics data as it's verbose)
      logger.debug('Metrics endpoint accessed', {
        timestamp: new Date().toISOString(),
        userAgent: res.req.headers['user-agent'],
        ip: res.req.ip,
      });
      
      res.status(200).send(metrics);
    } catch (error) {
      logger.error('Failed to get metrics', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      res.status(500).send('# Failed to get metrics\n');
    }
  }

  @Get('json')
  @ApiOperation({ summary: 'Get metrics in JSON format (Development only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Metrics in JSON format' 
  })
  async getMetricsJson(@Res() res: Response): Promise<void> {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Attempt to access JSON metrics in production', {
        ip: res.req.ip,
        userAgent: res.req.headers['user-agent'],
      });
      
      res.status(403).json({
        error: 'JSON metrics not available in production',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    try {
      const metrics = await metricsRegistry.getMetricsAsJSON();
      
      logger.debug('JSON metrics endpoint accessed', {
        timestamp: new Date().toISOString(),
        userAgent: res.req.headers['user-agent'],
        ip: res.req.ip,
      });
      
      res.status(200).json({
        timestamp: new Date().toISOString(),
        metrics,
      });
    } catch (error) {
      logger.error('Failed to get JSON metrics', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      res.status(500).json({
        error: 'Failed to get metrics',
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get('reset')
  @ApiOperation({ summary: 'Reset metrics (Development only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Metrics reset successfully' 
  })
  async resetMetrics(@Res() res: Response): Promise<void> {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Attempt to reset metrics in production', {
        ip: res.req.ip,
        userAgent: res.req.headers['user-agent'],
      });
      
      res.status(403).json({
        error: 'Metrics reset not available in production',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    try {
      metricsRegistry.resetMetrics();
      
      logger.info('Metrics reset', {
        timestamp: new Date().toISOString(),
        ip: res.req.ip,
        userAgent: res.req.headers['user-agent'],
      });
      
      res.status(200).json({
        message: 'Metrics reset successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to reset metrics', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      res.status(500).json({
        error: 'Failed to reset metrics',
        timestamp: new Date().toISOString(),
      });
    }
  }
} 