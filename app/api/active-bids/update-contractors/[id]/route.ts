// /api/active-bids/update-contractors/[contractNumber]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
    _request: NextRequest,
    { params }: any
  ) {
    try {
      const resolvedParams = await params;
      const contractNumber = decodeURIComponent(resolvedParams.id);
      
      // First, find the bid estimate using the contract number
      const { data: bidEstimate, error: bidError } = await supabase
        .from('bid_estimates')
        .select('id')
        .eq("contract_number", contractNumber)
        .single();
      
      if (bidError) {
        return NextResponse.json(
          { success: false, message: 'Failed to find bid estimate', error: bidError.message },
          { status: bidError.code === 'PGRST116' ? 404 : 500 }
        );
      }
      
      // Now get the project_metadata using the bid estimate id
      const { data: projectMetadata, error: metadataError } = await supabase
        .from('project_metadata')
        .select('contractor_id, subcontractor_id')
        .eq('bid_estimate_id', bidEstimate.id)
        .single();
      
      if (metadataError) {
        // If no metadata found, return null values instead of error
        if (metadataError.code === 'PGRST116') {
          return NextResponse.json({ 
            success: true, 
            data: { contractor_id: null, subcontractor_id: null },
            message: 'No contractors assigned yet'
          });
        }
        
        return NextResponse.json(
          { success: false, message: 'Failed to get contractors', error: metadataError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ 
        success: true, 
        data: projectMetadata,
        message: 'Contractors retrieved successfully'
      });
      
    } catch (error) {
      console.error('Unexpected error:', error);
      return NextResponse.json(
        { success: false, message: 'Unexpected error', error: String(error) },
        { status: 500 }
      );
    }
  }

  export async function PATCH(
    request: NextRequest,
    { params }: any
  ) {
    try {
      const resolvedParams = await params;
      const contractNumber = decodeURIComponent(resolvedParams.id);
      console.log(contractNumber)
      const body = await request.json();
      const { contractor_id, subcontractor_id } = body;
      
      // First, find the bid estimate using the contract number
      const { data: bidEstimate, error: bidError } = await supabase
        .from('bid_estimates')
        .select('id')
        .eq("contract_number", contractNumber)
        .single();
      
      if (bidError) {
        return NextResponse.json(
          { success: false, message: 'Failed to find bid estimate', error: bidError.message },
          { status: bidError.code === 'PGRST116' ? 404 : 500 }
        );
      }
      
      // Now upsert the project_metadata table using the bid estimate id
      const updateData: any = {
        bid_estimate_id: bidEstimate.id
      };
      if (contractor_id) updateData.contractor_id = contractor_id;
      if (subcontractor_id) updateData.subcontractor_id = subcontractor_id;
      
      const { data: updatedMetadata, error: updateError } = await supabase
        .from('project_metadata')
        .upsert(updateData, {
          onConflict: 'bid_estimate_id'
        })
        .select()
        .single();
      
      if (updateError) {
          console.log(updateError)
        return NextResponse.json(
          { success: false, message: 'Failed to update contractors', error: updateError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ 
        success: true, 
        data: updatedMetadata,
        message: 'Contractors updated successfully'
      });
      
    } catch (error) {
      console.error('Unexpected error:', error);
      return NextResponse.json(
        { success: false, message: 'Unexpected error', error: String(error) },
        { status: 500 }
      );
    }
  }