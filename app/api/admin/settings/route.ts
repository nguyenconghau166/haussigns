import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET: Fetch all settings
export async function GET() {
  const { data, error } = await supabaseAdmin.from('ai_config').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Convert array to object for easier frontend use
  const settings = data.reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});

  return NextResponse.json({ settings });
}

// POST: Update settings
export async function POST(request: Request) {
  try {
    const body = await request.json(); // Expect { key: value, key2: value2 }
    
    // Loop through keys and upsert
    for (const [key, value] of Object.entries(body)) {
      await supabaseAdmin
        .from('ai_config')
        .upsert({ key, value: String(value) });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
