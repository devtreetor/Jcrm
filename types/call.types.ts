export type CallStatus =
  | 'answered'
  | 'not_answered'
  | 'busy'
  | 'wrong_number'
  | 'interested'
  | 'not_interested';

export interface CallLog {
  id: string;
  lead_id: string;
  caller_id: string;
  status: CallStatus;
  notes: string | null;
  callback_date: string | null;
  called_at: string;
}

export interface CreateCallLogPayload {
  status: CallStatus;
  notes?: string | null;
  callback_date?: string | null;
}
