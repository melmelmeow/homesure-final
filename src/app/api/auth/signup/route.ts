import { adminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { z } from 'zod';

const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: z.enum(['buyer', 'seller']),
});

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
    const body = await request.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Validation error' },
        { status: 422 },
      );
    }

    const { email, password, firstName, lastName, phone, role } = parsed.data;

    // Step 1: Create auth user (email not confirmed yet)
    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });

    if (createError || !createData.user) {
      return NextResponse.json(
        { error: createError?.message ?? 'Failed to create user' },
        { status: 400 },
      );
    }

    const userId = createData.user.id;

    // Step 2: Insert into users table
    const { error: insertError } = await adminClient.from('users').insert({
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      phone: phone ?? null,
      role,
      account_status: 'unverified',
    });

    if (insertError) {
      // Roll back auth user creation on profile insert failure
      await adminClient.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    // Step 3: Generate confirmation magic link
    const origin =
      process.env.APP_ORIGIN ??
      request.headers.get('origin') ??
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        redirectTo: `${origin}/auth/confirm`,
      },
    });

    if (linkError || !linkData.properties?.action_link) {
      // Non-fatal: user is created, just couldn't generate confirmation link
      console.error('[signup] Failed to generate confirmation link:', linkError?.message);
      return NextResponse.json({ ok: true });
    }

    const confirmationLink = linkData.properties.action_link;

    // Step 4: Send confirmation email
    const transporter = createMailTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: email,
      subject: 'Confirm your Kasafide account',
      html: `
        <p>Hi ${firstName},</p>
        <p>Thank you for signing up for Kasafide. Please confirm your email address to get started.</p>
        <p>
          <a href="${confirmationLink}" style="display:inline-block;padding:12px 24px;background:#1a56db;color:#fff;text-decoration:none;border-radius:6px;">
            Confirm Email
          </a>
        </p>
        <p>If you didn't create this account, you can safely ignore this email.</p>
        <p>— The Kasafide Team</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
