import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand, 
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  PutObjectCommandInput,
  ObjectCannedACL
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { CdnService } from './cdn.service';

import { 
  IStorageService, 
  StorageFile, 
  UploadResult, 
  UploadOptions, 
  PresignedUrlOptions,
  StorageConfig 
} from '../interfaces/storage.interface';

@Injectable()
export class AwsS3Service implements IStorageService {
  private readonly logger = new Logger(AwsS3Service.name);
  private readonly s3Client: S3Client;
  private readonly config: StorageConfig;

  constructor(
    private configService: ConfigService,
    private cdnService: CdnService
  ) {
    this.config = {
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      defaultBucket: this.configService.get<string>('AWS_S3_DEFAULT_BUCKET'),
      buckets: {
        userUploads: this.configService.get<string>('AWS_S3_USER_UPLOADS_BUCKET', 'daawa-user-uploads'),
        processedImages: this.configService.get<string>('AWS_S3_PROCESSED_IMAGES_BUCKET', 'daawa-processed-images'),
        eventAssets: this.configService.get<string>('AWS_S3_EVENT_ASSETS_BUCKET', 'daawa-event-assets'),
        passAssets: this.configService.get<string>('AWS_S3_PASS_ASSETS_BUCKET', 'daawa-pass-assets'),
      },
      cdnUrl: this.configService.get<string>('AWS_CLOUDFRONT_URL'),
      maxFileSize: this.configService.get<number>('STORAGE_MAX_FILE_SIZE', 10 * 1024 * 1024), // 10MB
      allowedMimeTypes: this.configService.get<string>('STORAGE_ALLOWED_MIME_TYPES', 'image/jpeg,image/png,image/webp,image/gif,application/pdf').split(','),
    };

    if (!this.config.accessKeyId || !this.config.secretAccessKey) {
      throw new Error('AWS credentials are required for S3 service');
    }

    this.s3Client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });

    this.logger.log('AWS S3 service initialized');
  }

  async upload(file: StorageFile, options: UploadOptions = {}): Promise<UploadResult> {
    try {
      this.validateFile(file);

      const bucket = options.bucket || this.config.defaultBucket;
      const key = this.generateKey(file.originalname, options);
      
      const uploadParams: PutObjectCommandInput = {
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          ...options.metadata,
        },
      };

      if (options.tags) {
        uploadParams.Tagging = this.formatTags(options.tags);
      }

      if (options.acl) {
        uploadParams.ACL = options.acl as ObjectCannedACL;
      }

      const command = new PutObjectCommand(uploadParams);
      const result = await this.s3Client.send(command);

      this.logger.log(`File uploaded successfully: ${key} to bucket: ${bucket}`);

      // Get the optimized URL (CDN if available, otherwise S3 direct)
      const url = this.getPublicUrl(key, bucket);

      return {
        key,
        url,
        bucket,
        etag: result.ETag,
        size: file.size,
        contentType: file.mimetype,
        lastModified: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async uploadMultiple(files: StorageFile[], options: UploadOptions = {}): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.upload(file, options));
    return Promise.all(uploadPromises);
  }

  async download(key: string, bucket?: string): Promise<Buffer> {
    try {
      const targetBucket = bucket || this.config.defaultBucket;
      const command = new GetObjectCommand({
        Bucket: targetBucket,
        Key: key,
      });

      const result = await this.s3Client.send(command);
      const stream = result.Body as any;
      
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    } catch (error) {
      this.logger.error(`Failed to download file: ${key}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to download file');
    }
  }

  async delete(key: string, bucket?: string): Promise<void> {
    try {
      const targetBucket = bucket || this.config.defaultBucket;
      const command = new DeleteObjectCommand({
        Bucket: targetBucket,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key} from bucket: ${targetBucket}`);

      // Invalidate CDN cache for the deleted file
      await this.invalidateCacheForKey(key);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${key}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  async deleteMultiple(keys: string[], bucket?: string): Promise<void> {
    try {
      const targetBucket = bucket || this.config.defaultBucket;
      const command = new DeleteObjectsCommand({
        Bucket: targetBucket,
        Delete: {
          Objects: keys.map(key => ({ Key: key })),
          Quiet: true,
        },
      });

      await this.s3Client.send(command);
      this.logger.log(`Multiple files deleted successfully from bucket: ${targetBucket}`);

      // Invalidate CDN cache for all deleted files
      await this.invalidateCacheForKeys(keys);
    } catch (error) {
      this.logger.error(`Failed to delete multiple files`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to delete files');
    }
  }

  async exists(key: string, bucket?: string): Promise<boolean> {
    try {
      const targetBucket = bucket || this.config.defaultBucket;
      const command = new HeadObjectCommand({
        Bucket: targetBucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  async getPresignedUrl(key: string, options: PresignedUrlOptions = {}): Promise<string> {
    try {
      const targetBucket = options.bucket || this.config.defaultBucket;
      const command = new GetObjectCommand({
        Bucket: targetBucket,
        Key: key,
        ResponseContentType: options.responseContentType,
        ResponseContentDisposition: options.responseContentDisposition,
      });

      const expiresIn = options.expiresIn || 3600; // 1 hour default
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL for: ${key}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to generate presigned URL');
    }
  }

  getPublicUrl(key: string, bucket?: string): string {
    // Try to get CDN URL first
    const cdnUrl = this.cdnService.getCdnUrl(key);
    if (cdnUrl) {
      return cdnUrl;
    }

    // Fall back to direct S3 URL
    const targetBucket = bucket || this.config.defaultBucket;
    return `https://${targetBucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }

  /**
   * Get cache-optimized URL with version for cache busting
   */
  getCacheOptimizedUrl(key: string, version?: string): string {
    const cdnUrl = this.cdnService.getCacheOptimizedUrl(key, version);
    if (cdnUrl) {
      return cdnUrl;
    }

    // Fall back to direct S3 URL with version parameter
    const directUrl = this.getPublicUrl(key);
    if (version) {
      const separator = directUrl.includes('?') ? '&' : '?';
      return `${directUrl}${separator}v=${version}`;
    }

    return directUrl;
  }

  /**
   * Get responsive image URLs for different formats and sizes
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
    return this.cdnService.getResponsiveImageUrls(baseKey);
  }

  async listFiles(prefix?: string, bucket?: string): Promise<string[]> {
    try {
      const targetBucket = bucket || this.config.defaultBucket;
      const command = new ListObjectsV2Command({
        Bucket: targetBucket,
        Prefix: prefix,
      });

      const result = await this.s3Client.send(command);
      return result.Contents?.map(obj => obj.Key) || [];
    } catch (error) {
      this.logger.error(`Failed to list files`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to list files');
    }
  }

  async copyFile(sourceKey: string, destinationKey: string, sourceBucket?: string, destinationBucket?: string): Promise<void> {
    try {
      const srcBucket = sourceBucket || this.config.defaultBucket;
      const destBucket = destinationBucket || this.config.defaultBucket;
      
      const command = new CopyObjectCommand({
        Bucket: destBucket,
        CopySource: `${srcBucket}/${sourceKey}`,
        Key: destinationKey,
      });

      await this.s3Client.send(command);
      this.logger.log(`File copied from ${srcBucket}/${sourceKey} to ${destBucket}/${destinationKey}`);

      // Invalidate CDN cache for the new file
      await this.invalidateCacheForKey(destinationKey);
    } catch (error) {
      this.logger.error(`Failed to copy file`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to copy file');
    }
  }

  async moveFile(sourceKey: string, destinationKey: string, sourceBucket?: string, destinationBucket?: string): Promise<void> {
    await this.copyFile(sourceKey, destinationKey, sourceBucket, destinationBucket);
    await this.delete(sourceKey, sourceBucket);
  }

  /**
   * Invalidate CDN cache for a specific key
   */
  private async invalidateCacheForKey(key: string): Promise<void> {
    try {
      await this.cdnService.invalidateCache([key]);
    } catch (error) {
      this.logger.warn(`Failed to invalidate CDN cache for key: ${key}`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Invalidate CDN cache for multiple keys
   */
  private async invalidateCacheForKeys(keys: string[]): Promise<void> {
    try {
      await this.cdnService.invalidateCache(keys);
    } catch (error) {
      this.logger.warn(`Failed to invalidate CDN cache for keys: ${keys.join(', ')}`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Invalidate cache for user avatar and all its variants
   */
  async invalidateUserAvatar(userId: string): Promise<void> {
    try {
      await this.cdnService.invalidateUserAvatar(userId);
    } catch (error) {
      this.logger.warn(`Failed to invalidate user avatar cache for user: ${userId}`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Invalidate cache for event assets
   */
  async invalidateEventAssets(eventId: string): Promise<void> {
    try {
      await this.cdnService.invalidateEventAssets(eventId);
    } catch (error) {
      this.logger.warn(`Failed to invalidate event assets cache for event: ${eventId}`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Get health status including CDN configuration
   */
  async getHealthStatus(): Promise<{
    s3: { status: 'healthy' | 'unhealthy'; region: string; defaultBucket: string };
    cdn: { status: 'healthy' | 'degraded' | 'unhealthy'; configured: boolean; distributionId?: string; cdnUrl?: string };
  }> {
    const cdnHealth = await this.cdnService.healthCheck();
    
    return {
      s3: {
        status: 'healthy',
        region: this.config.region,
        defaultBucket: this.config.defaultBucket,
      },
      cdn: cdnHealth,
    };
  }

  private validateFile(file: StorageFile): void {
    if (!file || !file.buffer || file.size === 0) {
      throw new BadRequestException('Invalid file provided');
    }

    if (file.size > this.config.maxFileSize) {
      throw new BadRequestException(`File size exceeds maximum allowed size of ${this.config.maxFileSize} bytes`);
    }

    if (!this.config.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }
  }

  private generateKey(originalName: string, options: UploadOptions): string {
    const ext = path.extname(originalName);
    const baseName = options.filename || `${uuidv4()}${ext}`;
    const folder = options.folder || 'uploads';
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    return `${folder}/${timestamp}/${baseName}`;
  }

  private formatTags(tags: Record<string, string>): string {
    return Object.entries(tags)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }
} 