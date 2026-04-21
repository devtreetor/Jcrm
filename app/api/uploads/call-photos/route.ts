import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');

    if (!userId || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (role !== 'caller' && role !== 'admin') {
      return NextResponse.json(
        { error: 'Only Sales Executives and admins can upload call photos' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('photos') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 photos per upload' }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only images are allowed.` },
          { status: 400 }
        );
      }

      // Max 5MB per file
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Maximum 5MB per photo.` },
          { status: 400 }
        );
      }

      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${userId}/${timestamp}_${sanitizedName}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from('call-photos')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError.message);
        return NextResponse.json(
          { error: `Failed to upload ${file.name}: ${uploadError.message}` },
          { status: 500 }
        );
      }

      const { data: urlData } = supabase.storage
        .from('call-photos')
        .getPublicUrl(filePath);

      uploadedUrls.push(urlData.publicUrl);
    }

    return NextResponse.json({ data: { urls: uploadedUrls } }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to upload photos';
    console.error('POST /api/uploads/call-photos error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
