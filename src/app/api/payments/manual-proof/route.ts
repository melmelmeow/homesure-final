import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();

    const propertyId = formData.get('propertyId') as string | null;
    const purpose = formData.get('purpose') as string | null;
    const period = formData.get('period') as string | null;
    const dueDate = formData.get('dueDate') as string | null;
    const depositMonths = formData.get('depositMonths')
      ? Number(formData.get('depositMonths'))
      : null;
    const method = formData.get('method') as string | null;
    const reference = formData.get('reference') as string | null;
    const proofFile = formData.get('proof') as File | null;

    if (!propertyId || !purpose || !method || !proofFile) {
      return NextResponse.json(
        { error: 'propertyId, purpose, method and proof are required' },
        { status: 400 },
      );
    }

    const userId = user.id;
    const filename = proofFile.name;
    const storagePath = `${userId}/${Date.now()}-${filename}`;

    // Upload proof file to Supabase storage
    const arrayBuffer = await proofFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await adminClient.storage
      .from('payment-proofs')
      .upload(storagePath, buffer, {
        contentType: proofFile.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Fetch property price — never trust client amount
    const { data: property, error: propError } = await adminClient
      .from('properties')
      .select('price')
      .eq('id', propertyId)
      .single();

    if (propError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const amount = property.price as number;

    // Insert payment row
    const { data: payment, error: insertError } = await adminClient
      .from('payments')
      .insert({
        buyer_id: userId,
        property_id: propertyId,
        amount,
        purpose,
        period: period ?? null,
        due_date: dueDate ?? null,
        deposit_months: depositMonths,
        status: 'pending_confirmation',
        method,
        reference_number: reference ?? null,
        proof_path: storagePath,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ payment });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
