export * from './event';
import { User, EventStatus, PlatformPaymentStatus } from './event';

// Admin and dashboard types
export interface AdminStats {
  totalEvents: number;
  totalUsers: number;
  paidEvents: number;
  totalRevenue: number;
  pendingPayments: number;
  activeEvents: number;
}

export interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalGuests: number;
  checkedIn: number;
  pendingPayments: number;
  totalRevenue: number;
}

export interface RecentActivity {
  id: string;
  type: 'event_created' | 'guest_registered' | 'event_published' | 'checkin_completed' | 'payment_received';
  message: string;
  timestamp: string;
  user?: string;
  eventId?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

// Form validation types
export interface FormErrors {
  [key: string]: string | undefined;
}

// UI Component types
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TableColumn<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  render?: (value: any, record: T) => React.ReactNode;
}

// Filter and search types
export interface EventFilters {
  status?: EventStatus[];
  payment_status?: PlatformPaymentStatus[];
  date_from?: string;
  date_to?: string;
  search?: string;
  organizer_id?: string;
}

export interface GuestFilters {
  event_id?: string;
  tier_id?: string;
  is_primary?: boolean;
  checked_in?: boolean;
  search?: string;
} 