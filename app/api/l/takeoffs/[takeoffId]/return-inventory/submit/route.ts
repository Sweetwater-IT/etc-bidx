import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateReturnTakeoffPdf } from '@/utils/generateReturnTakeoffPdf';

export async function POST(
  request: NextRequest,
  { params }: { params: { takeoffId: string } }
) {
  try {
    const takeoffId = params.takeoffId;
    const { jobInfo } = await request.json();

    // First, fetch all items to build PDF data
    const { data: items, error: fetchError } = await supabase
      .from("takeoff_items")
      .select("id, product_name, category, quantity, return_condition, return_details, damage_photos, notes")
      .eq("takeoff_id", takeoffId)
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error('Error fetching items for PDF:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items found' }, { status: 404 });
    }

    // Build PDF data
    const pdfItems = items.map((item) => {
      const comps = getComponents(item);
      const d = (item.return_details as Record<string, string>) || {};
      const p = (item.damage_photos as Record<string, string>) || {};
      return {
        product_name: item.product_name,
        category: item.category,
        quantity: item.quantity,
        components: comps.map((c) => ({
          key: c,
          label: COMP_LABELS[c],
          condition: d[c] || "ok",
          photoUrl: p[c] || undefined,
        })),
      };
    });

    // Generate PDF
    await generateReturnTakeoffPdf({
      title: jobInfo?.title || "Pickup Return",
      workType: jobInfo?.workType || "",
      projectName: jobInfo?.projectName,
      etcJobNumber: jobInfo?.etcJobNumber,
      etcBranch: jobInfo?.etcBranch,
      etcProjectManager: jobInfo?.etcProjectManager,
      customerName: jobInfo?.customerName,
      customerJobNumber: jobInfo?.customerJobNumber,
      projectOwner: jobInfo?.projectOwner,
      county: jobInfo?.county,
      installDate: jobInfo?.installDate,
      pickupDate: jobInfo?.pickupDate,
      customerPM: jobInfo?.customerPM,
      assignedTo: jobInfo?.assignedTo,
      contractedOrAdditional: jobInfo?.contractedOrAdditional,
      items: pdfItems,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting return inventory:', error);
    return NextResponse.json({ error: 'Failed to submit return inventory' }, { status: 500 });
  }
}

// Helper functions (same as in ReturnInventoryCard)
const COMP_LABELS: Record<string, string> = {
  sign: "Sign",
  structure: "Structure",
  lights: "Lights",
};

function getComponents(item: any): string[] {
  const name = item.product_name.toUpperCase();
  const category = item.category.toUpperCase();
  const comps: string[] = [];

  let meta: Record<string, any> = {};
  try { meta = JSON.parse(item.notes || "{}"); } catch { /* */ }

  const isAdditionalOrEquip =
    category === "ADDITIONAL ITEMS" || category === "VEHICLES" || category === "ROLLING STOCK";

  if (isAdditionalOrEquip || name.includes("VERTICAL PANEL") || name.includes("HIP VERTICAL") || name.includes("SAND BAG")) {
    comps.push("sign");
    return comps;
  }

  if (name.includes("TYPE III") || name.includes("TYPE 3") || name.includes("BARRICADE")) {
    comps.push("structure");
    comps.push("lights");
    return comps;
  }

  comps.push("sign");

  const hasStruct = meta.structureType && meta.structureType !== "" && meta.structureType !== "Loose";
  if (hasStruct) comps.push("structure");

  const hasLights = meta.bLights && meta.bLights !== "none" && meta.bLights !== "";
  if (hasLights) comps.push("lights");

  return comps;
}