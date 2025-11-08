/**
 * Approve Borrow Request API Route
 * POST /api/borrow/:id/approve - Approve a borrow request
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getUser } from '@/lib/getUser';
import { borrowIdParamSchema } from '@/lib/schemas';
import { BorrowRequest, ApiResponse } from '@/lib/types';
import { addCorsHeaders, handleOptionsRequest } from '@/lib/cors';

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  return handleOptionsRequest();
}

/**
 * POST /api/borrow/:id/approve
 * Approve a borrow request (only the owner can approve)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser(request);
    
    // Validate borrow request ID
    const { id: requestId } = borrowIdParamSchema.parse({ id: params.id });
    
    const supabase = getSupabaseClient();
    
    // Get the borrow request
    const { data: borrowRequest, error: fetchError } = await supabase
      .from('borrow_requests')
      .select('*')
      .eq('id', requestId)
      .single();
    
    if (fetchError || !borrowRequest) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Borrow request not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the owner
    if (borrowRequest.owner_id !== user.id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Only the item owner can approve requests' },
        { status: 403 }
      );
    }
    
    // Check if request is already processed
    if (borrowRequest.status !== 'pending') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: `Request has already been ${borrowRequest.status}` },
        { status: 400 }
      );
    }
    
    // Update borrow request status and mark item as unavailable
    const { data: updatedRequest, error: updateError } = await supabase
      .from('borrow_requests')
      .update({ status: 'approved' })
      .eq('id', requestId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error approving borrow request:', updateError);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }
    
    // Mark item as unavailable
    await supabase
      .from('items')
      .update({ available: false })
      .eq('id', borrowRequest.item_id);
    
    // Reject other pending requests for the same item
    await supabase
      .from('borrow_requests')
      .update({ status: 'rejected' })
      .eq('item_id', borrowRequest.item_id)
      .eq('status', 'pending')
      .neq('id', requestId);
    
    const response = NextResponse.json<ApiResponse<BorrowRequest>>(
      { success: true, data: updatedRequest as BorrowRequest },
      { status: 200 }
    );
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Error in POST /api/borrow/:id/approve:', error);
    
    // Handle authentication errors
    if (error.message?.includes('Unauthorized')) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 401 }
      );
      return addCorsHeaders(response);
    }
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }
    
    const response = NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to approve borrow request' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

