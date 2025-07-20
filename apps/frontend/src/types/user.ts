export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  account_type: 'individual' | 'company';
  is_active: boolean;
  last_login_at?: string;
  avatar_url?: string;
  preferred_language?: string;
  company_name?: string;
} 