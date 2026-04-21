import { NextRequest, NextResponse } from 'next/server';
import { updateStageSchema, updateMultiStageSchema } from '@/lib/schemas/lead.schema';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getLeadById, updateLeadStage } from '@/lib/db/leads';
import { STAGE_LABELS } from '@/lib/constants';
import type { LeadStage } from '@/types/lead.types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');

    if (!userId || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Determine if this is a multi-stage or single-stage request
    const isMulti = Array.isArray(body.stages);

    const supabase = getSupabaseServiceClient();
    const lead = await getLeadById(supabase, params.id);

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (role === 'team_lead' && lead.assigned_tl_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (role === 'caller' && lead.assigned_cl_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (isMulti) {
      // Multi-stage: process each stage transition sequentially
      const parsed = updateMultiStageSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const stages = parsed.data.stages as string[];
      let currentStage = lead.stage;
      let updatedLead = lead;

      for (let i = 0; i < stages.length; i++) {
        const targetStage = stages[i];

        if (targetStage === currentStage) {
          continue;
        }

        updatedLead = await updateLeadStage(
          supabase,
          params.id,
          targetStage,
          userId,
          currentStage
        );

        // Auto-generate a call log for each transition
        const fromLabel = STAGE_LABELS[currentStage as LeadStage] || currentStage;
        const toLabel = STAGE_LABELS[targetStage as LeadStage] || targetStage;

        const { error: callLogError } = await supabase
          .from('call_logs')
          .insert({
            lead_id: params.id,
            caller_id: userId,
            status: 'answered',
            notes: `Lead moved from ${fromLabel} → ${toLabel}`,
          });

        if (callLogError) {
          console.error('[MULTI-STAGE] Call log insert failed:', callLogError.message);
        }

        currentStage = targetStage as LeadStage;
      }

      return NextResponse.json({ data: updatedLead });
    } else {
      // Single-stage: original behavior
      const parsed = updateStageSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      if (lead.stage === parsed.data.stage) {
        return NextResponse.json(
          { error: `Lead is already at stage "${parsed.data.stage}"` },
          { status: 400 }
        );
      }

      const fromStage = lead.stage;
      const toStage = parsed.data.stage;

      const updated = await updateLeadStage(
        supabase,
        params.id,
        toStage,
        userId,
        fromStage
      );

      // Auto-generate a call log for the stage change
      const fromLabel = STAGE_LABELS[fromStage as LeadStage] || fromStage;
      const toLabel = STAGE_LABELS[toStage as LeadStage] || toStage;

      const { error: callLogError } = await supabase
        .from('call_logs')
        .insert({
          lead_id: params.id,
          caller_id: userId,
          status: 'answered',
          notes: `Lead moved from ${fromLabel} → ${toLabel}`,
        });

      if (callLogError) {
        console.error('Failed to auto-create call log for stage change:', callLogError.message);
      }

      return NextResponse.json({ data: updated });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update stage';
    console.error('PATCH /api/leads/[id]/stage error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
