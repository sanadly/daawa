const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'An API error occurred');
  }
  return response.json();
};

export interface QRValidationRequest {
  qr_code: string;
}

export interface QRValidationResponse {
  valid: boolean;
  guest: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    tier_name: string;
    additional_guest_count: number;
    additional_guests?: { id: string; name: string; checked_in_at?: Date }[];
    check_in_status: 'pending' | 'checked-in' | 'no-show';
  };
  event: {
    id: string;
    title: string;
    check_in_starts_at: string;
    check_in_ends_at: string;
  };
  error_code?: string;
  message?: string;
}

export interface CheckinRequest {
  guest_id: string;
  checkin_method: 'qr_code' | 'manual';
  additional_guest_ids?: string[];
  device_info?: string;
  location?: string;
  notes?: string;
}

export interface CheckinResponse {
  success: boolean;
  checkin_id: string;
  guest: {
    id: string;
    name: string;
    email: string;
    tier_name: string;
  };
  additional_guests: Array<{
    id: string;
    name: string;
  }>;
  guest_count: number;
  checkin_timestamp: string;
  message?: string;
}

export interface GuestSearchResponse {
  results: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    tier_name: string;
    check_in_status: 'pending' | 'checked-in' | 'no-show';
    additional_guest_count: number;
  }>;
  has_more: boolean;
}

export interface EventResponse {
  id: string;
  name: string;
  status: 'draft' | 'published' | 'active' | 'completed' | 'cancelled';
}

export interface CheckinStatisticsResponse {
  total_guests: number;
  checked_in_count: number;
  checkin_percentage: number;
  by_tier: Array<{
    tier_id: string;
    tier_name: string;
    total_guests: number;
    checked_in_count: number;
  }>;
  timeline: Array<{
    hour: string;
    count: number;
  }>;
}

export const checkinApi = {
  async validateQR(qrCode: string): Promise<QRValidationResponse> {
    const response = await fetch(`${API_BASE_URL}/checkin/validate-qr`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ qr_code_data: qrCode }),
    });
    return handleApiResponse(response);
  },

  async recordCheckin(data: CheckinRequest): Promise<CheckinResponse> {
    const response = await fetch(`${API_BASE_URL}/checkin/record`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  },

  async searchGuests(eventId: string, query: string): Promise<GuestSearchResponse> {
    const response = await fetch(`${API_BASE_URL}/guests/search?eventId=${eventId}&q=${query}`, {
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  async getEvents(): Promise<EventResponse[]> {
    const response = await fetch(`${API_BASE_URL}/events?status=active`, {
      headers: getAuthHeaders(),
    });
    const result = await handleApiResponse(response);
    return result; // Assuming the API returns an array of events directly
  },

  async getStatistics(eventId: string): Promise<CheckinStatisticsResponse> {
    const response = await fetch(`${API_BASE_URL}/checkin/${eventId}/statistics`, {
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },
}; 