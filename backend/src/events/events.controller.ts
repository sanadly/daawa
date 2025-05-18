import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';

// Define a type for the authenticated request
interface RequestWithUser extends Request {
  user: {
    userId: number;
    username: string;
    role: Role;
  };
}

// Sample DTO for event creation/update
class EventDto {
  title!: string;
  description!: string;
  dateTime!: Date;
  location!: string;
}

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard) // Apply both guards to all routes
export class EventsController {
  // Public event listing - available to anyone with a JWT token
  @Get()
  async getAllEvents() {
    // Simulate database fetch with await
    const events = await Promise.resolve([
      {
        id: 1,
        title: 'Community Gathering',
        dateTime: new Date(),
        location: 'Main Hall',
      },
      {
        id: 2,
        title: 'Weekly Study Circle',
        dateTime: new Date(),
        location: 'Room 102',
      },
    ]);
    
    return {
      message: 'List of all events',
      events,
    };
  }

  // View event details - available to any authenticated user
  @Get(':id')
  async getEventById(@Param('id') id: string) {
    // Simulate database fetch with await
    const event = await Promise.resolve({
      id: parseInt(id),
      title: 'Community Gathering',
      description: 'A weekly gathering for the community',
      dateTime: new Date(),
      location: 'Main Hall',
      organizerId: 3,
    });
    
    return {
      message: `Event details for ID: ${id}`,
      event,
    };
  }

  // Create events - restricted to ORGANIZER and ADMIN
  @Post()
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async createEvent(
    @Body() eventDto: EventDto,
    @Request() req: RequestWithUser,
  ) {
    // Simulate database insert with await
    const createdEvent = await Promise.resolve({
      id: 3,
      ...eventDto,
      organizerId: req.user.userId,
    });
    
    return {
      message: 'Event created successfully',
      createdBy: req.user.username,
      role: req.user.role,
      event: createdEvent,
    };
  }

  // Update events - restricted to ORGANIZER and ADMIN
  @Put(':id')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  async updateEvent(
    @Param('id') id: string,
    @Body() eventDto: EventDto,
    @Request() req: RequestWithUser,
  ) {
    // Simulate database update with await
    const updatedEvent = await Promise.resolve({
      id: parseInt(id),
      ...eventDto,
      organizerId: req.user.userId,
    });
    
    return {
      message: `Event with ID: ${id} updated successfully`,
      updatedBy: req.user.username,
      role: req.user.role,
      event: updatedEvent,
    };
  }

  // Delete events - restricted to ADMIN only
  @Delete(':id')
  @Roles(Role.ADMIN)
  async deleteEvent(@Param('id') id: string, @Request() req: RequestWithUser) {
    // Simulate database delete with await
    await Promise.resolve(true); // Simulate successful deletion
    
    return {
      message: `Event with ID: ${id} deleted successfully`,
      deletedBy: req.user.username,
      role: req.user.role,
    };
  }

  // Staff-only endpoint to manage event registrations
  @Get(':id/registrations')
  @Roles(Role.STAFF, Role.ORGANIZER, Role.ADMIN)
  async getEventRegistrations(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    // Simulate database fetch with await
    const registrations = await Promise.resolve([
      { userId: 101, name: 'John Doe', email: 'john@example.com' },
      { userId: 102, name: 'Jane Smith', email: 'jane@example.com' },
    ]);
    
    return {
      message: `Registrations for event ID: ${id}`,
      accessedBy: req.user.username,
      role: req.user.role,
      registrations,
    };
  }
} 