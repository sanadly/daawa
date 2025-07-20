import { IsString, IsOptional, IsEnum, IsInt, Min, IsBoolean, IsNumber, IsDateString, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TierType } from '../../database/entities/tier.entity';

class TierSettingsDto {
  @IsOptional()
  @IsString({ each: true })
  benefits?: string[];

  @IsOptional()
  @IsString({ each: true })
  restrictions?: string[];

  @IsOptional()
  @IsBoolean()
  includes_meal?: boolean;

  @IsOptional()
  @IsBoolean()
  includes_merchandise?: boolean;

  @IsOptional()
  @IsBoolean()
  parking_included?: boolean;

  @IsOptional()
  @IsBoolean()
  early_access?: boolean;

  @IsOptional()
  @IsBoolean()
  special_seating?: boolean;

  @IsOptional()
  @IsBoolean()
  meet_and_greet?: boolean;
}

class AccessConfigDto {
  @IsOptional()
  @IsBoolean()
  requires_approval?: boolean;

  @IsOptional()
  @IsBoolean()
  invite_only?: boolean;

  @IsOptional()
  @IsString({ each: true })
  access_codes?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  min_age?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  max_age?: number;

  @IsOptional()
  @IsString({ each: true })
  allowed_domains?: string[];
}

export class CreateTierDto {
  @ApiProperty({ description: 'Tier name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Tier description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Tier type', enum: TierType })
  @IsOptional()
  @IsEnum(TierType)
  tier_type?: TierType;

  @ApiPropertyOptional({ description: 'Tier price', default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'LYD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Guest limit (null for unlimited)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  guest_limit?: number;

  @ApiPropertyOptional({ description: 'Maximum plus ones allowed', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_plus_n?: number;

  @ApiPropertyOptional({ description: 'Is tier active', default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'When sales start for this tier' })
  @IsOptional()
  @IsDateString()
  sale_starts_at?: string;

  @ApiPropertyOptional({ description: 'When sales end for this tier' })
  @IsOptional()
  @IsDateString()
  sale_ends_at?: string;

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;

  @ApiPropertyOptional({ description: 'Tier-specific settings' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TierSettingsDto)
  tier_settings?: TierSettingsDto;

  @ApiPropertyOptional({ description: 'Access control configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AccessConfigDto)
  access_config?: AccessConfigDto;
} 