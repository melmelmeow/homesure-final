import { adminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

function createMailTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim() : '';

    if (!email) {
      // Don't reveal if email exists or validation details
      return NextResponse.json({ ok: true });
    }

    const origin =
      process.env.APP_ORIGIN ??
      request.headers.get('origin') ??
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${origin}/auth/reset-password`,
      },
    });

    if (error || !data?.properties?.action_link) {
      console.warn('[forgot-password] generateLink error or user not found:', error?.message);
      // Return { ok: true } always to prevent email enumeration
      return NextResponse.json({ ok: true });
    }

    const resetLink = data.properties.action_link;

    const transporter = createMailTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: email,
      subject: 'Reset your Kasafide password',
      html: `
        <p>Hello,</p>
        <p>We received a request to reset your Kasafide account password.</p>
        <p>
          <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#1a56db;color:#fff;text-decoration:none;border-radius:6px;">
            Reset Password
          </a>
        </p>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
        <p>— The Kasafide Team</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[forgot-password] unexpected error:', err);
    // Return { ok: true } always
    return NextResponse.json({ ok: true });
  }
}
