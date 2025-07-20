import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
  Delete,
} from '@nestjs/common';
import { AdminService } from './admin.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/user.decorator';
import { UserRole } from '../database/entities/user.entity';
import { UpdateEventStatusDto } from './dtos/update-event-status.dto';
import { UpdatePaymentStatusDto } from './dtos/update-payment-status.dto';
import { UpdateEventNotesDto } from './dtos/update-event-notes.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminService: AdminService,
  ) {}

  @Get('dashboard/metrics')
  async getDashboardMetrics() {
    return this.adminService.getDashboardMetrics();
  }

  @Get('analytics/overview')
  async getAnalyticsOverview(@Query('period') period?: string) {
    return this.adminService.getAnalyticsOverview(period);
  }

  @Get('analytics/revenue')
  async getRevenueAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getRevenueAnalytics(startDate, endDate);
  }

  @Get('events')
  async getEvents(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getEvents({
      status,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  @Get('events/:id')
  async getEventDetail(@Param('id') eventId: string) {
    return this.adminService.getEventDetail(eventId);
  }

  @Get('events/:id/financial-summary')
  async getEventFinancialSummary(@Param('id') eventId: string) {
    return this.adminService.getEventFinancialSummary(eventId);
  }

  @Patch('events/:id/status')
  async updateEventStatus(
    @Param('id') eventId: string,
    @Body() updateStatusDto: UpdateEventStatusDto,
    @GetUser() adminUser: any,
  ) {
    return this.adminService.updateEventStatus(
      eventId,
      updateStatusDto,
      adminUser.id,
    );
  }

  @Patch('events/:id/payment-status')
  async updateEventPaymentStatus(
    @Param('id') eventId: string,
    @Body() updatePaymentStatusDto: UpdatePaymentStatusDto,
    @GetUser() adminUser: any,
  ) {
    return this.adminService.updateEventPaymentStatus(
      eventId,
      updatePaymentStatusDto.payment_status,
      adminUser.id,
    );
  }

  @Patch('events/:id/notes')
  async updateEventNotes(
    @Param('id') eventId: string,
    @Body() updateNotesDto: UpdateEventNotesDto,
    @GetUser() adminUser: any,
  ) {
    return this.adminService.updateEventNotes(
      eventId,
      updateNotesDto.notes,
      adminUser.id,
    );
  }

  @Post('events/bulk-action')
  async bulkUpdateEvents(
    @Body() bulkActionDto: { eventIds: string[]; action: string },
    @GetUser() adminUser: any,
  ) {
    return this.adminService.bulkUpdateEvents(
      bulkActionDto.eventIds,
      bulkActionDto.action,
      adminUser.id,
    );
  }

  // User Management Endpoints
  @Get('users')
  async getUsers(
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getUsers({
      role,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      status,
    });
  }

  @Get('users/:id')
  async getUserDetail(@Param('id') userId: string) {
    return this.adminService.getUserDetails(userId);
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id') userId: string,
    @Body() roleDto: { role: UserRole },
    @GetUser() adminUser: any,
  ) {
    return this.adminService.updateUserRole(userId, roleDto.role, adminUser.id);
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') userId: string,
    @Body() statusDto: { isActive: boolean },
    @GetUser() adminUser: any,
  ) {
    return this.adminService.updateUserStatus(userId, statusDto.isActive, adminUser.id);
  }

  @Delete('users/:id')
  async deleteUser(
    @Param('id') userId: string,
    @GetUser() adminUser: any,
  ) {
    return this.adminService.deleteUser(userId, adminUser.id);
  }

  @Get('organizers')
  async getOrganizers(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getOrganizers({
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  // Payment Management
  @Get('payments')
  async getPayments(
    @Query('status') status?: string,
    @Query('eventId') eventId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getPayments({
      status,
      eventId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  @Get('payments/summary')
  async getPaymentsSummary() {
    return this.adminService.getPaymentsSummary();
  }

  @Post('payments/:eventId/process')
  async processPayment(
    @Param('eventId') eventId: string,
    @Body() paymentDto: { amount: number; reference?: string },
    @GetUser() adminUser: any,
  ) {
    return this.adminService.processPayment(eventId, paymentDto, adminUser.id);
  }

  // System Monitoring
  @Get('system/health')
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  @Get('system/stats')
  async getSystemStats() {
    return this.adminService.getSystemStats();
  }

  @Get('audit-log')
  async getAuditLog(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAuditLog({
      entityType,
      entityId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }
} 