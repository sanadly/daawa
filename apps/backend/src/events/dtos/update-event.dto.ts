import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus, PlatformPaymentStatus } from '../../database/entities/event.entity';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @ApiPropertyOptional({ description: 'Event status', enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({ description: 'Platform payment status', enum: PlatformPaymentStatus })
  @IsOptional()
  @IsEnum(PlatformPaymentStatus)
  platform_payment_status?: PlatformPaymentStatus;

  @ApiPropertyOptional({ description: 'Platform payment reference' })
  @IsOptional()
  platform_payment_reference?: string;

  @ApiPropertyOptional({ description: 'Platform payment date' })
  @IsOptional()
  platform_payment_date?: Date;
} 