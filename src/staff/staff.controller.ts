import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { Permissions, Permission } from '../common/decorators/permissions.decorator';

@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.STAFF)
export class StaffController {
  @Get('dashboard')
  getDashboard() {
    return {
      message: 'Staff dashboard',
      stats: {
        assignedEvents: 8,
        tasks: 15,
        completedTasks: 7,
      },
    };
  }

  @Get('events')
  @Permissions(Permission.VIEW_EVENTS)
  getAssignedEvents() {
    return {
      message: 'Staff assigned events',
      events: [
        { id: 1, name: 'Annual Conference 2023', date: '2023-10-15' },
        { id: 2, name: 'Tech Seminar', date: '2023-11-20' },
        { id: 3, name: 'Community Gathering', date: '2023-12-05' },
      ],
    };
  }

  @Get('events/:id')
  @Permissions(Permission.VIEW_EVENTS)
  getEventById(@Param('id') id: string) {
    return {
      message: `Staff event details for event: ${id}`,
      event: {
        id: parseInt(id),
        name: `Event ${id}`,
        date: '2023-10-15',
        location: 'Conference Center',
        attendees: 120,
      },
    };
  }

  @Get('attendees')
  @Permissions(Permission.MANAGE_ATTENDEES)
  getAttendees() {
    return {
      message: 'Staff attendees list',
      attendees: [
        { id: 1, name: 'Attendee 1', event: 'Annual Conference 2023' },
        { id: 2, name: 'Attendee 2', event: 'Tech Seminar' },
        { id: 3, name: 'Attendee 3', event: 'Annual Conference 2023' },
      ],
    };
  }

  @Put('attendees/:id')
  @Permissions(Permission.MANAGE_ATTENDEES)
  updateAttendeeInfo(@Param('id') id: string, @Body() attendeeData: any) {
    return {
      message: `Staff update attendee: ${id}`,
      attendee: { id: parseInt(id), ...attendeeData },
    };
  }

  @Get('tasks')
  @Permissions(Permission.MANAGE_TASKS)
  getAssignedTasks() {
    return {
      message: 'Staff assigned tasks',
      tasks: [
        { id: 1, title: 'Check-in attendees', status: 'In Progress' },
        { id: 2, title: 'Arrange seating', status: 'Completed' },
        { id: 3, title: 'Distribute materials', status: 'Pending' },
      ],
    };
  }

  @Put('tasks/:id')
  @Permissions(Permission.MANAGE_TASKS)
  updateTaskStatus(@Param('id') id: string, @Body() taskData: any) {
    return {
      message: `Staff update task status: ${id}`,
      task: { id: parseInt(id), ...taskData },
    };
  }
} 