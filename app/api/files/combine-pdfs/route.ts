import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PDFDocument } from 'pdf-lib';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const quoteId = formData.get('quoteId') as string;

        if (!quoteId) {
            return NextResponse.json({ error: 'Missing quoteId' }, { status: 400 });
        }

        const folder = `quotes/${quoteId}/pdf`;
        const timestamp = Date.now();
        const mergedFileName = `finalPdf_${quoteId}_${timestamp}.pdf`;
        const storagePath = `${folder}/${mergedFileName}`;

        const files = formData.getAll('file').filter(f => f instanceof File) as File[];
        if (files.length === 0) {
            return NextResponse.json(
                { error: 'At least 1 PDF file is required' },
                { status: 400 }
            );
        }

        let mergedBuffer: Buffer;

        if (files.length === 1) {
            mergedBuffer = Buffer.from(await files[0].arrayBuffer());
        } else {
            const mergedPdf = await PDFDocument.create();
            for (const file of files) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach(page => mergedPdf.addPage(page));
            }
            const mergedBytes = await mergedPdf.save();
            mergedBuffer = Buffer.from(mergedBytes);
        }

        const { data: existingFiles, error: listError } = await supabase.storage
            .from('files')
            .list(folder);

        if (listError) {
            console.error('Error listing folder:', listError);
        } else if (existingFiles?.some(f => f.name === mergedFileName)) {
            await supabase.storage.from('files').remove([storagePath]);
        }

        const { error: storageError } = await supabase.storage
            .from('files')
            .upload(storagePath, mergedBuffer, { contentType: 'application/pdf', upsert: true });

        if (storageError) {
            console.error('Storage error:', storageError);
            return NextResponse.json(
                { error: 'Failed to upload merged PDF', details: storageError.message },
                { status: 500 }
            );
        }

        const { data: urlData } = supabase.storage.from('files').getPublicUrl(storagePath);

        const { data: oldFiles } = await supabase
            .from('files')
            .select('id, file_path')
            .eq('quote_id', parseInt(quoteId, 10))
            .eq('file_type', 'application/pdf');

        if (oldFiles?.length) {
            const pathsToRemove = oldFiles
                .filter(f => f.file_path.startsWith(`${folder}/`))
                .map(f => f.file_path);

            if (pathsToRemove.length) {
                await supabase.storage.from('files').remove(pathsToRemove);
                await supabase.from('files').delete().in(
                    'id',
                    oldFiles
                        .filter(f => f.file_path.startsWith(`${folder}/`))
                        .map(f => f.id)
                );
            }
        }

        const { data: dbData, error: dbError } = await supabase
            .from('files')
            .insert({
                filename: mergedFileName,
                file_type: 'application/pdf',
                file_path: storagePath,
                file_url: urlData.publicUrl,
                quote_id: parseInt(quoteId, 10),
                upload_date: new Date().toISOString(),
                file_size: mergedBuffer.length,
            })
            .select('id, filename, file_type, upload_date, file_size, file_url')
            .single();

        if (dbError) {
            console.error('Database error:', dbError);
            await supabase.storage.from('files').remove([storagePath]);
            return NextResponse.json(
                { error: 'Failed to save metadata', details: dbError.message },
                { status: 500 }
            );
        }

        await supabase.from('quotes').update({ pdf_url: urlData?.publicUrl }).eq('id', quoteId);

        return NextResponse.json({
            success: true,
            message: 'Merged PDF uploaded successfully',
            file: dbData,
            url: urlData.publicUrl,
        }, { status: 201 });

    } catch (error) {
        console.error('Unexpected error merging PDFs:', error);
        return NextResponse.json(
            { error: 'Unexpected error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
