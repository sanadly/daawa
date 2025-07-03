'use client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Get stored auth token
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

// Add auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export interface DashboardMetrics {
  totalEvents: number;
  pendingApproval: number;
  activeEvents: number;
  totalOrganizers: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  adminUser: string;
}

export interface AdminEvent {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  venue: string;
  status: string;
  organizerName: string;
  organizerEmail: string;
  totalCapacity: number;
  submittedAt: string;
  activatedAt?: string;
  adminNotes?: string;
}

export interface EventDetail extends AdminEvent {
  address: string;
  organizerPhone: string;
  registeredCount: number;
  checkedInCount: number;
  tiers: EventTier[];
  forms: any[];
  design: any;
  auditLog: AuditLogEntry[];
  registrationLink?: string;
  activationDate?: string;
}

export interface ActivationResult {
  success: boolean;
  event: EventDetail;
  registrationLink?: string;
  message: string;
}

export interface ActivationStatus {
  isActive: boolean;
  registrationLink?: string;
  activationDate?: Date;
}

export interface EventTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  capacity: number;
  description: string;
  availableCount: number;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  adminUser: string;
}

export interface EventsResponse {
  events: AdminEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class AdminApi {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard/metrics`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard metrics');
    }

    return response.json();
  }

  async getEvents(params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<EventsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.status) searchParams.set('status', params.status);
    if (params.search) searchParams.set('search', params.search);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());

    const url = `${API_BASE_URL}/admin/events${searchParams.toString() ? `?${searchParams}` : ''}`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }

    return response.json();
  }

  async getEventDetail(eventId: string): Promise<EventDetail> {
    const response = await fetch(`${API_BASE_URL}/admin/events/${eventId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch event detail');
    }

    return response.json();
  }

  async updateEventStatus(eventId: string, status: string, notes?: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/admin/events/${eventId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, notes }),
    });

    if (!response.ok) {
      throw new Error('Failed to update event status');
    }

    return response.json();
  }

  async updateEventNotes(eventId: string, notes: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/admin/events/${eventId}/notes`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });

    if (!response.ok) {
      throw new Error('Failed to update event notes');
    }

    return response.json();
  }

  async bulkUpdateEvents(eventIds: string[], action: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/admin/events/bulk-action`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ eventIds, action }),
    });

    if (!response.ok) {
      throw new Error('Failed to perform bulk action');
    }

    return response.json();
  }

  async getOrganizers(params: {
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<any> {
    const searchParams = new URLSearchParams();
    
    if (params.search) searchParams.set('search', params.search);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());

    const url = `${API_BASE_URL}/admin/organizers${searchParams.toString() ? `?${searchParams}` : ''}`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch organizers');
    }

    return response.json();
  }

  async getAuditLog(params: {
    entityType?: string;
    entityId?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<any> {
    const searchParams = new URLSearchParams();
    
    if (params.entityType) searchParams.set('entityType', params.entityType);
    if (params.entityId) searchParams.set('entityId', params.entityId);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());

    const url = `${API_BASE_URL}/admin/audit-log${searchParams.toString() ? `?${searchParams}` : ''}`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch audit log');
    }

    return response.json();
  }

  // New activation-specific endpoints
  async activateEvent(eventId: string, notes?: string): Promise<ActivationResult> {
    const response = await fetch(`${API_BASE_URL}/admin/events/${eventId}/activate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to activate event');
    }

    return response.json();
  }

  async deactivateEvent(eventId: string, reason?: string): Promise<ActivationResult> {
    const response = await fetch(`${API_BASE_URL}/admin/events/${eventId}/deactivate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to deactivate event');
    }

    return response.json();
  }

  async getActivationStatus(eventId: string): Promise<ActivationStatus> {
    const response = await fetch(`${API_BASE_URL}/admin/events/${eventId}/activation-status`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activation status');
    }

    return response.json();
  }
}

export const adminApi = new AdminApi(); 