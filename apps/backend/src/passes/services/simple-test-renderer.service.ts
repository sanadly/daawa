import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class SimpleTestRendererService {
  private readonly logger = new Logger(SimpleTestRendererService.name);

  async renderSimplePass(): Promise<Buffer> {
    try {
      this.logger.log('Creating simple pass...');
      
      // Create a simple 400x600 white background
      const image = sharp({
        create: {
          width: 400,
          height: 600,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      });
      
      this.logger.log('Converting to PNG buffer...');
      const buffer = await image.png().toBuffer();
      
      this.logger.log(`Created PNG buffer of size: ${buffer.length}`);
      return buffer;
      
    } catch (error) {
      this.logger.error('Error in simple renderer:', error);
      throw error;
    }
  }
} 