import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guest } from '../database/entities/guest.entity';
import { Event } from '../database/entities/event.entity';
import { Tier } from '../database/entities/tier.entity';
import { User } from '../database/entities/user.entity';
import { GuestsController } from './guests.controller';
import { GuestsService } from './guests.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PassesModule } from '../passes/passes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Guest, Event, Tier, User]),
    NotificationsModule,
    PassesModule,
  ],
  controllers: [GuestsController],
  providers: [GuestsService],
  exports: [GuestsService],
})
export class GuestsModule {} 