/**
 * Item Report API Route
 * POST /api/items/:id/report - Report an item
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getUser } from '@/lib/getUser';
import { ApiResponse } from '@/lib/types';
import { addCorsHeaders, handleOptionsRequest } from '@/lib/cors';
import { z } from 'zod';

const reportSchema = z.object({
  reason: z.enum(['scam', 'violence_or_hate', 'false_information', 'lending_restricted_items', 'nudity_or_sexual_activity']),
});

const itemIdParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  return handleOptionsRequest();
}

/**
 * POST /api/items/:id/report
 * Report an item for violation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser(request);
    
    // Validate item ID
    const { id: itemId } = itemIdParamSchema.parse({ id: params.id });
    
    // Validate request body
    const body = await request.json();
    const { reason } = reportSchema.parse(body);
    
    const supabase = getSupabaseClient();
    
    // Check if item exists
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('id, owner_id')
      .eq('id', itemId)
      .single();
    
    if (itemError || !item) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
      return addCorsHeaders(response);
    }
    
    // Prevent users from reporting their own items
    if (item.owner_id === user.id) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'You cannot report your own item' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }
    
    // Check if user has already reported this item for this reason
    const { data: existingReport } = await supabase
      .from('item_reports')
      .select('id')
      .eq('item_id', itemId)
      .eq('reporter_id', user.id)
      .eq('reason', reason)
      .single();
    
    if (existingReport) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'You have already reported this item for this reason' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }
    
    // Create report
    const { data: report, error: reportError } = await supabase
      .from('item_reports')
      .insert({
        item_id: itemId,
        reporter_id: user.id,
        reason: reason,
      })
      .select()
      .single();
    
    if (reportError) {
      console.error('Error creating report:', reportError);
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: reportError.message },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }
    
    // Check if item should be auto-removed (trigger handles this, but we check here too)
    const { data: reports, error: countError } = await supabase
      .from('item_reports')
      .select('id')
      .eq('item_id', itemId)
      .eq('reason', reason);
    
    if (!countError && reports && reports.length >= 5) {
      // Update item to unavailable
      await supabase
        .from('items')
        .update({ available: false })
        .eq('id', itemId);
    }
    
    const response = NextResponse.json<ApiResponse<{ report: any; auto_removed: boolean }>>(
      { 
        success: true, 
        data: { 
          report,
          auto_removed: reports && reports.length >= 5 
        } 
      },
      { status: 200 }
    );
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Error in POST /api/items/:id/report:', error);
    
    if (error.message?.includes('Unauthorized')) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 401 }
      );
      return addCorsHeaders(response);
    }
    
    if (error.name === 'ZodError') {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }
    
    const response = NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to report item' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

