/**
 * My Borrow Requests API Route
 * GET /api/borrow/mine - Get all borrow requests relevant to the current user
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getUser } from '@/lib/getUser';
import { BorrowRequest, ApiResponse } from '@/lib/types';
import { addCorsHeaders, handleOptionsRequest } from '@/lib/cors';

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  return handleOptionsRequest();
}

/**
 * GET /api/borrow/mine
 * Get all borrow requests where the user is either the borrower or the owner
 * Optionally filter by status using query parameter: ?status=pending
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const supabase = getSupabaseClient();
    
    // Get requests where user is borrower or owner
    let query = supabase
      .from('borrow_requests')
      .select('*')
      .or(`borrower_id.eq.${user.id},owner_id.eq.${user.id}`)
      .order('request_date', { ascending: false });
    
    // Filter by status if provided
    if (status && ['pending', 'approved', 'rejected', 'returned'].includes(status)) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching borrow requests:', error);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    const response = NextResponse.json<ApiResponse<BorrowRequest[]>>(
      { success: true, data: data as BorrowRequest[] },
      { status: 200 }
    );
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Error in GET /api/borrow/mine:', error);
    
    // Handle authentication errors
    if (error.message?.includes('Unauthorized')) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 401 }
      );
      return addCorsHeaders(response);
    }
    
    const response = NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to fetch borrow requests' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

