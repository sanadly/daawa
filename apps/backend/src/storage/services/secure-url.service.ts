import { Injectable, Logger, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AwsS3Service } from './aws-s3.service';
import { CdnService } from './cdn.service';
import * as crypto from 'crypto';

export interface SecureUrlOptions {
  expiresIn?: number; // seconds
  userId?: string; // for user-specific access
  permissions?: string[]; // read, write, delete
  resourceType?: 'avatar' | 'event-asset' | 'pass-asset' | 'general';
  maxDownloads?: number; // limit number of downloads
  ipWhitelist?: string[]; // restrict to specific IPs
}

export interface SecureUrlPayload {
  key: string;
  bucket?: string;
  userId?: string;
  permissions: string[];
  resourceType: string;
  maxDownloads?: number;
  downloadCount?: number;
  ipWhitelist?: string[];
  iat: number;
  exp: number;
}

@Injectable()
export class SecureUrlService {
  private readonly logger = new Logger(SecureUrlService.name);
  private readonly secretKey: string;
  private readonly defaultExpiration: number = 3600; // 1 hour

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private storageService: AwsS3Service,
    private cdnService: CdnService,
  ) {
    this.secretKey = this.configService.get<string>('SECURE_URL_SECRET') || 
                     this.configService.get<string>('JWT_ACCESS_SECRET') || 
                     'fallback-secret-key';
  }

  /**
   * Generate a secure, time-limited URL for file access
   */
  async generateSecureUrl(
    key: string, 
    options: SecureUrlOptions = {}
  ): Promise<{
    secureUrl: string;
    directUrl?: string;
    expiresAt: Date;
    token: string;
  }> {
    const expiresIn = options.expiresIn || this.defaultExpiration;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Create payload for the secure token
    const payload: SecureUrlPayload = {
      key,
      bucket: options.resourceType ? this.getBucketForResourceType(options.resourceType) : undefined,
      userId: options.userId,
      permissions: options.permissions || ['read'],
      resourceType: options.resourceType || 'general',
      maxDownloads: options.maxDownloads,
      downloadCount: 0,
      ipWhitelist: options.ipWhitelist,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    // Generate JWT token
    const token = this.jwtService.sign(payload, {
      secret: this.secretKey,
      expiresIn: `${expiresIn}s`,
    });

    // Generate the secure URL
    const baseUrl = this.configService.get<string>('API_URL') || 'http://localhost:3001/api/v1';
    const secureUrl = `${baseUrl}/storage/secure/${encodeURIComponent(token)}`;

    // Also generate direct URL for comparison/fallback
    const directUrl = this.storageService.getPublicUrl(key, payload.bucket);

    this.logger.log(`Generated secure URL for key: ${key}, expires at: ${expiresAt.toISOString()}`);

    return {
      secureUrl,
      directUrl,
      expiresAt,
      token,
    };
  }

  /**
   * Generate secure URLs for responsive images
   */
  async generateSecureResponsiveUrls(
    baseKey: string,
    options: SecureUrlOptions = {}
  ): Promise<{
    original?: { secureUrl: string; directUrl?: string; token: string };
    webp?: { secureUrl: string; directUrl?: string; token: string };
    jpeg?: { secureUrl: string; directUrl?: string; token: string };
    thumbnails: {
      small?: { secureUrl: string; directUrl?: string; token: string };
      medium?: { secureUrl: string; directUrl?: string; token: string };
      large?: { secureUrl: string; directUrl?: string; token: string };
    };
    expiresAt: Date;
  }> {
    const keyWithoutExtension = baseKey.replace(/\.[^/.]+$/, '');
    const folder = baseKey.substring(0, baseKey.lastIndexOf('/'));

    const urls = {
      thumbnails: {} as any,
      expiresAt: new Date(Date.now() + (options.expiresIn || this.defaultExpiration) * 1000),
    };

    // Generate secure URLs for different formats
    const formats = [
      { key: 'original', path: baseKey },
      { key: 'webp', path: `${folder}/webp/${keyWithoutExtension}.webp` },
      { key: 'jpeg', path: `${folder}/jpeg/${keyWithoutExtension}.jpg` },
    ];

    for (const format of formats) {
      try {
        const result = await this.generateSecureUrl(format.path, options);
        urls[format.key] = {
          secureUrl: result.secureUrl,
          directUrl: result.directUrl,
          token: result.token,
        };
      } catch (error) {
        this.logger.warn(`Failed to generate secure URL for ${format.key}: ${format.path}`);
      }
    }

    // Generate secure URLs for thumbnails
    const thumbnailSizes = ['small', 'medium', 'large'];
    for (const size of thumbnailSizes) {
      try {
        const thumbnailPath = `${folder}/thumbnails/${keyWithoutExtension}-${size}.webp`;
        const result = await this.generateSecureUrl(thumbnailPath, options);
        urls.thumbnails[size] = {
          secureUrl: result.secureUrl,
          directUrl: result.directUrl,
          token: result.token,
        };
      } catch (error) {
        this.logger.warn(`Failed to generate secure URL for ${size} thumbnail: ${keyWithoutExtension}`);
      }
    }

    return urls;
  }

  /**
   * Validate and decode a secure URL token
   */
  async validateSecureToken(
    token: string,
    clientIp?: string
  ): Promise<SecureUrlPayload> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.secretKey,
      }) as SecureUrlPayload;

      // Check if token has expired
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new UnauthorizedException('Secure URL has expired');
      }

      // Check IP whitelist if specified
      if (payload.ipWhitelist && payload.ipWhitelist.length > 0) {
        if (!clientIp || !payload.ipWhitelist.includes(clientIp)) {
          throw new ForbiddenException('Access denied from this IP address');
        }
      }

      // Check download limits
      if (payload.maxDownloads && payload.downloadCount >= payload.maxDownloads) {
        throw new ForbiddenException('Download limit exceeded');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid secure URL token');
    }
  }

  /**
   * Access a file through secure URL
   */
  async accessSecureFile(
    token: string,
    clientIp?: string,
    userId?: string
  ): Promise<{
    fileBuffer: Buffer;
    contentType: string;
    fileName: string;
    payload: SecureUrlPayload;
  }> {
    const payload = await this.validateSecureToken(token, clientIp);

    // Additional user validation if required
    if (payload.userId && payload.userId !== userId) {
      throw new ForbiddenException('Access denied: user mismatch');
    }

    // Check if user has read permission
    if (!payload.permissions.includes('read')) {
      throw new ForbiddenException('Access denied: insufficient permissions');
    }

    try {
      // Download the file
      const fileBuffer = await this.storageService.download(payload.key, payload.bucket);
      
      // Increment download count (in a real implementation, you'd store this in a database)
      // For now, we'll just log it
      this.logger.log(`File accessed: ${payload.key} by user: ${userId || 'anonymous'}`);

      // Determine content type based on file extension
      const extension = payload.key.split('.').pop()?.toLowerCase();
      const contentType = this.getContentType(extension);

      // Extract filename from key
      const fileName = payload.key.split('/').pop() || 'download';

      return {
        fileBuffer,
        contentType,
        fileName,
        payload,
      };
    } catch (error) {
      this.logger.error(`Failed to access secure file: ${payload.key}`, error);
      throw new BadRequestException('Failed to access file');
    }
  }

  /**
   * Generate secure presigned URL (combines S3 presigned URL with our token)
   */
  async generateSecurePresignedUrl(
    key: string,
    options: SecureUrlOptions = {}
  ): Promise<{
    presignedUrl: string;
    secureToken: string;
    expiresAt: Date;
  }> {
    const expiresIn = options.expiresIn || this.defaultExpiration;
    
    // Generate our secure token
    const secureResult = await this.generateSecureUrl(key, options);
    
    // Generate S3 presigned URL
    const presignedUrl = await this.storageService.getPresignedUrl(key, {
      bucket: options.resourceType ? this.getBucketForResourceType(options.resourceType) : undefined,
      expiresIn,
    });

    return {
      presignedUrl,
      secureToken: secureResult.token,
      expiresAt: secureResult.expiresAt,
    };
  }

  /**
   * Revoke a secure URL token (in production, maintain a blacklist)
   */
  async revokeSecureToken(token: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.secretKey,
      }) as SecureUrlPayload;

      // In a production system, you would add this token to a blacklist
      // For now, we'll just log the revocation
      this.logger.log(`Secure token revoked for key: ${payload.key}`);
    } catch (error) {
      throw new BadRequestException('Invalid token for revocation');
    }
  }

  /**
   * Get usage statistics for secure URLs
   */
  async getSecureUrlStats(userId?: string): Promise<{
    totalGenerated: number;
    totalAccessed: number;
    activeTokens: number;
    expiredTokens: number;
  }> {
    // In a production system, you would query a database for these statistics
    // For now, return mock data
    return {
      totalGenerated: 0,
      totalAccessed: 0,
      activeTokens: 0,
      expiredTokens: 0,
    };
  }

  /**
   * Helper method to get bucket name for resource type
   */
  private getBucketForResourceType(resourceType: string): string {
    const buckets = {
      'avatar': this.configService.get<string>('AWS_S3_PROCESSED_IMAGES_BUCKET', 'daawa-processed-images'),
      'event-asset': this.configService.get<string>('AWS_S3_EVENT_ASSETS_BUCKET', 'daawa-event-assets'),
      'pass-asset': this.configService.get<string>('AWS_S3_PASS_ASSETS_BUCKET', 'daawa-pass-assets'),
      'general': this.configService.get<string>('AWS_S3_USER_UPLOADS_BUCKET', 'daawa-user-uploads'),
    };

    return buckets[resourceType] || buckets['general'];
  }

  /**
   * Helper method to determine content type from file extension
   */
  private getContentType(extension?: string): string {
    const contentTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'json': 'application/json',
      'zip': 'application/zip',
    };

    return contentTypes[extension || ''] || 'application/octet-stream';
  }
} 