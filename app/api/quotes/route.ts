import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface QuoteGridView {
  id: number;
  quote_number: string;
  status: 'Not Sent' | 'Sent' | 'Accepted';
  date_sent: string;
  customer_name: string;
  point_of_contact: string;
  point_of_contact_email: string;
  total_items: number;
  county: string;
  created_at: string;
  updated_at: string;
  has_attachments: boolean;
  estimate_contract_number?: string;
  job_number?: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 25;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const orderBy = searchParams.get('orderBy') || 'quote_created_at';
    const ascending = searchParams.get('ascending') === 'true';
    const counts = searchParams.get('counts') === 'true';
    const nextNumber = searchParams.get('nextNumber') === 'true';
    const detailed = searchParams.get('detailed') === 'true';
    
    // If only requesting counts, return count of quotes by status
    if (counts) {
      try {
        const { data: allQuotes, error: countError } = await supabase
          .from('quotes_complete')
          .select('quote_id, status');
        
        if (countError || !allQuotes) {
          return NextResponse.json(
            { error: 'Failed to fetch quote counts', details: countError },
            { status: 500 }
          );
        }
        
        const countData = {
          all: allQuotes.length,
          not_sent: allQuotes.filter(quote => quote.status === 'Not Sent').length,
          sent: allQuotes.filter(quote => quote.status === 'Sent').length,
          accepted: allQuotes.filter(quote => quote.status === 'Accepted').length
        };
        
        return NextResponse.json(countData);
      } catch (error) {
        console.error('Error fetching quote counts:', error);
        return NextResponse.json(
          { error: 'Unexpected error fetching quote counts' },
          { status: 500 }
        );
      }
    }
    
    // If requesting next quote number
    if (nextNumber) {
      try {
        // Get the highest current quote number
        const { data: latestQuote, error: quoteError } = await supabase
          .from('quotes')
          .select('quote_number')
          .order('quote_number', { ascending: false })
          .limit(1);
        
        if (quoteError) {
          return NextResponse.json(
            { error: 'Failed to fetch latest quote number', details: quoteError },
            { status: 500 }
          );
        }
        
        let nextQuoteNumber = 'Q-1001'; // Default starting number
        
        if (latestQuote && latestQuote.length > 0) {
          // Extract the number part and increment
          const currentNumber = latestQuote[0].quote_number;
          if (currentNumber && currentNumber.startsWith('Q-')) {
            const numericPart = parseInt(currentNumber.substring(2));
            if (!isNaN(numericPart)) {
              nextQuoteNumber = `Q-${numericPart + 1}`;
            }
          }
        }
        
        return NextResponse.json({ nextQuoteNumber });
      } catch (error) {
        console.error('Error generating next quote number:', error);
        return NextResponse.json(
          { error: 'Unexpected error generating quote number' },
          { status: 500 }
        );
      }
    }
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    if (detailed) {
      // For detailed view, get everything
      let query = supabase
        .from('quotes_complete')
        .select('*')
        .order(orderBy, { ascending })
        .range(offset, offset + limit - 1);

      // Apply status filter if provided
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      
      if (error || !data) {
        return NextResponse.json(
          { success: false, message: 'Failed to fetch quotes', error: error?.message },
          { status: 500 }
        );
      }

      // Get count for pagination
      const { count } = await supabase
        .from('quotes_complete')
        .select('quote_id', { count: 'exact', head: true });
      
      return NextResponse.json({
        success: true, 
        data,
        pagination: {
          page,
          pageSize: limit,
          pageCount: Math.ceil((count || 0) / limit),
          totalCount: count || 0
        }
      });
    } else {
      // For grid view, select and transform specific fields
      let query = supabase
        .from('quotes_complete')
        .select(`
          quote_id,
          quote_number,
          status,
          date_sent,
          customers,
          point_of_contact,
          quote_items,
          county,
          quote_created_at,
          quote_updated_at,
          attached_files,
          estimate_contract_number,
          job_number
        `)
        .order(orderBy, { ascending })
        .range(offset, offset + limit - 1);

      // Apply status filter if provided
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: rawData, error } = await query;
      
      if (error || !rawData) {
        return NextResponse.json(
          { success: false, message: 'Failed to fetch quotes', error: error?.message },
          { status: 500 }
        );
      }

      // Transform the data for the grid view
      const transformedData: QuoteGridView[] = rawData.map((row: any) => {
        // Extract first customer name if available
        const customerName = row.customers && row.customers.length > 0 
          ? row.customers[0].name 
          : '';
        
        // Extract point of contact info
        const poc = row.point_of_contact || {};
        
        // Count items
        const itemCount = row.quote_items ? row.quote_items.length : 0;
        
        // Check if there are attachments
        const hasAttachments = row.attached_files && row.attached_files.length > 0;
        
        return {
          id: row.quote_id,
          quote_number: row.quote_number,
          status: row.status,
          date_sent: row.date_sent,
          customer_name: customerName,
          point_of_contact: poc.contact_name || poc.email || '',
          point_of_contact_email: poc.email || '',
          total_items: itemCount,
          county: row.county || '',
          created_at: row.quote_created_at,
          updated_at: row.quote_updated_at,
          has_attachments: hasAttachments,
          estimate_contract_number: row.estimate_contract_number || undefined,
          job_number: row.job_number || undefined
        };
      });

      // Get count for pagination
      const { count } = await supabase
        .from('quotes_complete')
        .select('quote_id', { count: 'exact', head: true });
      
      return NextResponse.json({
        success: true, 
        data: transformedData,
        pagination: {
          page,
          pageSize: limit,
          pageCount: Math.ceil((count || 0) / limit),
          totalCount: count || 0
        }
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unexpected error', error: String(error) },
      { status: 500 }
    );
  }
}