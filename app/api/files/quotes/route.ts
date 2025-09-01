import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const quoteId = formData.get("uniqueIdentifier") as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
    }

    if (!quoteId) {
      return NextResponse.json({ success: false, error: "Quote ID is required." }, { status: 400 });
    }

    const numericQuoteId = Number(quoteId);
    if (isNaN(numericQuoteId)) {
        return NextResponse.json({ success: false, error: "Invalid Quote ID." }, { status: 400 });
    }

    // Define una ruta para el archivo en Supabase Storage
    const filePath = `public/quotes/${numericQuoteId}/${file.name}`;

    // Sube el archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("quote_files") // Asumiendo que tu bucket se llama 'quote_files'
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true, // Sobrescribe el archivo si ya existe
      });

    if (uploadError) throw new Error(uploadError.message);

    // Obtiene la URL pública del archivo subido
    const { data: urlData } = supabase.storage.from("quote_files").getPublicUrl(uploadData.path);

    // Inserta los metadatos del archivo en tu tabla 'files'
    const { error: dbError } = await supabase.from("files").insert({
      quote_id: numericQuoteId,
      filename: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type,
      file_size: file.size,
    });

    if (dbError) throw new Error(dbError.message);

    return NextResponse.json({ success: true, url: urlData.publicUrl });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}