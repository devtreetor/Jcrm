import { type SupabaseClient } from '@supabase/supabase-js';

interface AssignmentGuardParams {
  assignedTlId: string | null;
  assignedClId: string | null;
  requestingUserRole: string;
  requestingUserTlId: string | null;
  supabase: SupabaseClient;
}

interface AssignmentGuardSuccess {
  valid: true;
}

interface AssignmentGuardFailure {
  valid: false;
  status: 400 | 403;
  error: string;
}

type AssignmentGuardResult = AssignmentGuardSuccess | AssignmentGuardFailure;

export async function assignmentGuard(
  params: AssignmentGuardParams
): Promise<AssignmentGuardResult> {
  const { assignedTlId, assignedClId, requestingUserRole, requestingUserTlId, supabase } = params;

  try {
    if (requestingUserRole === 'admin') {
      if (assignedClId && !assignedTlId) {
        return {
          valid: false,
          status: 400,
          error: 'Team lead must be assigned before assigning a sales executive.',
        };
      }

      if (assignedClId && assignedTlId) {
        const { data: caller, error: callerError } = await supabase
          .from('users')
          .select('team_lead_id, full_name')
          .eq('id', assignedClId)
          .single();

        if (callerError || !caller) {
          return {
            valid: false,
            status: 400,
            error: 'Sales Executive not found.',
          };
        }

        if (caller.team_lead_id !== assignedTlId) {
          const { data: tl } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', assignedTlId)
            .single();

          const tlName = tl?.full_name ?? 'the assigned team lead';
          const callerName = caller.full_name ?? 'This caller';

          return {
            valid: false,
            status: 403,
            error: `Sales Executive ${callerName} belongs to a different team lead. Only sales executives under ${tlName} can be assigned to this lead.`,
          };
        }
      }

      return { valid: true };
    }

    if (requestingUserRole === 'team_lead') {
      if (assignedClId && !assignedTlId) {
        return {
          valid: false,
          status: 400,
          error: 'Team lead must be assigned before assigning a sales executive.',
        };
      }

      if (assignedClId) {
        const { data: caller, error: callerError } = await supabase
          .from('users')
          .select('team_lead_id, full_name')
          .eq('id', assignedClId)
          .single();

        if (callerError || !caller) {
          return {
            valid: false,
            status: 400,
            error: 'Sales Executive not found.',
          };
        }

        if (caller.team_lead_id !== requestingUserTlId && caller.team_lead_id !== assignedTlId) {
          return {
            valid: false,
            status: 403,
            error: `Sales Executive ${caller.full_name} belongs to a different team lead. You can only assign sales executives from your own team.`,
          };
        }
      }

      return { valid: true };
    }

    return {
      valid: false,
      status: 403,
      error: 'Sales Executives are not allowed to assign leads.',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Assignment validation failed';
    return {
      valid: false,
      status: 400,
      error: message,
    };
  }
}
