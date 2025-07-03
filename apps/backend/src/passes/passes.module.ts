import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PassesController } from './passes.controller';
import { PassGenerationService } from './services/pass-generation.service';
import { PdfPassService } from './services/pdf-pass.service';
import { AppleWalletService } from './services/apple-wallet.service';
import { GoogleWalletService } from './services/google-wallet.service';
import { Guest } from '../database/entities/guest.entity';
import { Event } from '../database/entities/event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Guest, Event]),
    AuthModule,
  ],
  controllers: [PassesController],
  providers: [
    PassGenerationService,
    PdfPassService,
    AppleWalletService,
    GoogleWalletService,
  ],
  exports: [
    PassGenerationService,
    PdfPassService,
    AppleWalletService,
    GoogleWalletService,
  ],
})
export class PassesModule {} 