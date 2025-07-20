import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTemplateService } from './services/email-template.service';
import { EmailInvitationService } from './services/email-invitation.service';
import { EmailInvitationController } from './controllers/email-invitation.controller';
import { Guest } from '../database/entities/guest.entity';
import { Event } from '../database/entities/event.entity';
import { Tier } from '../database/entities/tier.entity';
import { NotificationService } from '../notifications/notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Guest, Event, Tier]),
  ],
  providers: [
    EmailTemplateService,
    EmailInvitationService,
    NotificationService,
  ],
  controllers: [EmailInvitationController],
  exports: [
    EmailTemplateService,
    EmailInvitationService,
  ],
})
export class EmailModule {} 