export type UserRole = 'admin' | 'team_lead' | 'caller';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  team_lead_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateUserPayload {
  full_name: string;
  email: string;
  role: UserRole;
  team_lead_id?: string | null;
}

export interface UpdateUserPayload {
  full_name?: string;
  email?: string;
  role?: UserRole;
  team_lead_id?: string | null;
  is_active?: boolean;
}

export interface UserContext {
  id: string;
  role: UserRole;
  team_lead_id: string | null;
}
