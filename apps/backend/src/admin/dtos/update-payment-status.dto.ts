import { IsEnum } from 'class-validator';
import { PlatformPaymentStatus } from '../../database/entities/event.entity';

export class UpdatePaymentStatusDto {
  @IsEnum(PlatformPaymentStatus)
  payment_status: PlatformPaymentStatus;
} 