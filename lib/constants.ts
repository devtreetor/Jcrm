import type { LeadStage } from '@/types/lead.types';
import type { CallStatus } from '@/types/call.types';
import type { UserRole } from '@/types/user.types';

export const ROLES: readonly UserRole[] = ['admin', 'team_lead', 'caller'] as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  team_lead: 'Team Lead',
  caller: 'Sales Executive',
};

export const LEAD_STAGES: readonly LeadStage[] = [
  'uncontacted',
  'contacted',
  'interested',
  'demo_booked',
  'meeting_fixed',
  'meeting_done',
  'negotiation',
  'proposal_sent',
  'won',
  'lost',
] as const;

export const STAGE_LABELS: Record<LeadStage, string> = {
  uncontacted: 'Uncontacted',
  contacted: 'Contacted',
  interested: 'Interested',
  demo_booked: 'Demo Booked',
  meeting_fixed: 'Meeting Fixed',
  meeting_done: 'Meeting Done',
  negotiation: 'Negotiation Stage',
  proposal_sent: 'Proposal Sent',
  won: 'Won',
  lost: 'Lost',
};

export const STAGE_COLORS: Record<LeadStage, string> = {
  uncontacted: '#94a3b8',
  contacted: '#1270E3',
  interested: '#a78bfa',
  demo_booked: '#E24E59',
  meeting_fixed: '#06b6d4',
  meeting_done: '#0ea5e9',
  negotiation: '#8b5cf6',
  proposal_sent: '#f59e0b',
  won: '#22c55e',
  lost: '#ef4444',
};

export const CALL_STATUSES: readonly CallStatus[] = [
  'answered',
  'not_answered',
  'busy',
  'wrong_number',
  'interested',
  'not_interested',
] as const;

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  answered: 'Answered',
  not_answered: 'Not Answered',
  busy: 'Busy',
  wrong_number: 'Wrong Number',
  interested: 'Interested',
  not_interested: 'Not Interested',
};

export const CALL_STATUS_COLORS: Record<CallStatus, string> = {
  answered: '#22c55e',
  not_answered: '#94a3b8',
  busy: '#f59e0b',
  wrong_number: '#ef4444',
  interested: '#E24E59',
  not_interested: '#64748b',
};

export const ROUTES = {
  LOGIN: '/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_LEADS: '/admin/leads',
  ADMIN_USERS: '/admin/users',
  ADMIN_IMPORT: '/admin/import',
  TL_DASHBOARD: '/tl/dashboard',
  CALLER_DASHBOARD: '/caller/dashboard',
  CALLER_LEADS: '/caller/leads',
} as const;

export const API_ROUTES = {
  AUTH_LOGIN: '/api/auth/login',
  AUTH_CHANGE_PASSWORD: '/api/auth/change-password',
  USERS: '/api/users',
  TEAMS: '/api/teams',
  LEADS: '/api/leads',
  LEADS_IMPORT: '/api/leads/import',
  INSIGHTS: '/api/insights',
  INSIGHTS_CALLS: '/api/insights/calls',
  INSIGHTS_LEADS: '/api/insights/leads',
  UPLOAD_CALL_PHOTOS: '/api/uploads/call-photos',
} as const;
