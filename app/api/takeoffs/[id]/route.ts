import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type RelatedTakeoffSummary = {
  id: string;
  title: string;
  work_type: string;
  work_order_id: string | null;
  work_order_number: string | null;
  is_pickup: boolean;
  parent_takeoff_id: string | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('API: Fetching takeoff with ID:', id);

    if (!id) {
      console.log('API: No takeoff ID provided');
      return NextResponse.json({ error: 'Takeoff ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('takeoffs_l')
      .select(`
        id,
        title,
        work_type,
        is_pickup,
        parent_takeoff_id,
        status,
        created_at,
        updated_at,
        install_date,
        pickup_date,
        needed_by_date,
        is_multi_day_job,
        end_date,
        work_order_number,
        work_order_id,
        job_id,
        contracted_or_additional,
        priority,
        notes,
        crew_notes,
        build_shop_notes,
        pm_notes,
        active_sections,
        sign_rows,
        default_sign_material,
        active_permanent_items,
        permanent_sign_rows,
        permanent_entry_rows,
        default_permanent_sign_material,
        vehicle_items,
        rolling_stock_items,
        additional_items
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('API: Error fetching takeoff:', error);
      console.error('API: Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json({ error: 'Takeoff not found' }, { status: 404 });
    }

    // Auto-backfill work_order_id/work_order_number if missing but work orders exist
    // (Older records may have work_orders_l rows without the takeoff header fields being populated)
    if (!data.work_order_id) {
      const { data: latestWO, error: latestWOError } = await supabase
        .from('work_orders_l')
        .select('id, wo_number')
        .eq('takeoff_id', id)
        .order('wo_number', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (latestWOError) {
        console.error('API: Error looking up latest work order for takeoff:', latestWOError);
      } else if (latestWO?.id) {
        const backfill: { work_order_id: string; work_order_number?: string } = {
          work_order_id: latestWO.id,
        };

        // takeoffs_l.work_order_number is TEXT in the current schema
        if (latestWO.wo_number !== null && latestWO.wo_number !== undefined) {
          backfill.work_order_number = String(latestWO.wo_number);
        }

        const { error: backfillError } = await supabase
          .from('takeoffs_l')
          .update(backfill)
          .eq('id', id);

        if (backfillError) {
          console.error('API: Failed to backfill takeoff work order fields:', backfillError);
        } else {
          data.work_order_id = latestWO.id;
          if (backfill.work_order_number) {
            data.work_order_number = backfill.work_order_number;
          }
        }
      }
    }

    let parentTakeoff: RelatedTakeoffSummary | null = null;
    let pickupTakeoff: RelatedTakeoffSummary | null = null;

    if (data.parent_takeoff_id) {
      const { data: parent } = await supabase
        .from('takeoffs_l')
        .select('id, title, work_type, work_order_id, work_order_number, is_pickup, parent_takeoff_id')
        .eq('id', data.parent_takeoff_id)
        .maybeSingle();
      parentTakeoff = parent || null;
    }

    if (!data.is_pickup) {
      const { data: child } = await supabase
        .from('takeoffs_l')
        .select('id, title, work_type, work_order_id, work_order_number, is_pickup, parent_takeoff_id')
        .eq('parent_takeoff_id', id)
        .eq('is_pickup', true)
        .maybeSingle();
      pickupTakeoff = child || null;
    }

    console.log('API: Successfully fetched takeoff:', data);
    return NextResponse.json({
      ...data,
      parent_takeoff: parentTakeoff,
      pickup_takeoff: pickupTakeoff,
    });
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
