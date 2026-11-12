import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

interface RequestBody {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

const ADMIN_ROLES = ['admin', 'superadmin', 'super_duper_admin'];

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Auth check
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check — admin/superadmin only
    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Could not verify role.' }, { status: 403 });
    }

    if (!ADMIN_ROLES.includes(profile.role as string)) {
      return NextResponse.json({ error: 'Forbidden: admin role required.' }, { status: 403 });
    }

    const body: RequestBody = await request.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html.' },
        { status: 400 }
      );
    }

    const smtpPort = Number(process.env.SMTP_PORT ?? 587);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Email Notification] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
