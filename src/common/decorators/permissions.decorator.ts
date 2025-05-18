import { SetMetadata } from '@nestjs/common';

export enum Permission {
  // Admin permissions
  MANAGE_USERS = 'MANAGE_USERS',
  CONFIGURE_SYSTEM = 'CONFIGURE_SYSTEM',
  VIEW_LOGS = 'VIEW_LOGS',
  
  // Organizer permissions
  MANAGE_EVENTS = 'MANAGE_EVENTS',
  MANAGE_ATTENDEES = 'MANAGE_ATTENDEES',
  MANAGE_STAFF = 'MANAGE_STAFF',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  
  // Staff permissions
  VIEW_EVENTS = 'VIEW_EVENTS',
  MANAGE_TASKS = 'MANAGE_TASKS',

  // User profile-related permissions
  READ_PROFILE = 'read_profile',
  UPDATE_PROFILE = 'update_profile',
  DELETE_PROFILE = 'delete_profile',

  // Event-related permissions
  CREATE_EVENT = 'create_event',
  READ_EVENT = 'read_event',
  UPDATE_EVENT = 'update_event',
  DELETE_EVENT = 'delete_event',

  // Attendee management
  VIEW_ATTENDEES = 'view_attendees',
  CHECK_IN_ATTENDEE = 'check_in_attendee',

  // Reporting
  VIEW_REPORTS = 'view_reports',
  EXPORT_REPORTS = 'export_reports',

  // Support permissions
  CREATE_SUPPORT_TICKET = 'create_support_ticket',
  VIEW_SUPPORT_TICKETS = 'view_support_tickets',
  UPDATE_SUPPORT_TICKET = 'update_support_ticket',
  DELETE_SUPPORT_TICKET = 'delete_support_ticket',

  // Send notifications
  SEND_NOTIFICATIONS = 'send_notifications',
}

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify which permissions are required for a route or controller
 */
export const Permissions = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions); 