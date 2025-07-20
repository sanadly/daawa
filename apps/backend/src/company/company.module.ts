import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Event, Guest } from '../database/entities';
import { CompanyController, CompanyPublicController } from './company.controller';
import { CompanyService } from './company.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Event, Guest]),
    AuthModule,
  ],
  controllers: [CompanyController, CompanyPublicController],
  providers: [CompanyService],
})
export class CompanyModule {} 