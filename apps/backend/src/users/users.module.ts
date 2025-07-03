import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { UserActivity } from '../database/entities/user-activity.entity';
import { PasswordHistory } from '../database/entities/password-history.entity';
import { UsersService } from './services/users.service';
import { PasswordService } from '../auth/services/password.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserActivity, PasswordHistory])],
  providers: [UsersService, PasswordService],
  exports: [UsersService],
})
export class UsersModule {} 