import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const [bidRes, saleRes, rentalRes, mptRes, permanentSignRes] = await Promise.all([
      supabase.from('bid_item_numbers').select('*').eq('is_custom', false),
      supabase.from('sale_items').select('*'),
      supabase.from('rental_items').select('*'),
      supabase.from('mpt_items').select('*'),
      supabase.from('permanent_sign_items').select('*')
    ]);

    if (bidRes.error || saleRes.error || rentalRes.error || mptRes.error || permanentSignRes.error) {
      throw new Error(
        bidRes.error?.message || saleRes.error?.message || rentalRes.error?.message ||
        mptRes.error?.message || permanentSignRes.error?.message
      );
    }

    const bidItems = bidRes.data ?? [];

    const saleItems = (saleRes.data ?? []).map(i => ({
      id: i.id,
      item_number: i.item_number,
      description: i.item_description,
      uom: i.uom,
      is_custom: false,
      notes: i.notes
    }));

    const rentalItems = (rentalRes.data ?? []).map(i => ({
      id: i.id,
      item_number: i.item_number,
      description: i.item_description,
      uom: i.uom_1,
      is_custom: false,
      notes: i.notes
    }));

    const mptItems = (mptRes.data ?? []).map(i => ({
      id: i.id,
      item_number: i.item_number,
      description: i.description,
      uom: i.uom_1,
      is_custom: false,
      notes: i.notes
    }));

    const permanentSignItems = (permanentSignRes.data ?? []).map(i => ({
      id: i.id,
      item_number: i.item_number,
      description: i.description,
      uom: i.uom_1,
      is_custom: false,
      notes: i.notes
    }));

    const res = NextResponse.json({
      status: 200,
      data: {
        bidItems,
        saleItems,
        rentalItems,
        mptItems,
        permanentSignItems,
      },
    });

    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');

    return res;
  } catch (err) {
    console.error('Error fetching items:', err);
    return NextResponse.json(
      { status: 500, error: 'Internal Server Error', details: String(err) },
      { status: 500 }
    );
  }
}
