import { type SupabaseClient } from '@supabase/supabase-js';
import type { ImportBatch } from '@/types/team.types';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return (err as { message: string }).message;
  }
  return fallback;
}

export async function createImportBatch(
  supabase: SupabaseClient,
  importedBy: string,
  sourceEvent: string | null,
  totalRows: number,
  errorRows: number
): Promise<ImportBatch> {
  console.log('[createImportBatch] Starting with:', {
    importedBy,
    sourceEvent,
    totalRows,
    errorRows,
  });

  const { data, error } = await supabase
    .from('import_batches')
    .insert({
      imported_by: importedBy,
      source_event: sourceEvent,
      total_rows: totalRows,
      error_rows: errorRows,
    })
    .select()
    .single();

  if (error) {
    console.error('[createImportBatch] Supabase error:', JSON.stringify(error));
    throw new Error(
      `Failed to create import batch: ${error.message} (code: ${error.code}, details: ${error.details}, hint: ${error.hint})`
    );
  }

  console.log('[createImportBatch] Success, batch id:', data?.id);
  return data as ImportBatch;
}

export async function getImportBatches(supabase: SupabaseClient): Promise<ImportBatch[]> {
  const { data, error } = await supabase
    .from('import_batches')
    .select('*')
    .order('imported_at', { ascending: false });

  if (error) {
    console.error('[getImportBatches] Supabase error:', JSON.stringify(error));
    throw new Error(
      `Failed to fetch import batches: ${error.message} (code: ${error.code})`
    );
  }

  return data as ImportBatch[];
}
