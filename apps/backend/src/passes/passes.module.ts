import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PassesController } from './passes.controller';
import { PassRetrievalController } from './pass-retrieval.controller';
import { PassRendererController } from './pass-renderer.controller';
import { PassesService } from './passes.service';
import { PassGenerationService } from './services/pass-generation.service';
import { PdfPassService } from './services/pdf-pass.service';
import { AppleWalletService } from './services/apple-wallet.service';
import { GoogleWalletService } from './services/google-wallet.service';
import { PassTemplateService } from './services/pass-template.service';
import { Guest } from '../database/entities/guest.entity';
import { Event } from '../database/entities/event.entity';
import { Tier } from '../database/entities/tier.entity';
import { Pass } from '../database/entities/pass.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdvancedPassRendererService } from './services/advanced-pass-renderer.service';
import { ConfigModule } from '@nestjs/config';
import { SimpleTestRendererService } from './services/simple-test-renderer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pass, Event, Guest, Tier]),
    ConfigModule,
    AuthModule,
    NotificationsModule,
  ],
  controllers: [PassesController, PassRetrievalController, PassRendererController],
  providers: [
    PassesService,
    PassGenerationService,
    PassTemplateService,
    PdfPassService,
    AppleWalletService,
    GoogleWalletService,
    AdvancedPassRendererService,
    SimpleTestRendererService,
  ],
  exports: [
    PassesService,
    PassGenerationService,
    PassTemplateService,
    PdfPassService,
    AppleWalletService,
    GoogleWalletService,
    AdvancedPassRendererService,
    SimpleTestRendererService,
  ],
})
export class PassesModule {} 