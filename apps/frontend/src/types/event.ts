export interface Event {
  id: string;
  name: string;
  title?: string; // Alias for name
  description: string;
  event_type?: string; // Add event type
  start_datetime: string; // ISO 8601 date string
  start_date?: string; // Alias for start_datetime
  end_datetime: string; // ISO 8601 date string
  total_capacity: number;
  registered_count: number;
  status: EventStatus;
  
  // Platform payment fields
  platform_payment_status: PlatformPaymentStatus;
  platform_fee: number;
  platform_currency: string;
  platform_payment_reference?: string;
  platform_payment_date?: string;
  
  // Organizer info
  organizer_id: string;
  organizer?: User;
  
  // Location
  venue_name?: string;
  venue_address?: string;
  
  // Event settings and metadata (extensible)
  design_config?: DesignConfig;
  event_settings?: EventSettings;
  metadata?: Record<string, any>;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Associated data
  tiers?: Tier[];
  guests?: Guest[];
}

export interface Tier {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  capacity: number;
  registered_count: number;
  tier_type: TierType;
  
  // Time-based sales
  sale_starts_at?: string;
  sale_ends_at?: string;
  
  // Extensible configuration
  tier_settings?: TierSettings;
  access_config?: Record<string, any>;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Related data
  event?: Event;
  guests?: Guest[];
}

export interface Guest {
  id: string;
  event_id: string;
  primary_guest_id?: string;
  tier_id: string;
  name: string;
  email?: string;
  phone?: string;
  invite_status: InviteStatus;
  rsvp_status: RsvpStatus;
  checkin_status: CheckinStatus;
  checkin_timestamp?: string;
  checked_in_by_user_id?: string;
  allowed_plus_n_override?: number;
  custom_field_answers?: Record<string, any>;
  is_primary: boolean;
  notes?: string;
  dietary_restrictions?: string;
  accessibility_needs?: string;
  invite_sent_at?: string;
  rsvp_responded_at?: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  additional_guests?: Guest[];
  primary_guest?: Guest;
  event?: Event;
  tier?: Tier;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Enums
export enum EventStatus {
  DRAFT = 'draft',
  PENDING_PAYMENT = 'pending_payment', 
  PUBLISHED = 'published',
  ENDED = 'ended',
  CANCELLED = 'cancelled'
}

export enum PlatformPaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum TierType {
  FREE = 'free',
  PAID = 'paid',
  VIP = 'vip',
  SPONSOR = 'sponsor',
  STUDENT = 'student',
  EARLY_BIRD = 'early_bird'
}

export enum UserRole {
  ADMIN = 'admin',
  ORGANIZER = 'organizer',
  COMPANY_ADMIN = 'company_admin',
  COMPANY_USER = 'company_user'
}

// Settings interfaces
export interface EventSettings {
  allow_self_registration?: boolean;
  max_capacity: number;
  check_in_enabled?: boolean;
  check_in_starts_at?: string;
  check_in_ends_at?: string;
  self_registration_url?: string;
  allow_plus_n?: boolean;
  max_plus_n?: number;
  email_reminders_enabled?: boolean;
  theme_color?: string;
  custom_fields?: CustomField[];
}

export interface TierSettings {
  transfer_enabled?: boolean;
  refund_policy?: string;
  special_requirements?: string[];
  benefits?: string[];
  restrictions?: string[];
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  options?: string[]; // For select fields
}

export interface DesignConfig {
  // New flexible structure
  template_id?: string;
  custom_background_url?: string;
  layout?: 'portrait' | 'landscape';
  elements?: Array<{
    id: string; 
    text: string;
    x: number;
    y: number;
    font: string;
    size: number;
    color: string;
    bold?: boolean;
    italic?: boolean;
    align?: 'left' | 'center' | 'right';
  }>;
  qr_code_position?: { x: number; y: number; size: number };

  // @deprecated fields from old structure
  template?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  text_color?: string;
  background_color?: string;
  font_family?: string;
  font_size?: number;
  banner_image_url?: string;
  logo_url?: string;
}

export interface FormConfig {
  required_fields?: string[];
  optional_fields?: string[];
  custom_questions?: Array<{
    id: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio';
    question: string;
    options?: string[];
    required: boolean;
  }>;
}

// Create/Update DTOs
export interface CreateEventDto {
  name: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  primary_language?: string;
  default_plus_n?: number;
  venue_name?: string;
  venue_address?: string;
  timezone?: string;
  event_settings?: EventSettings;
  design_config?: DesignConfig;
  form_config?: FormConfig;
  check_in_enabled?: boolean;
  check_in_starts_at?: string;
  check_in_ends_at?: string;
  metadata?: Record<string, any>;
}

export interface UpdateEventDto {
  name?: string;
  description?: string;
  start_datetime?: string;
  end_datetime?: string;
  total_capacity?: number;
  status?: EventStatus;
  platform_payment_status?: PlatformPaymentStatus;
  platform_fee?: number;
  platform_currency?: string;
  platform_payment_reference?: string;
  event_settings?: EventSettings;
  metadata?: Record<string, any>;
}

export interface CreateTierDto {
  name: string;
  description?: string;
  price: number;
  currency: string;
  capacity: number;
  tier_type: TierType;
  sale_starts_at?: string;
  sale_ends_at?: string;
  tier_settings?: Record<string, any>;
  access_config?: Record<string, any>;
}

export interface UpdateTierDto {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  capacity?: number;
  tier_type?: TierType;
  sale_starts_at?: string;
  sale_ends_at?: string;
  tier_settings?: TierSettings;
  access_config?: Record<string, any>;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Guest status enums
export enum InviteStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export enum RsvpStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  TENTATIVE = 'tentative',
}

export enum CheckinStatus {
  NOT_CHECKED_IN = 'not_checked_in',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
}

// Guest DTOs
export interface CreateGuestDto {
  event_id: string;
  tier_id: string;
  primary_guest_id?: string;
  name: string;
  email?: string;
  phone?: string;
  invite_status?: InviteStatus;
  rsvp_status?: RsvpStatus;
  allowed_plus_n_override?: number;
  custom_field_answers?: Record<string, any>;
  is_primary?: boolean;
  notes?: string;
  dietary_restrictions?: string;
  accessibility_needs?: string;
}

export interface UpdateGuestDto {
  name?: string;
  email?: string;
  phone?: string;
  invite_status?: InviteStatus;
  rsvp_status?: RsvpStatus;
  checkin_status?: CheckinStatus;
  allowed_plus_n_override?: number;
  custom_field_answers?: Record<string, any>;
  notes?: string;
  dietary_restrictions?: string;
  accessibility_needs?: string;
}

export interface GuestQueryParams {
  event_id?: string;
  tier_id?: string;
  primary_guest_id?: string;
  invite_status?: InviteStatus;
  rsvp_status?: RsvpStatus;
  checkin_status?: CheckinStatus;
  search?: string;
  email?: string;
  primary_only?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedGuestResponse {
  guests: Guest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface GuestStats {
  totalGuests: number;
  primaryGuests: number;
  additionalGuests: number;
  acceptedRsvps: number;
  checkedIn: number;
}

// Invitation types
export interface SendInvitationDto {
  guestIds: string[];
  eventId: string;
  templateType?: 'invitation' | 'reminder';
  locale?: string;
  customMessage?: string;
  includePass?: boolean;
}

export interface InvitationStats {
  totalGuests: number;
  invitationsSent: number;
  responsesReceived: number;
  confirmedAttendees: number;
  pendingResponses: number;
}

// Check-in types
export enum CheckinMethod {
  MANUAL = 'manual',
  QR_CODE = 'qr_code',
  KIOSK = 'kiosk',
  OFFLINE_SYNC = 'offline_sync'
}

export interface CheckinRequest {
  guest_id: string;
  event_id: string;
  checkin_method: CheckinMethod;
  additional_guest_ids?: string[];
  location?: string;
  notes?: string;
}

export interface QrValidationResponse {
  is_valid: boolean;
  guest?: {
    id: string;
    name: string;
    email?: string;
    tier_name: string;
    is_primary: boolean;
    additional_guests_count: number;
    allowed_additional_guests: number;
    additional_guests?: { id: string; name: string; checked_in_at?: Date }[];
  };
  event?: {
    id: string;
    title: string;
    check_in_starts_at: Date;
    check_in_ends_at: Date;
  };
  error_message?: string;
  error_code?: 'INVALID_QR' | 'EXPIRED_QR' | 'ALREADY_CHECKED_IN' | 'EVENT_NOT_ACTIVE' | 'GUEST_NOT_FOUND';
  already_checked_in: boolean;
  previous_checkin_at?: Date;
}

export interface CheckinRecord {
  id: string;
  guest_id: string;
  guest_name: string;
  event_id: string;
  checkin_timestamp: Date;
  checkin_method: CheckinMethod;
  checked_in_by_user_id: string;
  location?: string;
  notes?: string;
}

export interface CheckinStatistics {
  total_guests: number;
  checked_in_count: number;
  checkin_percentage: number;
  by_tier: {
    tier_id: string;
    tier_name: string;
    total_guests: number;
    checked_in_count: number;
  }[];
  timeline: {
    time_slot: string;
    count: number;
  }[];
}

export interface PassTemplate {
  id: string;
  name: string;
  description: string;
  previewImageUrl: string;
  defaultLayout?: {
    elements: Array<{
      id: string;
      text: string;
      x: number;
      y: number;
      font: string;
      size: number;
      color: string;
      bold?: boolean;
      italic?: boolean;
      align?: 'left' | 'center' | 'right';
    }>;
    qr_code_position: { x: number; y: number; size: number };
  };
} 