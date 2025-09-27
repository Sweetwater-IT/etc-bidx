import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { mapDbQuoteItemToQuoteItem } from "../route";

// --- PATCH: update quote item and its associated items ---
export async function PATCH(req: NextRequest, context: { params: any }) {
    const itemId = Number(context.params.id);
    if (isNaN(itemId)) return NextResponse.json({ success: false, message: "Invalid item id" }, { status: 400 });

    const body = await req.json();
    const {
        itemNumber,
        description,
        uom,
        quantity,
        unitPrice,
        discount,
        discountType,
        tax,
        is_tax_percentage,
        notes = [],
        associatedItems = [],
    } = body;

    const { data: mainItem, error: mainError } = await supabase
        .from("quote_items")
        .update({
            item_number: itemNumber || null,
            description: description || null,
            uom: uom || null,
            quantity: quantity ?? 0,
            unit_price: unitPrice ?? 0,
            discount: discount ?? 0,
            discount_type: discountType || "dollar",
            tax: tax ?? 0,
            is_tax_percentage: is_tax_percentage ?? false,
            notes,
        })
        .eq("id", itemId)
        .select()
        .single();

    if (mainError) return NextResponse.json({ success: false, message: mainError.message }, { status: 500 });

    if (associatedItems.length > 0) {
        const { error: delError } = await supabase
            .from("associated_items")
            .delete()
            .eq("quote_item_id", itemId);
        if (delError) return NextResponse.json({ success: false, message: delError.message }, { status: 500 });

        const { data: aiData, error: aiError } = await supabase
            .from("associated_items")
            .insert(
                associatedItems.map((ai: any) => ({
                    quote_item_id: itemId,
                    item_number: ai.itemNumber || null,
                    description: ai.description || null,
                    uom: ai.uom || null,
                    quantity: ai.quantity ?? 0,
                    unit_price: ai.unitPrice ?? 0,
                    notes: ai.notes || "",
                }))
            )
            .select();

        if (aiError) return NextResponse.json({ success: false, message: aiError.message }, { status: 500 });

        return NextResponse.json({ success: true, item: mapDbQuoteItemToQuoteItem({ ...mainItem, associated_items: aiData }) });
    }

    return NextResponse.json({ success: true, item: mapDbQuoteItemToQuoteItem({ ...mainItem, associated_items: [] }) });
}

export async function DELETE(req: NextRequest, context: { params: any }) {
    const itemId = Number(context.params.id);
    if (isNaN(itemId)) return NextResponse.json({ success: false, message: "Invalid item id" }, { status: 400 });

    const { error: delAIError } = await supabase
        .from("associated_items")
        .delete()
        .eq("quote_item_id", itemId);
    if (delAIError) return NextResponse.json({ success: false, message: delAIError.message }, { status: 500 });

    const { error: delItemError } = await supabase
        .from("quote_items")
        .delete()
        .eq("id", itemId);
    if (delItemError) return NextResponse.json({ success: false, message: delItemError.message }, { status: 500 });

    return NextResponse.json({ success: true, message: "Item and its associated items deleted" });
}
