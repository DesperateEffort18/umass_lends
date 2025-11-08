/**
 * Reject Borrow Request API Route
 * POST /api/borrow/:id/reject - Reject a borrow request
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getUser } from '@/lib/getUser';
import { borrowIdParamSchema } from '@/lib/schemas';
import { BorrowRequest, ApiResponse } from '@/lib/types';

/**
 * POST /api/borrow/:id/reject
 * Reject a borrow request (only the owner can reject)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    
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
        { success: false, error: 'Only the item owner can reject requests' },
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
    
    // Update borrow request status
    const { data: updatedRequest, error: updateError } = await supabase
      .from('borrow_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error rejecting borrow request:', updateError);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json<ApiResponse<BorrowRequest>>(
      { success: true, data: updatedRequest as BorrowRequest },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/borrow/:id/reject:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to reject borrow request' },
      { status: 500 }
    );
  }
}

