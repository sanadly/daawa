import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { PermissionsService } from '../common/services/permissions.service';

@Module({
  controllers: [StaffController],
  providers: [PermissionsService],
  exports: []
})
export class StaffModule {} 