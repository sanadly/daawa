import { IsString, IsOptional, IsInt, IsDecimal, IsBoolean, Min, Max, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateTierDto {
  @ApiProperty({ description: 'Tier name', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Tier description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Guest limit for this tier' })
  @IsOptional()
  @IsInt()
  @Min(1)
  guest_limit?: number;

  @ApiPropertyOptional({ description: 'Price for this tier', default: 0.00 })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Maximum plus N allowed for this tier', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_plus_n?: number;

  @ApiPropertyOptional({ description: 'Whether this tier is active', default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
} 