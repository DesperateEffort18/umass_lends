/**
 * Mark Item as Returned API Route
 * POST /api/borrow/:id/mark-returned - Mark that an item has been returned (owner confirms receipt)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getUser } from '@/lib/getUser';
import { borrowIdParamSchema } from '@/lib/schemas';
import { BorrowRequest, ApiResponse } from '@/lib/types';
import { addCorsHeaders } from '@/lib/cors';

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

/**
 * POST /api/borrow/:id/mark-returned
 * Mark that an item has been returned (only the owner can mark as returned)
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
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Borrow request not found' },
        { status: 404 }
      );
      return addCorsHeaders(response);
    }
    
    // Check if user is the owner
    if (borrowRequest.owner_id !== user.id) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Only the item owner can mark items as returned' },
        { status: 403 }
      );
      return addCorsHeaders(response);
    }
    
    // Check if request is approved (can only mark returned if it was approved)
    if (borrowRequest.status !== 'approved') {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: `Cannot mark as returned. Request status is: ${borrowRequest.status}` },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }
    
    // Update borrow request status to 'returned'
    const { data: updatedRequest, error: updateError } = await supabase
      .from('borrow_requests')
      .update({ status: 'returned' })
      .eq('id', requestId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error marking item as returned:', updateError);
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: updateError.message },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }
    
    // Mark item as available again
    const { error: itemUpdateError } = await supabase
      .from('items')
      .update({ available: true })
      .eq('id', borrowRequest.item_id);
    
    if (itemUpdateError) {
      console.error('Error updating item availability:', itemUpdateError);
      // Still return success since the borrow request was updated
      // but log the error
    }
    
    const response = NextResponse.json<ApiResponse<BorrowRequest>>(
      { success: true, data: updatedRequest as BorrowRequest },
      { status: 200 }
    );
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Error in POST /api/borrow/:id/mark-returned:', error);
    
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
      { success: false, error: error.message || 'Failed to mark item as returned' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

