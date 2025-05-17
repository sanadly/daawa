import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm'; // Removed
// import { User } from './entities/user.entity'; // Removed, Prisma User is used internally by service
import { UsersService } from './users.service';
// PrismaModule is global, so PrismaService is available

@Module({
  imports: [], // TypeOrmModule.forFeature([User]) removed
  providers: [UsersService],
  exports: [UsersService], // Export UsersService so AuthModule can use it
})
export class UsersModule {} 