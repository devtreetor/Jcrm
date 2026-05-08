export type LeadStage =
  | 'uncontacted'
  | 'contacted'
  | 'interested'
  | 'demo_booked'
  | 'meeting_fixed'
  | 'meeting_done'
  | 'negotiation'
  | 'proposal_sent'
  | 'won'
  | 'lost';

export interface Lead {
  id: string;
  school_name: string;
  location: string | null;
  city: string | null;
  state: string | null;
  board: string | null;
  principal_phone: string | null;
  chairman_phone: string | null;
  principal_name: string | null;
  chairman_name: string | null;
  stage: LeadStage;
  assigned_tl_id: string | null;
  assigned_cl_id: string | null;
  import_batch_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadPayload {
  school_name: string;
  location?: string | null;
  city?: string | null;
  state?: string | null;
  board?: string | null;
  principal_phone?: string | null;
  chairman_phone?: string | null;
  principal_name?: string | null;
  chairman_name?: string | null;
  stage?: LeadStage;
  assigned_tl_id?: string | null;
  assigned_cl_id?: string | null;
  import_batch_id?: string | null;
}

export interface AssignLeadPayload {
  assigned_tl_id: string | null;
  assigned_cl_id: string | null;
}

export interface UpdateLeadPayload {
  school_name?: string;
  location?: string | null;
  city?: string | null;
  state?: string | null;
  board?: string | null;
  principal_phone?: string | null;
  chairman_phone?: string | null;
  principal_name?: string | null;
  chairman_name?: string | null;
}

export interface UpdateStagePayload {
  stage: LeadStage;
}

export interface LeadFilters {
  stage?: LeadStage;
  assigned_tl_id?: string;
  assigned_cl_id?: string;
  city?: string;
  state?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface StageHistory {
  id: string;
  lead_id: string;
  changed_by: string;
  from_stage: string;
  to_stage: string;
  changed_at: string;
}
