import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const idParam = url.searchParams.get('id');

        if (!idParam) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
        }

        const jobId = parseInt(idParam);

        const { data, error } = await supabase.rpc('delete_job_cascade', { p_job_id: jobId });

        if (error) {
            console.error('Error deleting job:', error);
            return NextResponse.json({ error: 'Failed to delete job', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: `Job ${jobId} deleted successfully` });
    } catch (err) {
        console.error('Unexpected error:', err);
        return NextResponse.json({ error: 'Unexpected error deleting job', details: String(err) }, { status: 500 });
    }
}
