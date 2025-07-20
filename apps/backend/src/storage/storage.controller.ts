import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  Response,
  StreamableFile,
  Inject,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImageProcessingService } from './services/image-processing.service';
import { CdnService } from './services/cdn.service';
import { SecureUrlService, SecureUrlOptions } from './services/secure-url.service';
import {
  UploadFileDto,
  ImageProcessingDto,
  BulkUploadDto,
  PresignedUrlDto,
  DeleteFileDto,
  DeleteMultipleFilesDto,
  CopyFileDto,
  ListFilesDto,
  StorageBucket,
} from './dto/upload.dto';
import { IStorageService, StorageFile } from './interfaces/storage.interface';

@ApiTags('Storage')
@Controller('storage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StorageController {
  constructor(
    @Inject('IStorageService') private readonly storageService: IStorageService,
    private readonly imageProcessingService: ImageProcessingService,
    private readonly cdnService: CdnService,
    private readonly secureUrlService: SecureUrlService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or upload parameters' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadFileDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const storageFile: StorageFile = {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    };

    const result = await this.storageService.upload(storageFile, {
      bucket: uploadDto.bucket,
      folder: uploadDto.folder,
      filename: uploadDto.filename,
      metadata: uploadDto.metadata,
      tags: uploadDto.tags,
    });

    return {
      success: true,
      data: result,
      message: 'File uploaded successfully',
    };
  }

  @Post('upload/multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() uploadDto: UploadFileDto,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const storageFiles: StorageFile[] = files.map(file => ({
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    }));

    const results = await this.storageService.uploadMultiple(storageFiles, {
      bucket: uploadDto.bucket,
      folder: uploadDto.folder,
      metadata: uploadDto.metadata,
      tags: uploadDto.tags,
    });

    return {
      success: true,
      data: results,
      message: `${results.length} files uploaded successfully`,
    };
  }

  @Post('upload/image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload and process an image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Image uploaded and processed successfully' })
  async uploadAndProcessImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadFileDto,
    @Body() processingDto: ImageProcessingDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    const storageFile: StorageFile = {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    };

    const result = await this.imageProcessingService.processImage(
      storageFile,
      {
        width: processingDto.width,
        height: processingDto.height,
        quality: processingDto.quality,
        format: processingDto.format,
        fit: processingDto.fit,
        progressive: processingDto.progressive,
        blur: processingDto.blur,
        sharpen: processingDto.sharpen,
      },
      uploadDto.folder || 'images',
    );

    return {
      success: true,
      data: result,
      message: 'Image uploaded and processed successfully',
    };
  }

  @Get('download/:key(*)')
  @ApiOperation({ summary: 'Download a file' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  async downloadFile(
    @Param('key') key: string,
    @Query('bucket') bucket?: StorageBucket,
  ) {
    const fileBuffer = await this.storageService.download(key, bucket);
    
    return {
      success: true,
      data: {
        buffer: fileBuffer.toString('base64'),
        key,
        bucket: bucket || 'default',
      },
      message: 'File downloaded successfully',
    };
  }

  @Get('presigned-url')
  @ApiOperation({ summary: 'Generate a presigned URL for file access' })
  @ApiResponse({ status: 200, description: 'Presigned URL generated successfully' })
  async getPresignedUrl(@Query() presignedUrlDto: PresignedUrlDto) {
    const url = await this.storageService.getPresignedUrl(presignedUrlDto.key, {
      bucket: presignedUrlDto.bucket,
      expiresIn: presignedUrlDto.expiresIn,
      responseContentType: presignedUrlDto.responseContentType,
      responseContentDisposition: presignedUrlDto.responseContentDisposition,
    });

    return {
      success: true,
      data: {
        url,
        key: presignedUrlDto.key,
        expiresIn: presignedUrlDto.expiresIn || 3600,
      },
      message: 'Presigned URL generated successfully',
    };
  }

  @Get('public-url/:key(*)')
  @ApiOperation({ summary: 'Get public URL for a file' })
  @ApiResponse({ status: 200, description: 'Public URL retrieved successfully' })
  async getPublicUrl(
    @Param('key') key: string,
    @Query('bucket') bucket?: StorageBucket,
  ) {
    const url = this.storageService.getPublicUrl(key, bucket);

    return {
      success: true,
      data: {
        url,
        key,
        bucket: bucket || 'default',
      },
      message: 'Public URL retrieved successfully',
    };
  }

  @Get('cdn-url/:key(*)')
  @ApiOperation({ summary: 'Get CDN URL for a file' })
  @ApiResponse({ status: 200, description: 'CDN URL retrieved successfully' })
  async getCdnUrl(
    @Param('key') key: string,
    @Query('version') version?: string,
  ) {
    const url = version 
      ? this.storageService.getCacheOptimizedUrl(key, version)
      : this.cdnService.getCdnUrl(key);

    return {
      success: true,
      data: {
        url,
        key,
        version,
        cdnConfigured: this.cdnService.isCdnConfigured(),
      },
      message: 'CDN URL retrieved successfully',
    };
  }

  @Get('responsive-urls/:key(*)')
  @ApiOperation({ summary: 'Get responsive image URLs for different formats and sizes' })
  @ApiResponse({ status: 200, description: 'Responsive URLs retrieved successfully' })
  async getResponsiveUrls(@Param('key') key: string) {
    const urls = this.storageService.getResponsiveImageUrls(key);

    return {
      success: true,
      data: {
        ...urls,
        key,
        cdnConfigured: this.cdnService.isCdnConfigured(),
      },
      message: 'Responsive URLs retrieved successfully',
    };
  }

  @Post('invalidate-cache')
  @ApiOperation({ summary: 'Invalidate CDN cache for specific paths' })
  @ApiResponse({ status: 200, description: 'Cache invalidation initiated' })
  @HttpCode(HttpStatus.OK)
  async invalidateCache(@Body() body: { paths: string[] }) {
    if (!body.paths || body.paths.length === 0) {
      throw new BadRequestException('Paths array is required');
    }

    const invalidationId = await this.cdnService.invalidateCache(body.paths);

    return {
      success: true,
      data: {
        invalidationId,
        paths: body.paths,
        cdnConfigured: this.cdnService.isCdnConfigured(),
      },
      message: invalidationId 
        ? 'Cache invalidation initiated successfully'
        : 'CDN not configured, no cache invalidation performed',
    };
  }

  @Post('invalidate-user-avatar/:userId')
  @ApiOperation({ summary: 'Invalidate CDN cache for user avatar' })
  @ApiResponse({ status: 200, description: 'User avatar cache invalidation initiated' })
  @HttpCode(HttpStatus.OK)
  async invalidateUserAvatar(@Param('userId') userId: string) {
    const invalidationId = await this.cdnService.invalidateUserAvatar(userId);

    return {
      success: true,
      data: {
        invalidationId,
        userId,
        cdnConfigured: this.cdnService.isCdnConfigured(),
      },
      message: invalidationId 
        ? 'User avatar cache invalidation initiated successfully'
        : 'CDN not configured, no cache invalidation performed',
    };
  }

  @Get('list')
  @ApiOperation({ summary: 'List files in storage' })
  @ApiResponse({ status: 200, description: 'Files listed successfully' })
  async listFiles(@Query() listFilesDto: ListFilesDto) {
    const files = await this.storageService.listFiles(
      listFilesDto.prefix,
      listFilesDto.bucket,
    );

    return {
      success: true,
      data: {
        files: files.slice(0, listFilesDto.limit || 100),
        total: files.length,
        prefix: listFilesDto.prefix,
        bucket: listFilesDto.bucket,
      },
      message: 'Files listed successfully',
    };
  }

  @Get('exists/:key(*)')
  @ApiOperation({ summary: 'Check if a file exists' })
  @ApiResponse({ status: 200, description: 'File existence checked successfully' })
  async checkFileExists(
    @Param('key') key: string,
    @Query('bucket') bucket?: StorageBucket,
  ) {
    const exists = await this.storageService.exists(key, bucket);

    return {
      success: true,
      data: {
        exists,
        key,
        bucket: bucket || 'default',
      },
      message: 'File existence checked successfully',
    };
  }

  @Post('copy')
  @ApiOperation({ summary: 'Copy a file to a new location' })
  @ApiResponse({ status: 200, description: 'File copied successfully' })
  @HttpCode(HttpStatus.OK)
  async copyFile(@Body() copyFileDto: CopyFileDto) {
    await this.storageService.copyFile(
      copyFileDto.sourceKey,
      copyFileDto.destinationKey,
      copyFileDto.sourceBucket,
      copyFileDto.destinationBucket,
    );

    return {
      success: true,
      data: {
        sourceKey: copyFileDto.sourceKey,
        destinationKey: copyFileDto.destinationKey,
        sourceBucket: copyFileDto.sourceBucket,
        destinationBucket: copyFileDto.destinationBucket,
      },
      message: 'File copied successfully',
    };
  }

  @Post('move')
  @ApiOperation({ summary: 'Move a file to a new location' })
  @ApiResponse({ status: 200, description: 'File moved successfully' })
  @HttpCode(HttpStatus.OK)
  async moveFile(@Body() moveFileDto: CopyFileDto) {
    await this.storageService.moveFile(
      moveFileDto.sourceKey,
      moveFileDto.destinationKey,
      moveFileDto.sourceBucket,
      moveFileDto.destinationBucket,
    );

    return {
      success: true,
      data: {
        sourceKey: moveFileDto.sourceKey,
        destinationKey: moveFileDto.destinationKey,
        sourceBucket: moveFileDto.sourceBucket,
        destinationBucket: moveFileDto.destinationBucket,
      },
      message: 'File moved successfully',
    };
  }

  @Delete('file/:key(*)')
  @ApiOperation({ summary: 'Delete a single file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @HttpCode(HttpStatus.OK)
  async deleteFile(
    @Param('key') key: string,
    @Query('bucket') bucket?: StorageBucket,
  ) {
    await this.storageService.delete(key, bucket);

    return {
      success: true,
      data: {
        key,
        bucket: bucket || 'default',
      },
      message: 'File deleted successfully',
    };
  }

  @Delete('files')
  @ApiOperation({ summary: 'Delete multiple files' })
  @ApiResponse({ status: 200, description: 'Files deleted successfully' })
  @HttpCode(HttpStatus.OK)
  async deleteMultipleFiles(@Body() deleteFilesDto: DeleteMultipleFilesDto) {
    await this.storageService.deleteMultiple(
      deleteFilesDto.keys,
      deleteFilesDto.bucket,
    );

    return {
      success: true,
      data: {
        keys: deleteFilesDto.keys,
        bucket: deleteFilesDto.bucket,
        count: deleteFilesDto.keys.length,
      },
      message: `${deleteFilesDto.keys.length} files deleted successfully`,
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check storage service health' })
  @ApiResponse({ status: 200, description: 'Storage service health status' })
  async healthCheck() {
    try {
      const healthStatus = await this.storageService.getHealthStatus();
      
      return {
        success: true,
        data: {
          ...healthStatus,
          timestamp: new Date().toISOString(),
        },
        message: 'Storage service health check completed',
      };
    } catch (error) {
      return {
        success: false,
        data: {
          s3: { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' },
          cdn: { status: 'unknown', configured: false },
          timestamp: new Date().toISOString(),
        },
        message: 'Storage service health check failed',
      };
    }
  }

  // Secure URL Endpoints

  @Post('secure-url/generate')
  @ApiOperation({ summary: 'Generate a secure, time-limited URL for file access' })
  @ApiResponse({ status: 201, description: 'Secure URL generated successfully' })
  async generateSecureUrl(
    @Request() req,
    @Body() body: {
      key: string;
      expiresIn?: number;
      resourceType?: 'avatar' | 'event-asset' | 'pass-asset' | 'general';
      permissions?: string[];
      maxDownloads?: number;
      ipWhitelist?: string[];
    },
  ) {
    const options: SecureUrlOptions = {
      expiresIn: body.expiresIn,
      userId: req.user.id,
      resourceType: body.resourceType,
      permissions: body.permissions,
      maxDownloads: body.maxDownloads,
      ipWhitelist: body.ipWhitelist,
    };

    const result = await this.secureUrlService.generateSecureUrl(body.key, options);

    return {
      success: true,
      data: result,
      message: 'Secure URL generated successfully',
    };
  }

  @Post('secure-url/generate-responsive')
  @ApiOperation({ summary: 'Generate secure URLs for responsive images' })
  @ApiResponse({ status: 201, description: 'Secure responsive URLs generated successfully' })
  async generateSecureResponsiveUrls(
    @Request() req,
    @Body() body: {
      baseKey: string;
      expiresIn?: number;
      resourceType?: 'avatar' | 'event-asset' | 'pass-asset' | 'general';
      permissions?: string[];
      maxDownloads?: number;
      ipWhitelist?: string[];
    },
  ) {
    const options: SecureUrlOptions = {
      expiresIn: body.expiresIn,
      userId: req.user.id,
      resourceType: body.resourceType,
      permissions: body.permissions,
      maxDownloads: body.maxDownloads,
      ipWhitelist: body.ipWhitelist,
    };

    const result = await this.secureUrlService.generateSecureResponsiveUrls(body.baseKey, options);

    return {
      success: true,
      data: result,
      message: 'Secure responsive URLs generated successfully',
    };
  }

  @Post('secure-url/presigned')
  @ApiOperation({ summary: 'Generate secure presigned URL' })
  @ApiResponse({ status: 201, description: 'Secure presigned URL generated successfully' })
  async generateSecurePresignedUrl(
    @Request() req,
    @Body() body: {
      key: string;
      expiresIn?: number;
      resourceType?: 'avatar' | 'event-asset' | 'pass-asset' | 'general';
      permissions?: string[];
      maxDownloads?: number;
      ipWhitelist?: string[];
    },
  ) {
    const options: SecureUrlOptions = {
      expiresIn: body.expiresIn,
      userId: req.user.id,
      resourceType: body.resourceType,
      permissions: body.permissions,
      maxDownloads: body.maxDownloads,
      ipWhitelist: body.ipWhitelist,
    };

    const result = await this.secureUrlService.generateSecurePresignedUrl(body.key, options);

    return {
      success: true,
      data: result,
      message: 'Secure presigned URL generated successfully',
    };
  }

  @Post('secure-url/revoke')
  @ApiOperation({ summary: 'Revoke a secure URL token' })
  @ApiResponse({ status: 200, description: 'Secure URL token revoked successfully' })
  @HttpCode(HttpStatus.OK)
  async revokeSecureToken(@Body() body: { token: string }) {
    await this.secureUrlService.revokeSecureToken(body.token);

    return {
      success: true,
      data: {
        token: body.token,
        revokedAt: new Date().toISOString(),
      },
      message: 'Secure URL token revoked successfully',
    };
  }

  @Get('secure-url/stats')
  @ApiOperation({ summary: 'Get secure URL usage statistics' })
  @ApiResponse({ status: 200, description: 'Secure URL statistics retrieved successfully' })
  async getSecureUrlStats(@Request() req) {
    const stats = await this.secureUrlService.getSecureUrlStats(req.user.id);

    return {
      success: true,
      data: stats,
      message: 'Secure URL statistics retrieved successfully',
    };
  }
} 