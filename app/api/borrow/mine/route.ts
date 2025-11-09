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
    
    const { data: requests, error } = await query;
    
    if (error) {
      console.error('Error fetching borrow requests:', error);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    if (!requests || requests.length === 0) {
      const response = NextResponse.json<ApiResponse<BorrowRequest[]>>(
        { success: true, data: [] },
        { status: 200 }
      );
      return addCorsHeaders(response);
    }
    
    // Get all unique user IDs (borrowers and owners)
    const userIds = new Set<string>();
    requests.forEach((req: any) => {
      userIds.add(req.borrower_id);
      userIds.add(req.owner_id);
    });
    
    // Fetch user information for all user IDs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .in('id', Array.from(userIds));
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      // Continue even if user fetch fails, just use IDs
    }
    
    // Create a map of user ID to user info
    const usersMap = new Map<string, { name?: string; email?: string }>();
    users?.forEach((u: any) => {
      usersMap.set(u.id, { name: u.name, email: u.email });
    });
    
    // Transform the data to include user information
    const transformedData = requests.map((request: any) => {
      const borrower = usersMap.get(request.borrower_id);
      const owner = usersMap.get(request.owner_id);
      
      return {
        ...request,
        borrower_name: borrower?.name || borrower?.email || 'Unknown User',
        borrower_email: borrower?.email || '',
        owner_name: owner?.name || owner?.email || 'Unknown User',
        owner_email: owner?.email || '',
      };
    });
    
    const response = NextResponse.json<ApiResponse<any[]>>(
      { success: true, data: transformedData },
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

