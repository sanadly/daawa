import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { IStorageService, StorageFile, UploadOptions, UploadResult, PresignedUrlOptions } from '../interfaces/storage.interface';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly uploadPath: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadPath = this.configService.get<string>('storage.local.path', 'uploads');
    // Temporarily hardcode for testing
    this.baseUrl = 'http://localhost:3001';
    console.log('LocalStorageService - Backend URL (hardcoded):', this.baseUrl);
    fs.ensureDirSync(this.uploadPath);
    this.logger.log(`LocalStorage upload path: ${path.resolve(this.uploadPath)}`);
  }

  async upload(file: StorageFile, options?: UploadOptions): Promise<UploadResult> {
    const folder = options?.folder || 'default';
    const finalFolder = path.join(this.uploadPath, folder);
    await fs.ensureDir(finalFolder);
    
    const filename = options?.filename || `${randomBytes(16).toString('hex')}${path.extname(file.originalname)}`;
    const filePath = path.join(finalFolder, filename);

    try {
      await fs.writeFile(filePath, file.buffer);
      const url = `${this.baseUrl}/uploads/${folder}/${filename}`;
      const result: UploadResult = {
        key: `${folder}/${filename}`,
        url,
        bucket: 'local',
        size: file.size,
        contentType: file.mimetype,
      };
      this.logger.log(`File uploaded to ${filePath}, accessible at ${url}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to write file to ${filePath}`, (error as Error).stack);
      throw new InternalServerErrorException('Failed to save file locally');
    }
  }

  getPublicUrl(key: string): string {
    return `${this.baseUrl}/uploads/${key}`;
  }

  // ... Implement other methods or throw NotImplementedException ...
  async uploadMultiple(files: StorageFile[], options?: UploadOptions): Promise<UploadResult[]> {
    return Promise.all(files.map(file => this.upload(file, options)));
  }

  async download(key: string): Promise<Buffer> {
    const filePath = path.join(this.uploadPath, key);
    if (!await fs.pathExists(filePath)) {
      throw new NotFoundException(`File not found at key: ${key}`);
    }
    return fs.readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadPath, key);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      this.logger.log(`Deleted file at ${filePath}`);
    }
  }

  async deleteMultiple(keys: string[]): Promise<void> {
    await Promise.all(keys.map(key => this.delete(key)));
  }

  async exists(key: string): Promise<boolean> {
    const filePath = path.join(this.uploadPath, key);
    return fs.pathExists(filePath);
  }

  async getPresignedUrl(key: string, options?: PresignedUrlOptions): Promise<string> {
    this.logger.warn('getPresignedUrl is not applicable for LocalStorageService, returning public URL.');
    return this.getPublicUrl(key);
  }
  
  async listFiles(prefix?: string): Promise<string[]> {
    const dir = path.join(this.uploadPath, prefix || '');
    if (!await fs.pathExists(dir)) {
      return [];
    }
    const files = await fs.readdir(dir);
    return files.map(file => path.join(prefix || '', file));
  }

  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    const sourcePath = path.join(this.uploadPath, sourceKey);
    const destPath = path.join(this.uploadPath, destinationKey);
    if (!await fs.pathExists(sourcePath)) {
      throw new NotFoundException(`Source file not found at key: ${sourceKey}`);
    }
    await fs.copy(sourcePath, destPath);
  }

  async moveFile(sourceKey: string, destinationKey: string): Promise<void> {
    await this.copyFile(sourceKey, destinationKey);
    await this.delete(sourceKey);
  }

  getCacheOptimizedUrl(key: string, version?: string): string {
    this.logger.warn('getCacheOptimizedUrl is not applicable for LocalStorageService, returning public URL.');
    const url = this.getPublicUrl(key);
    return version ? `${url}?v=${version}` : url;
  }

  getResponsiveImageUrls(baseKey: string): { original?: string; webp?: string; jpeg?: string; thumbnails: { small?: string; medium?: string; large?: string; }; } {
    this.logger.warn('getResponsiveImageUrls is not applicable for LocalStorageService, returning basic public URL.');
    return {
      original: this.getPublicUrl(baseKey),
      webp: undefined,
      jpeg: undefined,
      thumbnails: {
        small: undefined,
        medium: undefined,
        large: undefined,
      },
    };
  }

  async getHealthStatus(): Promise<any> {
    return Promise.resolve({
      local: {
        status: 'healthy',
        path: this.uploadPath,
      },
    });
  }

  async invalidateUserAvatar(userId: string): Promise<void> {
    this.logger.log(`Skipping avatar invalidation for user ${userId} in local storage mode.`);
    return Promise.resolve();
  }
} 