import { NextResponse } from 'next/server';
import { supabase, isConfigured } from '@/lib/supabase';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const updates = await request.json();

  if (!isConfigured || !supabase) {
    // Demo mode: we can't easily persist mock state across routes in standard Next.js without a singleton
    // But for this app, we'll just return success to keep the UI happy
    return NextResponse.json({ id, ...updates });
  }

  try {
    const { data, error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!isConfigured || !supabase) {
    return new Response(null, { status: 204 });
  }

  try {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return new Response(null, { status: 204 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
