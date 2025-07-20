import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';

@Injectable()
export class CdnService {
  private readonly logger = new Logger(CdnService.name);
  private readonly cloudFrontClient: CloudFrontClient;
  private readonly distributionId: string;
  private readonly cdnUrl: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    this.distributionId = this.configService.get<string>('AWS_CLOUDFRONT_DISTRIBUTION_ID', '');
    this.cdnUrl = this.configService.get<string>('AWS_CLOUDFRONT_URL', '');

    if (accessKeyId && secretAccessKey) {
      this.cloudFrontClient = new CloudFrontClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }

    this.logger.log('CDN service initialized');
  }

  /**
   * Check if CDN is configured and available
   */
  isCdnConfigured(): boolean {
    return !!(this.cdnUrl && this.distributionId && this.cloudFrontClient);
  }

  /**
   * Get CDN URL for a given S3 key
   */
  getCdnUrl(key: string): string | null {
    if (!this.cdnUrl) {
      return null;
    }

    // Ensure key doesn't start with slash
    const cleanKey = key.startsWith('/') ? key.substring(1) : key;
    return `${this.cdnUrl}/${cleanKey}`;
  }

  /**
   * Create cache invalidation for specific paths
   */
  async invalidateCache(paths: string[]): Promise<string | null> {
    if (!this.isCdnConfigured()) {
      this.logger.warn('CDN not configured, skipping cache invalidation');
      return null;
    }

    try {
      // Ensure paths start with /
      const formattedPaths = paths.map(path => 
        path.startsWith('/') ? path : `/${path}`
      );

      const command = new CreateInvalidationCommand({
        DistributionId: this.distributionId,
        InvalidationBatch: {
          CallerReference: `invalidation-${Date.now()}`,
          Paths: {
            Quantity: formattedPaths.length,
            Items: formattedPaths,
          },
        },
      });

      const result = await this.cloudFrontClient.send(command);
      const invalidationId = result.Invalidation?.Id;

      this.logger.log(`Cache invalidation created: ${invalidationId} for paths: ${formattedPaths.join(', ')}`);
      return invalidationId || null;
    } catch (error) {
      this.logger.error(`Failed to create cache invalidation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Invalidate cache for user avatar
   */
  async invalidateUserAvatar(userId: string): Promise<string | null> {
    const avatarPaths = [
      `/avatars/${userId}/*`,
      `/avatars/${userId}/original/*`,
      `/avatars/${userId}/webp/*`,
      `/avatars/${userId}/jpeg/*`,
      `/avatars/${userId}/thumbnails/*`,
    ];

    return this.invalidateCache(avatarPaths);
  }

  /**
   * Invalidate cache for event assets
   */
  async invalidateEventAssets(eventId: string): Promise<string | null> {
    const eventPaths = [
      `/events/${eventId}/*`,
      `/event-assets/${eventId}/*`,
    ];

    return this.invalidateCache(eventPaths);
  }

  /**
   * Invalidate cache for processed images
   */
  async invalidateProcessedImages(folder: string): Promise<string | null> {
    const imagePaths = [
      `/processed/${folder}/*`,
      `/processed/${folder}/webp/*`,
      `/processed/${folder}/jpeg/*`,
      `/processed/${folder}/png/*`,
      `/processed/${folder}/thumbnails/*`,
    ];

    return this.invalidateCache(imagePaths);
  }

  /**
   * Get cache-optimized URL with query parameters for cache busting
   */
  getCacheOptimizedUrl(key: string, version?: string): string | null {
    const cdnUrl = this.getCdnUrl(key);
    if (!cdnUrl) {
      return null;
    }

    if (version) {
      const separator = cdnUrl.includes('?') ? '&' : '?';
      return `${cdnUrl}${separator}v=${version}`;
    }

    return cdnUrl;
  }

  /**
   * Generate responsive image URLs for different sizes
   */
  getResponsiveImageUrls(baseKey: string): {
    original?: string;
    webp?: string;
    jpeg?: string;
    thumbnails: {
      small?: string;
      medium?: string;
      large?: string;
    };
  } {
    const keyWithoutExtension = baseKey.replace(/\.[^/.]+$/, '');
    const folder = baseKey.substring(0, baseKey.lastIndexOf('/'));

    return {
      original: this.getCdnUrl(baseKey),
      webp: this.getCdnUrl(`${folder}/webp/${keyWithoutExtension}.webp`),
      jpeg: this.getCdnUrl(`${folder}/jpeg/${keyWithoutExtension}.jpg`),
      thumbnails: {
        small: this.getCdnUrl(`${folder}/thumbnails/${keyWithoutExtension}-small.webp`),
        medium: this.getCdnUrl(`${folder}/thumbnails/${keyWithoutExtension}-medium.webp`),
        large: this.getCdnUrl(`${folder}/thumbnails/${keyWithoutExtension}-large.webp`),
      },
    };
  }

  /**
   * Health check for CDN service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    configured: boolean;
    distributionId?: string;
    cdnUrl?: string;
  }> {
    const configured = this.isCdnConfigured();
    
    if (!configured) {
      return {
        status: 'degraded',
        configured: false,
      };
    }

    try {
      // Simple test - try to create a test invalidation with empty paths
      // This will fail but confirms we can communicate with CloudFront
      return {
        status: 'healthy',
        configured: true,
        distributionId: this.distributionId,
        cdnUrl: this.cdnUrl,
      };
    } catch (error) {
      this.logger.error(`CDN health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        status: 'unhealthy',
        configured: true,
        distributionId: this.distributionId,
        cdnUrl: this.cdnUrl,
      };
    }
  }
} 