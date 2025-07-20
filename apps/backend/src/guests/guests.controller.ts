import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Logger,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { UserRole } from '../database/entities/user.entity';
import { Permission } from '../auth/constants/permissions';
import { Public } from '../auth/decorators/public.decorator';
import { GuestsService } from './guests.service';
import {
  CreateGuestDto,
  UpdateGuestDto,
  GuestQueryDto,
  GuestResponseDto,
  PaginatedGuestResponseDto,
  SelfRegistrationDto,
  SelfRegistrationResponseDto,
} from './dtos';

@Controller('guests')
@ApiTags('Guests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class GuestsController {
  private readonly logger = new Logger(GuestsController.name);

  constructor(private readonly guestsService: GuestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new guest' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Guest created successfully',
    type: GuestResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Event or tier not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Guest email already exists' })
  @ApiBody({ type: CreateGuestDto })
  @Roles(
    UserRole.INDIVIDUAL_ORGANIZER,
    UserRole.COMPANY_ORGANIZER,
    UserRole.ADMIN,
    UserRole.STAFF,
  )
  @RequirePermissions(Permission.GUEST_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createGuest(@Body() createGuestDto: CreateGuestDto): Promise<GuestResponseDto> {
    this.logger.log('Creating new guest');
    return this.guestsService.createGuest(createGuestDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all guests with optional filters and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Guests retrieved successfully',
    type: PaginatedGuestResponseDto,
  })
  @ApiQuery({ type: GuestQueryDto })
  @Roles(
    UserRole.INDIVIDUAL_ORGANIZER,
    UserRole.COMPANY_ORGANIZER,
    UserRole.ADMIN,
    UserRole.STAFF,
  )
  @RequirePermissions(Permission.GUEST_READ)
  async findGuests(@Query() query: GuestQueryDto): Promise<PaginatedGuestResponseDto> {
    this.logger.log('Finding guests with filters');
    return this.guestsService.findGuests(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a guest by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Guest retrieved successfully',
    type: GuestResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Guest not found' })
  @ApiParam({ name: 'id', description: 'Guest ID', type: 'string' })
  @Roles(
    UserRole.INDIVIDUAL_ORGANIZER,
    UserRole.COMPANY_ORGANIZER,
    UserRole.ADMIN,
    UserRole.STAFF,
  )
  @RequirePermissions(Permission.GUEST_READ)
  async findGuestById(@Param('id') id: string): Promise<GuestResponseDto> {
    this.logger.log(`Finding guest with ID: ${id}`);
    return this.guestsService.findGuestById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a guest' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Guest updated successfully',
    type: GuestResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Guest not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Guest email already exists' })
  @ApiParam({ name: 'id', description: 'Guest ID', type: 'string' })
  @ApiBody({ type: UpdateGuestDto })
  @Roles(
    UserRole.INDIVIDUAL_ORGANIZER,
    UserRole.COMPANY_ORGANIZER,
    UserRole.ADMIN,
    UserRole.STAFF,
  )
  @RequirePermissions(Permission.GUEST_UPDATE)
  async updateGuest(
    @Param('id') id: string,
    @Body() updateGuestDto: UpdateGuestDto,
  ): Promise<GuestResponseDto> {
    this.logger.log(`Updating guest with ID: ${id}`);
    return this.guestsService.updateGuest(id, updateGuestDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a guest' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Guest deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Guest not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete primary guest with additional guests',
  })
  @ApiParam({ name: 'id', description: 'Guest ID', type: 'string' })
  @Roles(UserRole.INDIVIDUAL_ORGANIZER, UserRole.COMPANY_ORGANIZER, UserRole.ADMIN)
  @RequirePermissions(Permission.GUEST_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGuest(@Param('id') id: string): Promise<void> {
    this.logger.log(`Deleting guest with ID: ${id}`);
    return this.guestsService.deleteGuest(id);
  }

  @Post(':primaryGuestId/additional')
  @ApiOperation({ summary: 'Add an additional guest to a primary guest' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Additional guest created successfully',
    type: GuestResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Primary guest not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Primary guest has reached maximum additional guests limit',
  })
  @ApiParam({ name: 'primaryGuestId', description: 'Primary guest ID', type: 'string' })
  @ApiBody({ type: CreateGuestDto })
  @Roles(
    UserRole.INDIVIDUAL_ORGANIZER,
    UserRole.COMPANY_ORGANIZER,
    UserRole.ADMIN,
    UserRole.STAFF,
  )
  @RequirePermissions(Permission.GUEST_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async addAdditionalGuest(
    @Param('primaryGuestId') primaryGuestId: string,
    @Body() createGuestDto: CreateGuestDto,
  ): Promise<GuestResponseDto> {
    this.logger.log(`Adding additional guest to primary guest: ${primaryGuestId}`);
    return this.guestsService.addAdditionalGuest(primaryGuestId, createGuestDto);
  }

  @Get('events/:eventId/stats')
  @ApiOperation({ summary: 'Get guest statistics for an event' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Guest statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalGuests: { type: 'number' },
        primaryGuests: { type: 'number' },
        additionalGuests: { type: 'number' },
        acceptedRsvps: { type: 'number' },
        checkedIn: { type: 'number' },
      },
    },
  })
  @ApiParam({ name: 'eventId', description: 'Event ID', type: 'string' })
  @Roles(
    UserRole.INDIVIDUAL_ORGANIZER,
    UserRole.COMPANY_ORGANIZER,
    UserRole.ADMIN,
    UserRole.STAFF,
  )
  @RequirePermissions(Permission.GUEST_READ)
  async getGuestStats(@Param('eventId') eventId: string) {
    this.logger.log(`Getting guest statistics for event: ${eventId}`);
    return this.guestsService.getGuestStats(eventId);
  }

  @Post('self-register')
  @Public()
  @ApiOperation({ summary: 'Self-register for an event (public endpoint)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Guest self-registration completed successfully',
    type: SelfRegistrationResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data or registration closed' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Event or tier not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Guest email already exists' })
  @ApiBody({ type: SelfRegistrationDto })
  @HttpCode(HttpStatus.CREATED)
  async selfRegister(@Body() selfRegistrationDto: SelfRegistrationDto): Promise<SelfRegistrationResponseDto> {
    this.logger.log(`Self-registration for event ${selfRegistrationDto.event_id}`);
    return this.guestsService.selfRegister(selfRegistrationDto);
  }

  // Bulk operations for future use
  @Post('bulk/create')
  @ApiOperation({ summary: 'Create multiple guests in bulk' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Guests created successfully',
    type: [GuestResponseDto],
  })
  @ApiBody({ type: [CreateGuestDto] })
  @Roles(UserRole.INDIVIDUAL_ORGANIZER, UserRole.COMPANY_ORGANIZER, UserRole.ADMIN)
  @RequirePermissions(Permission.GUEST_CREATE, Permission.GUEST_IMPORT)
  @HttpCode(HttpStatus.CREATED)
  async createGuestsBulk(@Body() createGuestDtos: CreateGuestDto[]): Promise<GuestResponseDto[]> {
    this.logger.log(`Creating ${createGuestDtos.length} guests in bulk`);
    
    const results = [];
    for (const dto of createGuestDtos) {
      try {
        const guest = await this.guestsService.createGuest(dto);
        results.push(guest);
      } catch (error) {
        this.logger.error(`Failed to create guest: ${dto.name}`, error);
        // Could be enhanced to return partial results with errors
        throw error;
      }
    }
    
    return results;
  }

  @Get('events/:eventId/export')
  @ApiOperation({ summary: 'Export guests for an event' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Guests exported successfully',
    type: [GuestResponseDto],
  })
  @ApiParam({ name: 'eventId', description: 'Event ID', type: 'string' })
  @Roles(UserRole.INDIVIDUAL_ORGANIZER, UserRole.COMPANY_ORGANIZER, UserRole.ADMIN)
  @RequirePermissions(Permission.GUEST_READ, Permission.GUEST_EXPORT)
  async exportEventGuests(@Param('eventId') eventId: string): Promise<GuestResponseDto[]> {
    this.logger.log(`Exporting guests for event: ${eventId}`);
    
    const result = await this.guestsService.findGuests({
      event_id: eventId,
      limit: 10000, // Large limit to get all guests
      page: 1,
    });
    
    return result.guests;
  }
} 