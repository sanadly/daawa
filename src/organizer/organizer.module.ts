import { Module } from '@nestjs/common';
import { OrganizerController } from './organizer.controller';
import { PermissionsService } from '../common/services/permissions.service';

@Module({
  controllers: [OrganizerController],
  providers: [PermissionsService],
  exports: []
})
export class OrganizerModule {} 