import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { importLeadRowSchema } from '@/lib/schemas/import.schema';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { createImportBatch } from '@/lib/db/import';
import { batchInsertLeads } from '@/lib/db/leads';
import type { ImportRowError } from '@/types/team.types';

export async function POST(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');

    console.log('[POST /api/leads/import] role:', role, 'userId:', userId);

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const sourceEvent = formData.get('source_event') as string | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'A CSV or XLSX file is required. Provide a file field in multipart/form-data.' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const isXlsx = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCsv = fileName.endsWith('.csv');

    if (!isXlsx && !isCsv) {
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload a .csv or .xlsx file.' },
        { status: 400 }
      );
    }

    const maxRows = parseInt(process.env.IMPORT_MAX_ROWS ?? '777', 10);
    const chunkSize = parseInt(process.env.IMPORT_CHUNK_SIZE ?? '500', 10);

    let rows: Record<string, string>[];

    if (isXlsx) {
      // Parse XLSX/XLS file
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return NextResponse.json(
          { error: 'The uploaded Excel file has no sheets.' },
          { status: 400 }
        );
      }
      const sheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      // Normalize headers to match CSV convention: lowercase, underscores
      rows = rawRows.map((row) => {
        const normalized: Record<string, string> = {};
        for (const [key, value] of Object.entries(row)) {
          const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
          normalized[normalizedKey] = String(value ?? '').trim();
        }
        return normalized;
      });
    } else {
      // Parse CSV file
      const csvText = await file.text();
      const parseResult = Papa.parse<Record<string, string>>(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().toLowerCase().replace(/\s+/g, '_'),
      });
      rows = parseResult.data;
    }

    if (rows.length > maxRows) {
      return NextResponse.json(
        {
          error: `File exceeds maximum of ${maxRows} rows. Please split your import and try again.`,
        },
        { status: 400 }
      );
    }

    const validRows: Array<{
      school_name: string;
      location: string;
      city: string;
      state: string;
      board: string;
      principal_phone: string;
      chairman_phone: string;
      import_batch_id: string;
    }> = [];
    const errors: ImportRowError[] = [];

    const supabase = getSupabaseServiceClient();

    const batch = await createImportBatch(
      supabase,
      userId,
      sourceEvent,
      rows.length,
      0
    );

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowParsed = importLeadRowSchema.safeParse(row);

      if (!rowParsed.success) {
        const reasons = rowParsed.error.errors.map((e) => e.message).join('; ');
        errors.push({ row: i + 2, reason: reasons });
        continue;
      }

      validRows.push({
        school_name: rowParsed.data.school_name,
        location: rowParsed.data.location || '',
        city: rowParsed.data.city || '',
        state: rowParsed.data.state || '',
        board: rowParsed.data.board || '',
        principal_phone: rowParsed.data.principal_phone || '',
        chairman_phone: rowParsed.data.chairman_phone || '',
        import_batch_id: batch.id,
      });
    }

    let totalImported = 0;
    for (let i = 0; i < validRows.length; i += chunkSize) {
      const chunk = validRows.slice(i, i + chunkSize);
      const inserted = await batchInsertLeads(supabase, chunk);
      totalImported += inserted;
    }

    if (errors.length > 0) {
      await supabase
        .from('import_batches')
        .update({ error_rows: errors.length })
        .eq('id', batch.id);
    }

    return NextResponse.json({
      data: {
        batch_id: batch.id,
        total: rows.length,
        imported: totalImported,
        errors,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Import failed';
    console.error('POST /api/leads/import error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
