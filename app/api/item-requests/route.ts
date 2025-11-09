/**
 * Item Requests API Route
 * GET /api/item-requests - Get item requests
 * POST /api/item-requests - Create a new item request
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getUser } from '@/lib/getUser';
import { ApiResponse } from '@/lib/types';
import { addCorsHeaders, handleOptionsRequest } from '@/lib/cors';
import { z } from 'zod';

const createRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
});

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  return handleOptionsRequest();
}

/**
 * GET /api/item-requests
 * Get item requests
 * Query params:
 *   - status: filter by status (optional)
 *   - mine: if true, get only current user's requests (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const mine = searchParams.get('mine') === 'true';

    // Use admin client to bypass RLS (we've already validated the user)
    const supabase = getSupabaseClient(true);

    let query = supabase
      .from('item_requests')
      .select('*')
      .order('created_at', { ascending: false });

    // If mine=true, get only user's requests
    if (mine) {
      query = query.eq('requester_id', user.id);
    } else {
      // Otherwise, get only open requests (for lenders to see)
      query = query.eq('status', 'open');
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching item requests:', error);
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }

    const response = NextResponse.json<ApiResponse<any[]>>(
      { success: true, data: data || [] },
      { status: 200 }
    );
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Error in GET /api/item-requests:', error);

    if (error.message?.includes('Unauthorized')) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 401 }
      );
      return addCorsHeaders(response);
    }

    const response = NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to fetch item requests' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

/**
 * POST /api/item-requests
 * Create a new item request
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    const body = await request.json();

    // Validate request body
    const validatedData = createRequestSchema.parse(body);

    // Use admin client to bypass RLS (we've already validated the user)
    const supabase = getSupabaseClient(true);

    // Create item request
    const { data, error } = await supabase
      .from('item_requests')
      .insert({
        requester_id: user.id,
        title: validatedData.title,
        description: validatedData.description || null,
        category: validatedData.category || null,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating item request:', error);
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }

    const response = NextResponse.json<ApiResponse<any>>(
      { success: true, data },
      { status: 201 }
    );
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Error in POST /api/item-requests:', error);

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
      { success: false, error: error.message || 'Failed to create item request' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

