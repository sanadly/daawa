import {
  Controller,
  Get,
  Param,
  Request,
  Response,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SecureUrlService } from './services/secure-url.service';

@ApiTags('Secure Access')
@Controller('storage')
export class SecureAccessController {
  constructor(private readonly secureUrlService: SecureUrlService) {}

  @Get('secure/:token')
  @ApiOperation({ summary: 'Access file through secure URL token (public endpoint)' })
  @ApiResponse({ status: 200, description: 'File accessed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async accessSecureFile(
    @Param('token') token: string,
    @Request() req,
    @Response({ passthrough: true }) res,
  ) {
    const clientIp = req.ip || req.connection.remoteAddress;
    
    const result = await this.secureUrlService.accessSecureFile(token, clientIp);

    // Set appropriate headers for secure file delivery
    res.set({
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${result.fileName}"`,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'Expires': '0',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    });

    return new StreamableFile(result.fileBuffer);
  }
} 