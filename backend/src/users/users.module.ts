import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm'; // Removed
// import { User } from './entities/user.entity'; // Removed, Prisma User is used internally by service
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersController } from './users.controller';
// PrismaModule is global, so PrismaService is available

@Module({
  imports: [PrismaModule],
  providers: [UsersService],
  exports: [UsersService], // Export UsersService so AuthModule can use it
  controllers: [UsersController],
})
export class UsersModule {} 