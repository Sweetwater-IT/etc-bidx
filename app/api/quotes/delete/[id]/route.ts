// app/api/quotes/delete/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid quote ID" },
        { status: 400 }
      );
    }

    // 🔎 Buscar la quote primero (para saber estimate_id / job_id)
    const { data: quoteRow, error: fetchErr } = await supabase
      .from("quotes")
      .select("id, estimate_id, job_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !quoteRow) {
      return NextResponse.json(
        { success: false, message: "Quote not found", error: fetchErr?.message },
        { status: 404 }
      );
    }

    // 🔥 Borrar dependencias primero
    await supabase.from("quote_items").delete().eq("quote_id", id);
    await supabase.from("quote_recipients").delete().eq("quote_id", id);
    await supabase.from("quotes_customers").delete().eq("quote_id", id);
    await supabase.from("files").delete().eq("quote_id", id);

    // 🗂️ Si tenía admin vinculado → borrarlo
    if (quoteRow.estimate_id) {
      await supabase.from("admin_data_entries").delete().eq("bid_estimate_id", quoteRow.estimate_id);
    }
    if (quoteRow.job_id) {
      await supabase.from("admin_data_entries").delete().eq("job_id", quoteRow.job_id);
    }

    // 🧨 Finalmente borrar la quote
    const { error: delErr } = await supabase.from("quotes").delete().eq("id", id);
    if (delErr) {
      return NextResponse.json(
        { success: false, message: "Failed to delete quote", error: delErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Quote and related data deleted" });
  } catch (error) {
    console.error("💥 [DELETE /quotes/delete/[id]] Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "Unexpected error", error: String(error) },
      { status: 500 }
    );
  }
}
