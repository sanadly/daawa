import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { Permissions, Permission } from '../common/decorators/permissions.decorator';

@Controller('organizer')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ORGANIZER)
export class OrganizerController {
  @Get('dashboard')
  getDashboard() {
    return {
      message: 'Organizer dashboard',
      stats: {
        totalEvents: 12,
        upcomingEvents: 5,
        totalAttendees: 1500,
        totalRevenue: 45000,
      },
    };
  }

  @Get('events')
  @Permissions(Permission.MANAGE_EVENTS)
  getMyEvents() {
    return {
      message: 'Organizer events',
      events: [
        { id: 1, name: 'Annual Conference 2023', date: '2023-10-15', attendees: 300 },
        { id: 2, name: 'Tech Seminar', date: '2023-11-20', attendees: 150 },
        { id: 3, name: 'Workshop Series', date: '2023-12-05', attendees: 50 },
      ],
    };
  }

  @Post('events')
  @Permissions(Permission.MANAGE_EVENTS)
  createEvent(@Body() eventData: any) {
    return {
      message: 'Organizer create event',
      event: {
        id: 4,
        ...eventData,
        createdAt: new Date(),
      },
    };
  }

  @Get('events/:id')
  @Permissions(Permission.MANAGE_EVENTS)
  getEventDetails(@Param('id') id: string) {
    return {
      message: `Organizer event details: ${id}`,
      event: {
        id: parseInt(id),
        name: `Event ${id}`,
        date: '2023-12-15',
        location: 'Conference Center',
        description: 'A detailed description of the event',
        attendees: 120,
        sponsors: [
          { name: 'Sponsor A', level: 'Gold' },
          { name: 'Sponsor B', level: 'Silver' },
        ],
      },
    };
  }

  @Put('events/:id')
  @Permissions(Permission.MANAGE_EVENTS)
  updateEvent(@Param('id') id: string, @Body() eventData: any) {
    return {
      message: `Organizer update event: ${id}`,
      event: {
        id: parseInt(id),
        ...eventData,
        updatedAt: new Date(),
      },
    };
  }

  @Delete('events/:id')
  @Permissions(Permission.MANAGE_EVENTS)
  deleteEvent(@Param('id') id: string) {
    return {
      message: `Organizer delete event: ${id}`,
      success: true,
    };
  }

  @Get('events/:id/attendees')
  @Permissions(Permission.MANAGE_ATTENDEES)
  getEventAttendees(@Param('id') id: string) {
    return {
      message: `Organizer get event attendees: ${id}`,
      attendees: [
        { id: 1, name: 'Attendee 1', email: 'attendee1@example.com', status: 'confirmed' },
        { id: 2, name: 'Attendee 2', email: 'attendee2@example.com', status: 'pending' },
        { id: 3, name: 'Attendee 3', email: 'attendee3@example.com', status: 'confirmed' },
      ],
    };
  }

  @Post('events/:id/staff')
  @Permissions(Permission.MANAGE_STAFF)
  assignStaff(@Param('id') id: string, @Body() staffData: any) {
    return {
      message: `Organizer assign staff to event: ${id}`,
      assignment: {
        eventId: parseInt(id),
        ...staffData,
        assignedAt: new Date(),
      },
    };
  }

  @Get('analytics')
  @Permissions(Permission.VIEW_ANALYTICS)
  getAnalytics() {
    return {
      message: 'Organizer analytics',
      analytics: {
        attendeeGrowth: [
          { month: 'Jan', count: 250 },
          { month: 'Feb', count: 300 },
          { month: 'Mar', count: 450 },
        ],
        revenueByEvent: [
          { event: 'Annual Conference 2023', revenue: 25000 },
          { event: 'Tech Seminar', revenue: 12000 },
          { event: 'Workshop Series', revenue: 8000 },
        ],
        attendeeDemographics: {
          age: { '18-24': 20, '25-34': 45, '35-44': 25, '45+': 10 },
          gender: { male: 55, female: 42, other: 3 },
        },
      },
    };
  }
} 