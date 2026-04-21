export interface Team {
  id: string;
  name: string;
  team_lead_id: string;
  created_at: string;
}

export interface CreateTeamPayload {
  name: string;
  team_lead_id: string;
}

export interface ImportBatch {
  id: string;
  imported_by: string;
  source_event: string | null;
  total_rows: number;
  error_rows: number;
  imported_at: string;
}

export interface ImportResult {
  batch_id: string;
  total: number;
  imported: number;
  errors: ImportRowError[];
}

export interface ImportRowError {
  row: number;
  reason: string;
}

export interface InsightsData {
  total_calls: number;
  demos_booked: number;
  meetings_fixed: number;
  meetings_done: number;
  negotiations: number;
  proposals_sent: number;
  won: number;
  lost: number;
}

export type InsightsRange = 'day' | 'month' | '6m';
