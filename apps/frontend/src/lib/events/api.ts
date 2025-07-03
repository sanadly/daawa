const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Event {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'active' | 'completed' | 'cancelled';
  venue_name?: string;
  venue_address?: string;
  start_datetime: string;
  end_datetime: string;
  timezone: string;
  primary_language: string;
  default_plus_n: number;
  capacity_limit?: number;
  design_config?: any;
  form_config?: any;
  event_details?: any;
  check_in_enabled: boolean;
  check_in_starts_at?: string;
  check_in_ends_at?: string;
  created_at: string;
  updated_at: string;
  organizer_id: string;
  tier_id?: string;
  tiers?: Tier[];
}

export interface Tier {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  guest_limit?: number;
  price: number;
  currency: string;
  max_plus_n: number;
  is_active: boolean;
  sort_order: number;
}

export interface CreateEventData {
  name: string;
  description?: string;
  venue_name?: string;
  venue_address?: string;
  start_datetime: string;
  end_datetime: string;
  timezone?: string;
  primary_language?: string;
  default_plus_n?: number;
  capacity_limit?: number;
  design_config?: any;
  form_config?: any;
  event_details?: any;
  check_in_enabled?: boolean;
  check_in_starts_at?: string;
  check_in_ends_at?: string;
}

export interface CreateTierData {
  name: string;
  description?: string;
  guest_limit?: number;
  price?: number;
  currency?: string;
  max_plus_n?: number;
  is_active?: boolean;
  sort_order?: number;
}

class EventsAPI {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async createEvent(data: CreateEventData): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Event>(response);
  }

  async getEvents(status?: string): Promise<Event[]> {
    const url = new URL(`${API_BASE_URL}/events`);
    if (status) {
      url.searchParams.append('status', status);
    }
    
    const response = await fetch(url.toString(), {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<Event[]>(response);
  }

  async getEvent(id: string): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<Event>(response);
  }

  async updateEvent(id: string, data: Partial<CreateEventData>): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Event>(response);
  }

  async submitForActivation(id: string): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/events/${id}/submit-for-activation`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<Event>(response);
  }

  async addTier(eventId: string, data: CreateTierData): Promise<Tier> {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/tiers`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Tier>(response);
  }

  async updateTier(eventId: string, tierId: string, data: Partial<CreateTierData>): Promise<Tier> {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/tiers/${tierId}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Tier>(response);
  }

  async setDefaultTier(eventId: string, tierId: string): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/tiers/${tierId}/set-default`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<Event>(response);
  }

  async deleteEvent(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
  }
}

export const eventsAPI = new EventsAPI(); 