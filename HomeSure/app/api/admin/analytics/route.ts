import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();

    const [usersRes, listingsRes, paymentsRes, viewingsRes] = await Promise.all([
      supabase.from('profiles').select('id, role', { count: 'exact' }),
      supabase.from('listings').select('id, status', { count: 'exact' }),
      supabase.from('payments').select('amount, status'),
      supabase.from('viewing_requests').select('id, status', { count: 'exact' }),
    ]);

    const totalRevenue = (paymentsRes.data || [])
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return NextResponse.json({
      analytics: {
        total_users: usersRes.count || 0,
        total_listings: listingsRes.count || 0,
        total_viewings: viewingsRes.count || 0,
        total_payments: paymentsRes.data?.length || 0,
        total_revenue_php: totalRevenue,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
