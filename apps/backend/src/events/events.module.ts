import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

import { PostActivationHooksService } from './post-activation-hooks.service';
import { Event } from '../database/entities/event.entity';
import { Tier } from '../database/entities/tier.entity';
import { User } from '../database/entities/user.entity';
import { Guest } from '../database/entities/guest.entity';
import { UserActivity } from '../database/entities/user-activity.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, Tier, User, Guest, UserActivity]),
    NotificationsModule,
  ],
  controllers: [EventsController],
  providers: [EventsService, PostActivationHooksService],
  exports: [EventsService],
})
export class EventsModule {} 