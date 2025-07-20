import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { AdvancedPassRendererService, RenderRequest } from './services/advanced-pass-renderer.service';
import { SimpleTestRendererService } from './services/simple-test-renderer.service';

@ApiTags('Pass Renderer')
@Controller('passes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PassRendererController {
  private readonly logger = new Logger(PassRendererController.name);

  constructor(
    private readonly rendererService: AdvancedPassRendererService,
    private readonly simpleRenderer: SimpleTestRendererService,
  ) {}

  @Post('render')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Render a pass',
    description: 'Generates a rendered pass image based on the design configuration',
  })
  @ApiResponse({
    status: 200,
    description: 'Pass rendered successfully',
    content: {
      'image/png': { schema: { type: 'string', format: 'binary' } },
      'image/jpeg': { schema: { type: 'string', format: 'binary' } },
      'image/webp': { schema: { type: 'string', format: 'binary' } },
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiBody({
    description: 'Render request configuration',
    schema: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'Event ID' },
        guestId: { type: 'string', description: 'Guest ID (optional)' },
        format: { 
          type: 'string', 
          enum: ['png', 'jpg', 'webp', 'pdf'],
          default: 'png',
          description: 'Output format'
        },
        designConfig: {
          type: 'object',
          description: 'Design configuration object'
        },
        variables: {
          type: 'object',
          description: 'Additional variables for dynamic replacement'
        },
      },
      required: ['eventId', 'designConfig'],
    },
  })
  async renderPass(
    @Body() renderRequest: RenderRequest,
    @Res() res: Response,
  ) {
    try {
      this.logger.log('Received render request:', JSON.stringify(renderRequest, null, 2));
      
      const imageBuffer = await this.rendererService.renderPass(renderRequest);
      
      this.logger.log(`Generated image buffer of size: ${imageBuffer.length} bytes`);
      
      const format = renderRequest.format || 'png';
      const contentType = this.getContentType(format);
      
      res.set({
        'Content-Type': contentType,
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      });
      
      res.send(imageBuffer);
    } catch (error) {
      this.logger.error('Error rendering pass:', error);
      if (error instanceof Error) {
        this.logger.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  @Post('render/preview')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate a thumbnail preview',
    description: 'Generates a small preview thumbnail of the pass design',
  })
  async renderPreview(
    @Body() body: {
      designConfig: any;
      width?: number;
      height?: number;
    },
    @Res() res: Response,
  ): Promise<void> {
    try {
      const buffer = await this.rendererService.generateThumbnail(
        body.designConfig,
        body.width,
        body.height,
      );

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error) {
      this.logger.error('Failed to generate preview', error);
      throw error;
    }
  }

  @Post('test')
  @Public()
  @HttpCode(HttpStatus.OK)
  async testRender(@Res() res: Response) {
    try {
      this.logger.log('Testing simple render...');
      const buffer = await this.simpleRenderer.renderSimplePass();
      
      res.set({
        'Content-Type': 'image/png',
        'Content-Length': buffer.length.toString(),
      });
      
      res.send(buffer);
    } catch (error) {
      this.logger.error('Test render failed:', error);
      throw error;
    }
  }

  @Post('health')
  @Public()
  @HttpCode(HttpStatus.OK)
  health() {
    return { status: 'OK', timestamp: new Date().toISOString() };
  }

  private getContentType(format: string): string {
    switch (format) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
        return 'image/jpeg';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/png';
    }
  }
} 