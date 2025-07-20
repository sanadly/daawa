import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckinRecord } from '../database/entities/checkin-record.entity';
import { Guest } from '../database/entities/guest.entity';
import { Event } from '../database/entities/event.entity';
import { User } from '../database/entities/user.entity';
import { CheckinService } from './services/checkin.service';
import { QrCodeService } from './services/qr-code.service';
import { CheckinController } from './checkin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CheckinRecord,
      Guest,
      Event,
      User,
    ]),
  ],
  controllers: [CheckinController], // Re-enabled CheckinController
  providers: [CheckinService, QrCodeService],
  exports: [CheckinService, QrCodeService],
})
export class CheckinModule {} 