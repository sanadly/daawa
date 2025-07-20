import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Request,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { UserRole } from '../database/entities/user.entity';
import { Permission } from '../auth/constants/permissions';
import { CheckinService } from './services/checkin.service';
import { QrCodeService } from './services/qr-code.service';
import {
  QrValidationRequestDto,
  QrValidationResponseDto,
  CheckinRequestDto,
  CheckinResponseDto,
  CheckinQueryDto,
  CheckinStatsResponseDto,
  CheckinHistoryResponseDto,
  BulkCheckinRequestDto,
  SyncCheckinRequestDto,
  SyncCheckinResponseDto,
  CheckinStatisticsDto,
} from './dtos';

@ApiTags('Check-in')
@Controller('checkin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class CheckinController {
  private readonly logger = new Logger(CheckinController.name);

  constructor(
    private readonly checkinService: CheckinService,
    private readonly qrCodeService: QrCodeService,
  ) {}

  @Post('validate-qr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a QR code for check-in' })
  @ApiResponse({ status: 200, description: 'QR code is valid', type: QrValidationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid QR code data' })
  @ApiResponse({ status: 404, description: 'Guest or Event not found' })
  @Roles(
    UserRole.STAFF,
    UserRole.INDIVIDUAL_ORGANIZER,
    UserRole.COMPANY_ORGANIZER,
    UserRole.ADMIN,
  )
  @RequirePermissions(Permission.GUEST_READ)
  async validateQrCode(
    @Body() validationData: QrValidationRequestDto,
  ): Promise<QrValidationResponseDto> {
    this.logger.log(`Validating QR code for data: ${validationData.qr_code_data}`);
    return await this.qrCodeService.validateQrCode(validationData);
  }

  @Post('record')
  @ApiOperation({ summary: 'Record a new check-in' })
  @ApiResponse({ status: 201, description: 'Check-in recorded successfully', type: CheckinResponseDto })
  @Roles(
    UserRole.STAFF,
    UserRole.INDIVIDUAL_ORGANIZER,
    UserRole.COMPANY_ORGANIZER,
    UserRole.ADMIN,
  )
  @RequirePermissions(Permission.CHECKIN_PERFORM)
  async recordCheckin(
    @Body() checkinRequestDto: CheckinRequestDto,
    @Request() req,
  ): Promise<CheckinResponseDto> {
    this.logger.log(`Recording check-in for guest ID: ${checkinRequestDto.guest_id}`);
    const { user } = req;
    return await this.checkinService.recordCheckin(checkinRequestDto, user.id);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Record multiple check-ins at once' })
  @ApiResponse({ status: 201, description: 'Bulk check-in processed' })
  @Roles(
    UserRole.STAFF,
    UserRole.INDIVIDUAL_ORGANIZER,
    UserRole.COMPANY_ORGANIZER,
    UserRole.ADMIN,
  )
  @RequirePermissions(Permission.CHECKIN_PERFORM, Permission.CHECKIN_OVERRIDE)
  async bulkCheckin(
    @Body() bulkCheckinDto: BulkCheckinRequestDto,
    @Request() req,
  ) {
    this.logger.log(`Processing bulk check-in for ${bulkCheckinDto.checkin_requests.length} guests`);
    const { user } = req;
    return await this.checkinService.processBulkCheckin(bulkCheckinDto, user.id);
  }

  @Post('sync-offline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Synchronize offline check-in records' })
  @ApiResponse({ status: 200, description: 'Offline records synchronized', type: SyncCheckinResponseDto })
  @Roles(
    UserRole.STAFF,
    UserRole.INDIVIDUAL_ORGANIZER,
    UserRole.COMPANY_ORGANIZER,
    UserRole.ADMIN,
  )
  @RequirePermissions(Permission.CHECKIN_PERFORM)
  async syncOfflineCheckins(
    @Body() syncCheckinDto: SyncCheckinRequestDto,
    @Request() req,
  ): Promise<SyncCheckinResponseDto> {
    const { user } = req;
    this.logger.log(`Syncing ${syncCheckinDto.offline_checkins.length} offline check-ins for user ${user.id}`);
    return await this.checkinService.syncOfflineCheckins(syncCheckinDto, user.id);
  }

  @Get('history/:eventId')
  @ApiOperation({ summary: 'Get check-in history for an event' })
  @ApiParam({ name: 'eventId', description: 'ID of the event' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Check-in history retrieved', type: CheckinHistoryResponseDto })
  @Roles(
    UserRole.STAFF,
    UserRole.INDIVIDUAL_ORGANIZER,
    UserRole.COMPANY_ORGANIZER,
    UserRole.ADMIN,
  )
  @RequirePermissions(Permission.CHECKIN_READ)
  async getCheckinHistory(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query() query: CheckinQueryDto,
  ): Promise<CheckinHistoryResponseDto> {
    this.logger.log(`Fetching check-in history for event ID: ${eventId}`);
    const historyQuery: CheckinQueryDto = { ...query, event_id: eventId };
    return await this.checkinService.getCheckinHistory(historyQuery);
  }

  @Get('statistics/:eventId')
  @ApiOperation({ summary: 'Get detailed check-in statistics for an event' })
  @ApiParam({ name: 'eventId', description: 'ID of the event' })
  @ApiResponse({ status: 200, description: 'Event statistics retrieved', type: CheckinStatisticsDto })
  @Roles(
    UserRole.STAFF,
    UserRole.INDIVIDUAL_ORGANIZER,
    UserRole.COMPANY_ORGANIZER,
    UserRole.ADMIN,
  )
  @RequirePermissions(Permission.ANALYTICS_READ)
  async getDetailedCheckinStats(
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ): Promise<CheckinStatisticsDto> {
    this.logger.log(`Fetching detailed statistics for event ID: ${eventId}`);
    return await this.checkinService.getDetailedCheckinStats(eventId);
  }

  @Get('guest-status/:eventId/:guestId')
  @ApiOperation({ summary: 'Get check-in status for a specific guest' })
  @ApiParam({ name: 'eventId', description: 'ID of the event' })
  @ApiParam({ name: 'guestId', description: 'ID of the guest' })
  @ApiResponse({ status: 200, description: 'Guest check-in status retrieved' })
  @Roles(
    UserRole.STAFF,
    UserRole.INDIVIDUAL_ORGANIZER,
    UserRole.COMPANY_ORGANIZER,
    UserRole.ADMIN,
  )
  @RequirePermissions(Permission.GUEST_READ)
  async getGuestCheckinStatus(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('guestId', ParseUUIDPipe) guestId: string,
  ) {
    this.logger.log(`Fetching check-in status for guest ID: ${guestId} at event ID: ${eventId}`);
    return await this.checkinService.getGuestCheckinStatus(guestId);
  }
  
  @Get('event/:eventId/guest/:guestId/qr-code')
  @ApiOperation({ summary: 'Generate a QR code for a specific guest and event' })
  @ApiParam({ name: 'eventId', description: 'ID of the event' })
  @ApiParam({ name: 'guestId', description: 'ID of the guest' })
  @ApiResponse({ status: 200, description: 'Guest QR code generated successfully' })
  @Roles(
    UserRole.STAFF,
    UserRole.INDIVIDUAL_ORGANIZER,
    UserRole.COMPANY_ORGANIZER,
    UserRole.ADMIN,
  )
  @RequirePermissions(Permission.GUEST_READ)
  async generateGuestQrCode(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('guestId', ParseUUIDPipe) guestId: string,
  ): Promise<{ qrCodeData: string }> {
    this.logger.log(`Generating QR code for guest ID: ${guestId} at event ID: ${eventId}`);
    const qrCodeData = await this.qrCodeService.generateQrCode(guestId, eventId);
    return { qrCodeData };
  }
} 