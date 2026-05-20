import { NextResponse } from 'next/server';
import { supabase, isConfigured } from '@/lib/supabase';

// Mock data for demo mode
let mockTodos = [
  {
    id: "1",
    title: "Connect Supabase to save real data (Next.js Backend)",
    completed: false,
    created_at: new Date().toISOString()
  },
  {
    id: "2",
    title: "Add your first task above",
    completed: true,
    created_at: new Date().toISOString()
  },
];

export async function GET() {
  if (!isConfigured || !supabase) {
    return NextResponse.json(mockTodos);
  }

  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
       if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
         return NextResponse.json({ 
           error: "Authentication Failed", 
           details: "Supabase rejected the API key. Please check your credentials." 
         }, { status: 401 });
       }
       if (error.message?.includes('relation "todos" does not exist')) {
         return NextResponse.json({
           error: "Table Not Found",
           details: "The table 'todos' does not exist.",
           sql: "CREATE TABLE todos (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, title text, completed boolean DEFAULT false, created_at timestamptz DEFAULT now());"
         }, { status: 404 });
       }
       return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { title } = await request.json();

  if (!isConfigured || !supabase) {
    const newTodo = {
      id: Math.random().toString(36).substring(7),
      title,
      completed: false,
      created_at: new Date().toISOString()
    };
    mockTodos = [newTodo, ...mockTodos];
    return NextResponse.json(newTodo, { status: 201 });
  }

  try {
    const { data, error } = await supabase
      .from('todos')
      .insert([{ title, completed: false }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
