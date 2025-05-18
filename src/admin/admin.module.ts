import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PermissionsService } from '../common/services/permissions.service';

@Module({
  controllers: [AdminController],
  providers: [PermissionsService],
  exports: []
})
export class AdminModule {} 