import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { User } from '../database/entities/user.entity';
import { UserActivity } from '../database/entities/user-activity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserActivity])],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {} 