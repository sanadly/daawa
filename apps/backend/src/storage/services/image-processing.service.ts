import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import { StorageFile, UploadResult, ImageProcessingOptions, ProcessedImageResult } from '../interfaces/storage.interface';
import { AwsS3Service } from './aws-s3.service';

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  constructor(private readonly storageService: AwsS3Service) {}

  async processImage(
    file: StorageFile,
    options: ImageProcessingOptions = {},
    uploadFolder = 'processed'
  ): Promise<ProcessedImageResult> {
    try {
      if (!this.isImageFile(file.mimetype)) {
        throw new BadRequestException('File is not a valid image');
      }

      const originalUpload = await this.storageService.upload(file, {
        folder: `${uploadFolder}/original`,
        bucket: 'daawa-processed-images',
      });

      // Generate different formats
      const formats = await this.generateFormats(file, uploadFolder, options);
      
      // Generate thumbnails
      const thumbnails = await this.generateThumbnails(file, uploadFolder, options);

      // Process main image if options provided
      const processed = [];
      if (this.hasProcessingOptions(options)) {
        const processedImage = await this.applyProcessing(file, options);
        const processedUpload = await this.storageService.upload(
          {
            ...file,
            buffer: processedImage,
            originalname: this.addSuffixToFilename(file.originalname, 'processed'),
          },
          {
            folder: `${uploadFolder}/processed`,
            bucket: 'daawa-processed-images',
          }
        );
        processed.push(processedUpload);
      }

      return {
        original: originalUpload,
        processed,
        formats,
        thumbnails,
      };
    } catch (error) {
      this.logger.error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async generateFormats(
    file: StorageFile,
    uploadFolder: string,
    options: ImageProcessingOptions = {}
  ): Promise<{ webp?: UploadResult; jpeg?: UploadResult; png?: UploadResult }> {
    const formats: { webp?: UploadResult; jpeg?: UploadResult; png?: UploadResult } = {};

    try {
      // Generate WebP (modern format)
      const webpBuffer = await sharp(file.buffer)
        .webp({ quality: options.quality || 85 })
        .toBuffer();

      formats.webp = await this.storageService.upload(
        {
          ...file,
          buffer: webpBuffer,
          mimetype: 'image/webp',
          originalname: this.changeFileExtension(file.originalname, 'webp'),
        },
        {
          folder: `${uploadFolder}/webp`,
          bucket: 'daawa-processed-images',
        }
      );

      // Generate JPEG (fallback)
      const jpegBuffer = await sharp(file.buffer)
        .jpeg({ quality: options.quality || 85, progressive: options.progressive })
        .toBuffer();

      formats.jpeg = await this.storageService.upload(
        {
          ...file,
          buffer: jpegBuffer,
          mimetype: 'image/jpeg',
          originalname: this.changeFileExtension(file.originalname, 'jpg'),
        },
        {
          folder: `${uploadFolder}/jpeg`,
          bucket: 'daawa-processed-images',
        }
      );

      // Generate PNG (if original is PNG or transparency needed)
      if (file.mimetype === 'image/png' || options.format === 'png') {
        const pngBuffer = await sharp(file.buffer)
          .png({ progressive: options.progressive })
          .toBuffer();

        formats.png = await this.storageService.upload(
          {
            ...file,
            buffer: pngBuffer,
            mimetype: 'image/png',
            originalname: this.changeFileExtension(file.originalname, 'png'),
          },
          {
            folder: `${uploadFolder}/png`,
            bucket: 'daawa-processed-images',
          }
        );
      }

      return formats;
    } catch (error) {
      this.logger.error(`Failed to generate image formats: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async generateThumbnails(
    file: StorageFile,
    uploadFolder: string,
    options: ImageProcessingOptions = {}
  ): Promise<{ small?: UploadResult; medium?: UploadResult; large?: UploadResult }> {
    const thumbnails: { small?: UploadResult; medium?: UploadResult; large?: UploadResult } = {};

    const thumbnailSizes = [
      { name: 'small', width: 150, height: 150 },
      { name: 'medium', width: 300, height: 300 },
      { name: 'large', width: 600, height: 600 },
    ];

    try {
      for (const size of thumbnailSizes) {
        const thumbnailBuffer = await sharp(file.buffer)
          .resize(size.width, size.height, {
            fit: 'cover',
            position: 'center',
          })
          .webp({ quality: options.quality || 80 })
          .toBuffer();

        const thumbnailUpload = await this.storageService.upload(
          {
            ...file,
            buffer: thumbnailBuffer,
            mimetype: 'image/webp',
            originalname: this.addSuffixToFilename(
              this.changeFileExtension(file.originalname, 'webp'),
              size.name
            ),
          },
          {
            folder: `${uploadFolder}/thumbnails`,
            bucket: 'daawa-processed-images',
          }
        );

        thumbnails[size.name as keyof typeof thumbnails] = thumbnailUpload;
      }

      return thumbnails;
    } catch (error) {
      this.logger.error(`Failed to generate thumbnails: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async applyProcessing(file: StorageFile, options: ImageProcessingOptions): Promise<Buffer> {
    try {
      let pipeline = sharp(file.buffer);

      // Apply resize if specified
      if (options.width || options.height) {
        pipeline = pipeline.resize(options.width, options.height, {
          fit: options.fit || 'cover',
          background: options.background || { r: 255, g: 255, b: 255, alpha: 1 },
        });
      }

      // Apply blur if specified
      if (options.blur && options.blur > 0) {
        pipeline = pipeline.blur(options.blur);
      }

      // Apply sharpen if specified
      if (options.sharpen) {
        pipeline = pipeline.sharpen();
      }

      // Convert to specified format
      switch (options.format) {
        case 'webp':
          pipeline = pipeline.webp({
            quality: options.quality || 85,
          });
          break;
        case 'jpeg':
          pipeline = pipeline.jpeg({
            quality: options.quality || 85,
            progressive: options.progressive,
          });
          break;
        case 'png':
          pipeline = pipeline.png({
            progressive: options.progressive,
          });
          break;
      }

      return await pipeline.toBuffer();
    } catch (error) {
      this.logger.error(`Failed to apply image processing: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async optimizeImage(file: StorageFile, quality = 85): Promise<Buffer> {
    try {
      const metadata = await sharp(file.buffer).metadata();
      
      let pipeline = sharp(file.buffer);

      // Auto-orient the image
      pipeline = pipeline.rotate();

      // Apply optimization based on format
      switch (metadata.format) {
        case 'jpeg':
          return await pipeline
            .jpeg({ quality, progressive: true, mozjpeg: true })
            .toBuffer();
        case 'png':
          return await pipeline
            .png({ progressive: true, compressionLevel: 9 })
            .toBuffer();
                 case 'webp':
           return await pipeline
             .webp({ quality })
             .toBuffer();
        default:
          // Convert to JPEG for other formats
          return await pipeline
            .jpeg({ quality, progressive: true })
            .toBuffer();
      }
    } catch (error) {
      this.logger.error(`Failed to optimize image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async getImageMetadata(buffer: Buffer): Promise<sharp.Metadata> {
    try {
      return await sharp(buffer).metadata();
    } catch (error) {
      this.logger.error(`Failed to get image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private isImageFile(mimetype: string): boolean {
    const allowedImageTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/bmp',
      'image/tiff',
    ];
    return allowedImageTypes.includes(mimetype);
  }

  private hasProcessingOptions(options: ImageProcessingOptions): boolean {
    return !!(
      options.width ||
      options.height ||
      options.quality ||
      options.format ||
      options.blur ||
      options.sharpen ||
      options.background
    );
  }

  private changeFileExtension(filename: string, newExtension: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return `${filename}.${newExtension}`;
    }
    return `${filename.substring(0, lastDotIndex)}.${newExtension}`;
  }

  private addSuffixToFilename(filename: string, suffix: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return `${filename}-${suffix}`;
    }
    const name = filename.substring(0, lastDotIndex);
    const extension = filename.substring(lastDotIndex);
    return `${name}-${suffix}${extension}`;
  }
} 