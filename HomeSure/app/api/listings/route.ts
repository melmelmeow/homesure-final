import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const propertyType = searchParams.get('type');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const status = searchParams.get('status') || 'available';

    const supabase = createAdminClient();
    let query = supabase
      .from('listings')
      .select('*, seller:seller_id(id, full_name, email, phone, avatar_url, is_verified)')
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }
    if (location) {
      query = query.ilike('location', `%${location}%`);
    }
    if (propertyType) {
      query = query.eq('property_type', propertyType);
    }
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ listings: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      seller_id,
      title,
      description,
      property_type = 'apartment',
      price,
      location,
      address,
      bedrooms = 1,
      bathrooms = 1,
      area_sqm,
      images = [],
      amenities = [],
    } = body;

    if (!seller_id || !title || !price || !location || !address) {
      return NextResponse.json(
        { error: 'seller_id, title, price, location, and address are required.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('listings')
      .insert([
        {
          seller_id,
          title,
          description,
          property_type,
          price,
          location,
          address,
          bedrooms,
          bathrooms,
          area_sqm,
          images,
          amenities,
          status: 'available',
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Listing created successfully', listing: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
