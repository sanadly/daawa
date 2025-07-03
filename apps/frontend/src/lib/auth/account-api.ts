export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  preferred_language?: string;
  phone?: string;
  avatar_url?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  is_successful: boolean;
  failure_reason?: string;
  created_at: string;
}

export interface UserActivitySummary {
  totalActivities: number;
  recentLogins: number;
  profileUpdates: number;
  passwordChanges: number;
  failedAttempts: number;
  lastActivity: string | null;
}

export interface AccountSettings {
  id: string;
  name: string;
  email: string;
  preferred_language: string;
  phone?: string;
  avatar_url?: string;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

class AccountApiService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('access_token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get current user's account settings
   */
  async getAccountSettings(): Promise<ApiResponse<{ settings: AccountSettings }>> {
    return this.request<{ settings: AccountSettings }>('/account/settings');
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<{ user: AccountSettings }>> {
    return this.request<{ user: AccountSettings }>('/account/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordData): Promise<ApiResponse<void>> {
    return this.request<void>('/account/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get user activity history
   */
  async getActivityHistory(
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<{
    activities: UserActivity[];
    pagination: { limit: number; offset: number; count: number };
  }>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    return this.request<{
      activities: UserActivity[];
      pagination: { limit: number; offset: number; count: number };
    }>(`/account/activity?${params}`);
  }

  /**
   * Get user activity summary
   */
  async getActivitySummary(): Promise<ApiResponse<{ summary: UserActivitySummary }>> {
    return this.request<{ summary: UserActivitySummary }>('/account/activity/summary');
  }

  /**
   * Deactivate current user's account
   */
  async deactivateAccount(reason?: string): Promise<ApiResponse<void>> {
    return this.request<void>('/account/deactivate', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Admin endpoints
  /**
   * Admin: Get any user's account settings
   */
  async getAdminUserSettings(userId: string): Promise<ApiResponse<{ settings: AccountSettings }>> {
    return this.request<{ settings: AccountSettings }>(`/account/admin/user/${userId}/settings`);
  }

  /**
   * Admin: Get any user's activity history
   */
  async getAdminUserActivity(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<{
    activities: UserActivity[];
    pagination: { limit: number; offset: number; count: number };
  }>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    return this.request<{
      activities: UserActivity[];
      pagination: { limit: number; offset: number; count: number };
    }>(`/account/admin/user/${userId}/activity?${params}`);
  }

  /**
   * Admin: Get any user's activity summary
   */
  async getAdminUserActivitySummary(userId: string): Promise<ApiResponse<{ summary: UserActivitySummary }>> {
    return this.request<{ summary: UserActivitySummary }>(`/account/admin/user/${userId}/activity/summary`);
  }

  /**
   * Admin: Deactivate any user's account
   */
  async adminDeactivateAccount(userId: string, reason?: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/account/admin/user/${userId}/deactivate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  /**
   * Admin: Reactivate any user's account
   */
  async adminReactivateAccount(userId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/account/admin/user/${userId}/reactivate`, {
      method: 'POST',
    });
  }

  /**
   * Admin: Clean up old activity logs
   */
  async cleanupOldActivities(daysToKeep: number = 90): Promise<ApiResponse<{ deletedCount: number }>> {
    return this.request<{ deletedCount: number }>(`/account/admin/cleanup-activities?daysToKeep=${daysToKeep}`, {
      method: 'DELETE',
    });
  }
}

export const accountApi = new AccountApiService(); 