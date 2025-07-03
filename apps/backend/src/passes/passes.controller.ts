import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  UseGuards,
  Logger,
  HttpException,
  ParseUUIDPipe,
  ValidationPipe,
  Headers,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiHeader,
  ApiProduces,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { PassGenerationService, PassGenerationRequest } from './services/pass-generation.service';
import { PdfPassService } from './services/pdf-pass.service';
import { AppleWalletService } from './services/apple-wallet.service';
import { GoogleWalletService } from './services/google-wallet.service';

export class GeneratePassDto {
  eventId: string;
  guestId: string;
  formats: ('pdf' | 'apple' | 'google')[];
  options?: {
    language?: 'en' | 'ar';
    customStyles?: string;
    notifications?: boolean;
  };
}

interface HealthCheckDto {
  service: string;
  status: string;
  details?: any;
}

interface PassGenerationStatsDto {
  totalGenerated: number;
  averageGenerationTime: number;
  successRate: number;
  lastGenerated: Date;
}

@ApiTags('Digital Passes')
@Controller('passes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PassesController {
  private readonly logger = new Logger(PassesController.name);
  private readonly generationStats = {
    totalGenerated: 0,
    totalTime: 0,
    failures: 0,
    lastGenerated: new Date(),
  };

  constructor(
    private readonly passGenerationService: PassGenerationService,
    private readonly pdfPassService: PdfPassService,
    private readonly appleWalletService: AppleWalletService,
    private readonly googleWalletService: GoogleWalletService,
  ) {}

  /**
   * Generate passes in multiple formats
   */
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate event passes',
    description: 'Generate event passes in multiple formats (PDF, Apple Wallet, Google Wallet)',
  })
  @ApiBody({ type: GeneratePassDto })
  @ApiResponse({
    status: 200,
    description: 'Passes generated successfully',
    schema: {
      example: {
        success: true,
        passId: 'event-123-guest-456-1641234567890',
        formats: {
          pdf: { success: true },
          apple: { success: true },
          google: { success: false, error: 'Google Wallet not implemented' }
        },
        generatedAt: '2024-01-01T12:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 404, description: 'Event or guest not found' })
  async generatePasses(@Body() dto: GeneratePassDto) {
    try {
      this.logger.log(`Generating passes for event ${dto.eventId}, guest ${dto.guestId}`);

      if (!dto.eventId || !dto.guestId || !dto.formats || dto.formats.length === 0) {
        throw new BadRequestException('eventId, guestId, and at least one format are required');
      }

      const request: PassGenerationRequest = {
        eventId: dto.eventId,
        guestId: dto.guestId,
        formats: dto.formats,
        options: dto.options,
      };

      const result = await this.passGenerationService.generatePasses(request);

      // Don't include buffer data in response for security
      const response = {
        success: result.success,
        passId: result.passId,
        formats: Object.entries(result.formats).reduce((acc, [format, data]) => {
          acc[format] = {
            success: data.success,
            ...(data.error && { error: data.error })
          };
          return acc;
        }, {} as any),
        generatedAt: result.generatedAt,
      };

      return response;
    } catch (error) {
      this.logger.error('Failed to generate passes', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to generate passes');
    }
  }

  /**
   * Download PDF pass
   */
  @Get('pdf/:eventId/:guestId')
  @ApiOperation({
    summary: 'Generate PDF pass',
    description: 'Generates a PDF pass for the specified guest and event with QR code and localization support'
  })
  @ApiParam({
    name: 'eventId',
    description: 'UUID of the event',
    type: 'string',
    format: 'uuid'
  })
  @ApiParam({
    name: 'guestId',
    description: 'UUID of the guest',
    type: 'string',
    format: 'uuid'
  })
  @ApiQuery({
    name: 'download',
    description: 'Force download instead of inline display',
    required: false,
    type: 'boolean'
  })
  @ApiQuery({
    name: 'language',
    description: 'Language preference (en, ar)',
    required: false,
    enum: ['en', 'ar']
  })
  @ApiHeader({
    name: 'User-Agent',
    description: 'Client user agent for logging',
    required: false
  })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF pass generated successfully',
    headers: {
      'Content-Type': { description: 'application/pdf' },
      'Content-Disposition': { description: 'attachment; filename="pass.pdf"' },
      'Content-Length': { description: 'Size of PDF in bytes' }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing authentication' })
  @ApiResponse({ status: 404, description: 'Guest or event not found' })
  @ApiResponse({ status: 500, description: 'PDF generation failed' })
  async generatePdfPass(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('guestId', ParseUUIDPipe) guestId: string,
    @Query('download') download?: boolean,
    @Query('language') language?: 'en' | 'ar',
    @Headers('user-agent') userAgent?: string,
    @Res() res?: Response,
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Generating PDF pass for guest ${guestId}, event ${eventId}`, {
        language,
        download,
        userAgent,
      });

      // Generate PDF pass
      const pdfBuffer = await this.pdfPassService.generatePass(guestId, eventId);

      // Update statistics
      const generationTime = Date.now() - startTime;
      this.updateStats(generationTime, true);

      // Set response headers
      const filename = `pass-${guestId}-${eventId}.pdf`;
      const disposition = download ? 'attachment' : 'inline';
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
      res.setHeader('X-Generation-Time', `${generationTime}ms`);

      // Send PDF
      res.send(pdfBuffer);

      this.logger.log(`PDF pass generated successfully in ${generationTime}ms`, {
        guestId,
        eventId,
        sizeBytes: pdfBuffer.length,
      });

    } catch (error) {
      const generationTime = Date.now() - startTime;
      this.updateStats(generationTime, false);

      this.logger.error(`PDF pass generation failed for guest ${guestId}, event ${eventId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        generationTime,
      });

             const errorMessage = error instanceof Error ? error.message : 'Unknown error';
       
       if (errorMessage.includes('not found')) {
         throw new HttpException('Guest or event not found', HttpStatus.NOT_FOUND);
       }

       if (errorMessage.includes('not registered')) {
         throw new HttpException('Guest is not registered for this event', HttpStatus.BAD_REQUEST);
      }

      throw new HttpException(
        'Failed to generate PDF pass',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get pass generation status
   */
  @Get('status/:passId')
  @ApiOperation({
    summary: 'Get pass status',
    description: 'Get the status of a generated pass',
  })
  @ApiParam({ name: 'passId', description: 'Pass ID' })
  @ApiResponse({
    status: 200,
    description: 'Pass status information',
    schema: {
      example: {
        passId: 'event-123-guest-456-1641234567890',
        status: 'generated',
        generatedAt: '2024-01-01T12:00:00.000Z'
      }
    }
  })
  async getPassStatus(@Param('passId') passId: string) {
    try {
      const status = await this.passGenerationService.getPassStatus(passId);
      return status;
    } catch (error) {
      this.logger.error(`Failed to get pass status for ${passId}`, error);
      throw new NotFoundException('Pass not found');
    }
  }

  /**
   * Health check for pass generation service
   */
  @Get('health')
  @ApiOperation({
    summary: 'Check pass generation services health',
    description: 'Returns health status of PDF, Apple Wallet, and Google Wallet services'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Health check results',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        services: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              status: { type: 'string' },
              details: { type: 'object' }
            }
          }
        }
      }
    }
  })
  async healthCheck(): Promise<{ success: boolean; services: HealthCheckDto[] }> {
    try {
      const services: HealthCheckDto[] = [];

      // Check PDF service
      try {
        const pdfHealth = await this.pdfPassService.healthCheck();
        services.push({
          service: 'pdf',
          status: pdfHealth.status,
          details: pdfHealth.details,
        });
      } catch (error) {
        services.push({
          service: 'pdf',
          status: 'unhealthy',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        });
      }

      // Check Apple Wallet service
      services.push({
        service: 'apple-wallet',
        status: 'healthy', // TODO: Implement actual health check
        details: { available: true },
      });

      // Check Google Wallet service
      services.push({
        service: 'google-wallet',
        status: 'healthy', // TODO: Implement actual health check
        details: { available: true },
      });

      const allHealthy = services.every(service => service.status === 'healthy');

      return {
        success: allHealthy,
        services,
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      throw new HttpException('Health check failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get pass generation statistics',
    description: 'Returns statistics about pass generation performance and usage'
  })
  @ApiResponse({
    status: 200,
    description: 'Pass generation statistics',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            totalGenerated: { type: 'number' },
            averageGenerationTime: { type: 'number' },
            successRate: { type: 'number' },
            lastGenerated: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  async getStats(): Promise<{ success: boolean; data: PassGenerationStatsDto }> {
    const successRate = this.generationStats.totalGenerated > 0
      ? ((this.generationStats.totalGenerated - this.generationStats.failures) / this.generationStats.totalGenerated) * 100
      : 100;

    const averageGenerationTime = this.generationStats.totalGenerated > 0
      ? this.generationStats.totalTime / this.generationStats.totalGenerated
      : 0;

    return {
      success: true,
      data: {
        totalGenerated: this.generationStats.totalGenerated,
        averageGenerationTime: Math.round(averageGenerationTime),
        successRate: Math.round(successRate * 100) / 100,
        lastGenerated: this.generationStats.lastGenerated,
      },
    };
  }

  @Post('apple-wallet/:eventId/:guestId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate Apple Wallet pass',
    description: 'Generates an Apple Wallet (.pkpass) pass for the specified guest and event'
  })
  @ApiParam({
    name: 'eventId',
    description: 'UUID of the event',
    type: 'string',
    format: 'uuid'
  })
  @ApiParam({
    name: 'guestId',
    description: 'UUID of the guest',
    type: 'string',
    format: 'uuid'
  })
  @ApiProduces('application/vnd.apple.pkpass')
  @ApiResponse({
    status: 200,
    description: 'Apple Wallet pass generated successfully',
    headers: {
      'Content-Type': { description: 'application/vnd.apple.pkpass' },
      'Content-Disposition': { description: 'attachment; filename="pass.pkpass"' }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Guest or event not found' })
  @ApiResponse({ status: 501, description: 'Apple Wallet service not implemented' })
  async generateAppleWalletPass(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('guestId', ParseUUIDPipe) guestId: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      this.logger.log(`Generating Apple Wallet pass for guest ${guestId}, event ${eventId}`);

      // TODO: Implement Apple Wallet pass generation
      const passBuffer = await this.appleWalletService.generatePass(eventId, guestId);

      const filename = `pass-${guestId}-${eventId}.pkpass`;
      
      res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', passBuffer.length);

      res.send(passBuffer);

    } catch (error) {
      this.logger.error(`Apple Wallet pass generation failed`, error);
      throw new HttpException(
        'Apple Wallet service not available',
        HttpStatus.NOT_IMPLEMENTED,
      );
    }
  }

  @Post('google-wallet/:eventId/:guestId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate Google Wallet pass URL',
    description: 'Generates a Google Wallet save URL for the specified guest and event'
  })
  @ApiParam({
    name: 'eventId',
    description: 'UUID of the event',
    type: 'string',
    format: 'uuid'
  })
  @ApiParam({
    name: 'guestId',
    description: 'UUID of the guest',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Google Wallet save URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            saveUrl: { type: 'string', format: 'uri' },
            passId: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Guest or event not found' })
  @ApiResponse({ status: 501, description: 'Google Wallet service not implemented' })
  async generateGoogleWalletPass(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('guestId', ParseUUIDPipe) guestId: string,
  ): Promise<{ success: boolean; data: { saveUrl: string; passId: string } }> {
    try {
      this.logger.log(`Generating Google Wallet pass for guest ${guestId}, event ${eventId}`);

      // TODO: Implement Google Wallet pass generation
      const result = await this.googleWalletService.generateSaveUrl(eventId, guestId);

      return {
        success: true,
        data: result,
      };

    } catch (error) {
      this.logger.error(`Google Wallet pass generation failed`, error);
      throw new HttpException(
        'Google Wallet service not available',
        HttpStatus.NOT_IMPLEMENTED,
      );
    }
  }

  @Get('validate/:token')
  @ApiOperation({
    summary: 'Validate QR code token',
    description: 'Validates a QR code token and returns guest and event information'
  })
  @ApiParam({
    name: 'token',
    description: 'JWT token from QR code',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Token validation successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            eventId: { type: 'string' },
            guestId: { type: 'string' },
            passId: { type: 'string' },
            issuedAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async validateQrToken(
    @Param('token') token: string,
  ): Promise<{ success: boolean; data: any }> {
    try {
      this.logger.log(`Validating QR token: ${token.substring(0, 20)}...`);

      // TODO: Implement QR token validation using JWT service
      // const payload = await this.jwtService.verifyQrCodeToken(token);

      return {
        success: true,
        data: {
          valid: true,
          eventId: 'placeholder',
          guestId: 'placeholder',
          passId: 'placeholder',
          issuedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      };

         } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
       this.logger.warn(`QR token validation failed: ${errorMessage}`);
       
       return {
         success: false,
         data: {
           valid: false,
           error: 'Invalid or expired token',
         },
       };
     }
  }

  private updateStats(generationTime: number, success: boolean): void {
    this.generationStats.totalGenerated++;
    this.generationStats.totalTime += generationTime;
    this.generationStats.lastGenerated = new Date();
    
    if (!success) {
      this.generationStats.failures++;
    }
  }
} 