import { Injectable, Logger } from '@nestjs/common';
import { PdfPassService } from './pdf-pass.service';
import { AppleWalletService } from './apple-wallet.service';
import { GoogleWalletService } from './google-wallet.service';

export interface PassGenerationRequest {
  eventId: string;
  guestId: string;
  formats: ('pdf' | 'apple' | 'google')[];
  options?: {
    language?: 'en' | 'ar';
    customStyles?: string;
    notifications?: boolean;
  };
}

export interface PassGenerationResult {
  success: boolean;
  formats: {
    pdf?: {
      success: boolean;
      buffer?: Buffer;
      error?: string;
    };
    apple?: {
      success: boolean;
      buffer?: Buffer;
      error?: string;
    };
    google?: {
      success: boolean;
      buffer?: Buffer;
      error?: string;
    };
  };
  passId: string;
  generatedAt: Date;
}

@Injectable()
export class PassGenerationService {
  private readonly logger = new Logger(PassGenerationService.name);

  constructor(
    private readonly pdfPassService: PdfPassService,
    private readonly appleWalletService: AppleWalletService,
    private readonly googleWalletService: GoogleWalletService,
  ) {}

  /**
   * Generate passes in multiple formats
   */
  async generatePasses(request: PassGenerationRequest): Promise<PassGenerationResult> {
    const { eventId, guestId, formats, options = {} } = request;
    
    this.logger.log(`Generating passes for guest ${guestId} at event ${eventId}, formats: ${formats.join(', ')}`);

    const result: PassGenerationResult = {
      success: false,
      formats: {},
      passId: `${eventId}-${guestId}-${Date.now()}`,
      generatedAt: new Date(),
    };

    const promises: Promise<void>[] = [];

    // Generate PDF pass
    if (formats.includes('pdf')) {
      promises.push(
        this.generatePdfPass(eventId, guestId, options, result)
      );
    }

    // Generate Apple Wallet pass
    if (formats.includes('apple')) {
      promises.push(
        this.generateApplePass(eventId, guestId, options, result)
      );
    }

    // Generate Google Wallet pass
    if (formats.includes('google')) {
      promises.push(
        this.generateGooglePass(eventId, guestId, options, result)
      );
    }

    // Execute all generation tasks in parallel
    await Promise.allSettled(promises);

    // Determine overall success
    result.success = Object.values(result.formats).some(format => format.success);

    this.logger.log(`Pass generation completed for ${result.passId}. Success: ${result.success}`);
    return result;
  }

  /**
   * Generate PDF pass
   */
  private async generatePdfPass(
    eventId: string,
    guestId: string,
    options: any,
    result: PassGenerationResult,
  ): Promise<void> {
    try {
      this.logger.log(
        `Orchestrating pass generation for event ${eventId}, guest ${guestId}`,
      );

      // For now, we only support PDF generation. This can be expanded later.
      const pdfBuffer = await this.pdfPassService.generatePass(eventId, guestId);

      result.formats.pdf = {
        success: true,
        buffer: pdfBuffer,
      };

      this.logger.log(`PDF pass generated successfully for guest ${guestId}`);
    } catch (error) {
      this.logger.error(`Failed to generate PDF pass for guest ${guestId}`, error);
      result.formats.pdf = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate Apple Wallet pass
   */
  private async generateApplePass(
    eventId: string,
    guestId: string,
    options: any,
    result: PassGenerationResult,
  ): Promise<void> {
    try {
      const appleBuffer = await this.appleWalletService.generateApplePass(eventId, guestId, {
        language: options.language,
      });

      result.formats.apple = {
        success: true,
        buffer: appleBuffer,
      };

      this.logger.log(`Apple Wallet pass generated successfully for guest ${guestId}`);
    } catch (error) {
      this.logger.error(`Failed to generate Apple Wallet pass for guest ${guestId}`, error);
      result.formats.apple = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate Google Wallet pass
   */
  private async generateGooglePass(
    eventId: string,
    guestId: string,
    options: any,
    result: PassGenerationResult,
  ): Promise<void> {
    try {
      const googleBuffer = await this.googleWalletService.generateGooglePass(eventId, guestId, {
        language: options.language,
      });

      result.formats.google = {
        success: true,
        buffer: googleBuffer,
      };

      this.logger.log(`Google Wallet pass generated successfully for guest ${guestId}`);
    } catch (error) {
      this.logger.error(`Failed to generate Google Wallet pass for guest ${guestId}`, error);
      result.formats.google = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get pass generation status
   */
  async getPassStatus(passId: string): Promise<any> {
    // TODO: Implement pass status tracking
    // This could track generation progress, download counts, etc.
    return {
      passId,
      status: 'generated',
      generatedAt: new Date(),
    };
  }
} 