import { IsOptional, IsString, IsNumber, IsEnum, IsObject, IsArray, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StorageBucket {
  USER_UPLOADS = 'user-uploads',
  PROCESSED_IMAGES = 'processed-images',
  EVENT_ASSETS = 'event-assets',
  PASS_ASSETS = 'pass-assets',
}

export enum ImageFormat {
  WEBP = 'webp',
  JPEG = 'jpeg',
  PNG = 'png',
}

export enum ImageFit {
  COVER = 'cover',
  CONTAIN = 'contain',
  FILL = 'fill',
  INSIDE = 'inside',
  OUTSIDE = 'outside',
}

export class UploadFileDto {
  @ApiPropertyOptional({ enum: StorageBucket })
  @IsOptional()
  @IsEnum(StorageBucket)
  bucket?: StorageBucket;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  tags?: Record<string, string>;
}

export class ImageProcessingDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 4000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4000)
  width?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 4000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4000)
  height?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  quality?: number;

  @ApiPropertyOptional({ enum: ImageFormat })
  @IsOptional()
  @IsEnum(ImageFormat)
  format?: ImageFormat;

  @ApiPropertyOptional({ enum: ImageFit })
  @IsOptional()
  @IsEnum(ImageFit)
  fit?: ImageFit;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  background?: string;

  @ApiPropertyOptional()
  @IsOptional()
  progressive?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  blur?: number;

  @ApiPropertyOptional()
  @IsOptional()
  sharpen?: boolean;
}

export class BulkUploadDto {
  @ApiProperty({ type: [UploadFileDto] })
  @IsArray()
  files: UploadFileDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commonFolder?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  commonMetadata?: Record<string, string>;
}

export class PresignedUrlDto {
  @ApiProperty()
  @IsString()
  key: string;

  @ApiPropertyOptional({ enum: StorageBucket })
  @IsOptional()
  @IsEnum(StorageBucket)
  bucket?: StorageBucket;

  @ApiPropertyOptional({ minimum: 60, maximum: 604800 }) // 1 minute to 7 days
  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(604800)
  expiresIn?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responseContentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responseContentDisposition?: string;
}

export class DeleteFileDto {
  @ApiProperty()
  @IsString()
  key: string;

  @ApiPropertyOptional({ enum: StorageBucket })
  @IsOptional()
  @IsEnum(StorageBucket)
  bucket?: StorageBucket;
}

export class DeleteMultipleFilesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  keys: string[];

  @ApiPropertyOptional({ enum: StorageBucket })
  @IsOptional()
  @IsEnum(StorageBucket)
  bucket?: StorageBucket;
}

export class CopyFileDto {
  @ApiProperty()
  @IsString()
  sourceKey: string;

  @ApiProperty()
  @IsString()
  destinationKey: string;

  @ApiPropertyOptional({ enum: StorageBucket })
  @IsOptional()
  @IsEnum(StorageBucket)
  sourceBucket?: StorageBucket;

  @ApiPropertyOptional({ enum: StorageBucket })
  @IsOptional()
  @IsEnum(StorageBucket)
  destinationBucket?: StorageBucket;
}

export class ListFilesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prefix?: string;

  @ApiPropertyOptional({ enum: StorageBucket })
  @IsOptional()
  @IsEnum(StorageBucket)
  bucket?: StorageBucket;

  @ApiPropertyOptional({ minimum: 1, maximum: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number;
} 