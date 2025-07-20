import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';
import { AwsS3Service } from './services/aws-s3.service';
import { ImageProcessingService } from './services/image-processing.service';
import { CdnService } from './services/cdn.service';
import { SecureUrlService } from './services/secure-url.service';
import { StorageController } from './storage.controller';
import { SecureAccessController } from './secure-access.controller';
import { LocalStorageService } from './services/local-storage.service';
import { IStorageService } from './interfaces/storage.interface';

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      // This will be overridden by the SecureUrlService with its own secret
      secret: 'temp-secret',
      signOptions: { expiresIn: '1h' },
    }),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        limits: {
          fileSize: configService.get<number>('storage.maxFileSize', 10 * 1024 * 1024),
        },
        fileFilter: (req, file, callback) => {
          callback(null, true);
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [StorageController, SecureAccessController],
  providers: [
    CdnService,
    ImageProcessingService,
    SecureUrlService,
    {
      provide: 'IStorageService',
      useFactory: (configService: ConfigService, cdnService: CdnService) => {
        const provider = configService.get<string>('storage.provider');
        if (provider === 'local') {
          return new LocalStorageService(configService);
        }
        return new AwsS3Service(configService, cdnService);
      },
      inject: [ConfigService, CdnService],
    },
    // Keep AwsS3Service and LocalStorageService in providers to allow Nest to manage their lifecycle if they are injected elsewhere directly.
    // However, they won't be used directly; the factory for 'IStorageService' decides which one to instantiate.
    AwsS3Service,
    LocalStorageService,
  ],
  exports: [
    CdnService,
    'IStorageService',
    ImageProcessingService,
    SecureUrlService,
  ],
})
export class StorageModule {} 