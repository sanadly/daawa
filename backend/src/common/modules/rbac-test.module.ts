import { Module } from '@nestjs/common';
import { RbacTestController } from '../controllers/rbac-test.controller';
import { PermissionsService } from '../services/permissions.service';

@Module({
  controllers: [RbacTestController],
  providers: [PermissionsService],
})
export class RbacTestModule {} 