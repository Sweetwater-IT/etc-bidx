import { supabase } from "@/lib/supabase";
import { QuoteItem } from "@/types/IQuoteItem";
import { NextRequest, NextResponse } from "next/server";

// --- Mapper DB -> Frontend ---
function mapDbQuoteItemToQuoteItem(item: any): QuoteItem {
    if (!item) return {} as QuoteItem;
    return {
        id: String(item.id),
        itemNumber: item.item_number || "",
        item_name: item.item_name || "",
        uom: item.uom || "",
        notes: item.notes || "",
        quantity: item.quantity || 0,
        unitPrice: item.unit_price || 0,
        discount: item.discount || 0,
        discountType: item.discount_type || "dollar",
        quote_id: item.quote_id,
        tax: item.tax || 0,
        is_tax_percentage: item.is_tax_percentage || false,
        associatedItems: item.associated_items?.map((ai: any) => ({
            id: String(ai.id),
            itemNumber: ai.item_number || "",
            description: ai.description || "",
            uom: ai.uom || "",
            quantity: ai.quantity || 0,
            unitPrice: ai.unit_price || 0,
            notes: ai.notes || "",
        })) || [],
    };
}

// --- POST a new quote item with associated items ---
export async function POST(req: NextRequest) {
    const body = await req.json();
    const {
        quote_id,
        itemNumber,
        description,
        uom,
        quantity,
        unitPrice,
        discount,
        discountType,
        tax,
        is_tax_percentage,
        associatedItems = [],
        notes,
        item_name,
    } = body;


    const { data: mainItem, error: mainError } = await supabase
        .from("quote_items")
        .insert([{
            quote_id: quote_id ?? null,
            item_number: itemNumber || null,
            item_name: item_name || null,
            uom: uom || null,
            quantity: quantity ?? 0,
            unit_price: unitPrice ?? 0,
            discount: discount ?? 0,
            discount_type: discountType || "dollar",
            tax: tax ?? 0,
            is_tax_percentage: is_tax_percentage ?? false,
            notes: notes,
        }])
        .select()
        .single();

    if (mainError) return NextResponse.json({ success: false, message: mainError.message }, { status: 500 });

    const quoteItemId = mainItem.id;

    let associatedItemsData: any[] = [];
    if (associatedItems.length > 0) {
        const { data: aiData, error: aiError } = await supabase
            .from("associated_items")
            .insert(
                associatedItems.map((ai: any) => ({
                    quote_item_id: quoteItemId,
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

        associatedItemsData = aiData;
    }

    return NextResponse.json({
        success: true,
        item: mapDbQuoteItemToQuoteItem({ ...mainItem, associated_items: associatedItemsData }),
    });
}

export async function GET(req: NextRequest, context: { params: any }) {
    const quoteId = Number(context.params.id);
    if (isNaN(quoteId)) return NextResponse.json({ success: false, message: "Invalid quote id" }, { status: 400 });

    const { data: items, error } = await supabase
        .from("quote_items")
        .select(`*, associated_items (*)`)
        .eq("quote_id", quoteId);

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

    return NextResponse.json({ success: true, items: items.map(mapDbQuoteItemToQuoteItem) });
}
