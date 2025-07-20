import { Controller, Get, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PassesService } from './passes.service';
import { Public } from '../auth/decorators/public.decorator';
import { PassResponseDto } from './dto';

@ApiTags('Passes')
@Controller('passes/view') // Changed route to avoid conflict
export class PassRetrievalController {
  private readonly logger = new Logger(PassRetrievalController.name);

  constructor(private readonly passesService: PassesService) {}

  @Get(':token')
  @Public()
  @ApiOperation({ summary: 'Get pass details by access token' })
  @ApiResponse({ status: 200, description: 'Pass details found', type: PassResponseDto })
  @ApiResponse({ status: 404, description: 'Pass not found' })
  async getPassByToken(@Param('token') token: string): Promise<PassResponseDto> {
    this.logger.log(`Received request for pass with token: ${token}`);
    return this.passesService.findPassByToken(token);
  }
}
