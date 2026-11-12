import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

function getAllowedOrigins(): string[] {
  const env = process.env.FRONTEND_ORIGINS;
  if (env) return env.split(',').map((o) => o.trim()).filter(Boolean);
  return ['*'];
}

function corsHeaders(requestOrigin: string | null): Record<string, string> {
  const allowed = getAllowedOrigins();
  const isWildcard = allowed.includes('*');
  const origin =
    isWildcard
      ? '*'
      : requestOrigin && allowed.includes(requestOrigin)
      ? requestOrigin
      : allowed[0] ?? '*';

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...(origin !== '*' ? { Vary: 'Origin' } : {}),
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('origin')),
  });
}

export async function POST(request: NextRequest) {
  const requestOrigin = request.headers.get('origin');
  const headers = corsHeaders(requestOrigin);

  try {
    const body = (await request.json()) as { access_token?: unknown; refresh_token?: unknown };
    const { access_token, refresh_token } = body;

    if (typeof access_token !== 'string' || typeof refresh_token !== 'string') {
      return NextResponse.json(
        { error: 'access_token and refresh_token are required' },
        { status: 400, headers },
      );
    }

    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.setSession({ access_token, refresh_token });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401, headers });
    }

    return NextResponse.json({ ok: true }, { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500, headers });
  }
}
