import { type SupabaseClient } from '@supabase/supabase-js';
import type { ImportBatch } from '@/types/team.types';

export async function createImportBatch(
  supabase: SupabaseClient,
  importedBy: string,
  sourceEvent: string | null,
  totalRows: number,
  errorRows: number
): Promise<ImportBatch> {
  try {
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

    if (error) throw error;
    return data as ImportBatch;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create import batch';
    throw new Error(message);
  }
}

export async function getImportBatches(supabase: SupabaseClient): Promise<ImportBatch[]> {
  try {
    const { data, error } = await supabase
      .from('import_batches')
      .select('*')
      .order('imported_at', { ascending: false });

    if (error) throw error;
    return data as ImportBatch[];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch import batches';
    throw new Error(message);
  }
}
