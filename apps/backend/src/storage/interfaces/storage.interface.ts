export interface StorageFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  etag?: string;
  size: number;
  contentType: string;
  lastModified?: Date;
}

export interface UploadOptions {
  bucket?: string;
  folder?: string;
  filename?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  acl?: 'private' | 'public-read' | 'public-read-write';
}

export interface PresignedUrlOptions {
  bucket?: string;
  expiresIn?: number; // seconds
  responseContentType?: string;
  responseContentDisposition?: string;
}

export interface StorageConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  defaultBucket: string;
  buckets: {
    userUploads: string;
    processedImages: string;
    eventAssets: string;
    passAssets: string;
  };
  cdnUrl?: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
}

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  background?: { r: number; g: number; b: number; alpha: number };
  progressive?: boolean;
  blur?: number;
  sharpen?: boolean;
}

export interface ProcessedImageResult {
  original: UploadResult;
  processed: UploadResult[];
  formats: {
    webp?: UploadResult;
    jpeg?: UploadResult;
    png?: UploadResult;
  };
  thumbnails: {
    small?: UploadResult;
    medium?: UploadResult;
    large?: UploadResult;
  };
}

export interface IStorageService {
  upload(file: StorageFile, options?: UploadOptions): Promise<UploadResult>;
  uploadMultiple(files: StorageFile[], options?: UploadOptions): Promise<UploadResult[]>;
  download(key: string, bucket?: string): Promise<Buffer>;
  delete(key: string, bucket?: string): Promise<void>;
  deleteMultiple(keys: string[], bucket?: string): Promise<void>;
  exists(key: string, bucket?: string): Promise<boolean>;
  getPresignedUrl(key: string, options?: PresignedUrlOptions): Promise<string>;
  getPublicUrl(key: string, bucket?: string): string;
  listFiles(prefix?: string, bucket?: string): Promise<string[]>;
  copyFile(sourceKey: string, destinationKey: string, sourceBucket?: string, destinationBucket?: string): Promise<void>;
  moveFile(sourceKey: string, destinationKey: string, sourceBucket?: string, destinationBucket?: string): Promise<void>;
  getCacheOptimizedUrl?(key: string, version?: string): string;
  getResponsiveImageUrls?(baseKey: string): {
    original?: string;
    webp?: string;
    jpeg?: string;
    thumbnails: {
      small?: string;
      medium?: string;
      large?: string;
    };
  };
  getHealthStatus?(): Promise<any>;
  invalidateUserAvatar?(userId: string): Promise<void>;
}

export interface ProcessedImageResult {
  original: UploadResult;
  processed: UploadResult[];
  formats: {
    webp?: UploadResult;
    jpeg?: UploadResult;
    png?: UploadResult;
  };
  thumbnails: {
    small?: UploadResult;
    medium?: UploadResult;
    large?: UploadResult;
  };
}