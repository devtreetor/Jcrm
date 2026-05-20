export type CallStatus =
  | 'answered'
  | 'not_answered'
  | 'busy'
  | 'wrong_number'
  | 'interested'
  | 'not_interested';

export interface CallPhoto {
  id: string;
  call_log_id: string;
  photo_url: string;
  created_at: string;
}

export interface CallLog {
  id: string;
  lead_id: string;
  caller_id: string;
  status: CallStatus;
  notes: string | null;
  callback_date: string | null;
  called_at: string;
  photos?: CallPhoto[];
  caller?: { full_name: string; role: string };
}

export interface CreateCallLogPayload {
  status: CallStatus;
  notes?: string | null;
  callback_date?: string | null;
  photo_urls?: string[];
}
