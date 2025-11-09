/**
 * Accept Item Request API Route
 * POST /api/item-requests/:id/accept - Accept an item request and create an item
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getUser } from '@/lib/getUser';
import { ApiResponse } from '@/lib/types';
import { addCorsHeaders, handleOptionsRequest } from '@/lib/cors';
import { z } from 'zod';

const acceptRequestSchema = z.object({
  condition: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
});

const requestIdParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  return handleOptionsRequest();
}

/**
 * POST /api/item-requests/:id/accept
 * Accept an item request and create an item from it
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser(request);

    // Validate request ID
    const { id: requestId } = requestIdParamSchema.parse({ id: params.id });

    // Validate request body
    const body = await request.json();
    const validatedData = acceptRequestSchema.parse(body);

    // Use admin client to bypass RLS (we've already validated the user)
    const supabase = getSupabaseClient(true);

    // Get the item request
    const { data: itemRequest, error: requestError } = await supabase
      .from('item_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !itemRequest) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Item request not found' },
        { status: 404 }
      );
      return addCorsHeaders(response);
    }

    // Check if request is open
    if (itemRequest.status !== 'open') {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'This request has already been accepted or is no longer available' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    // Prevent users from accepting their own requests
    if (itemRequest.requester_id === user.id) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'You cannot accept your own request' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    // Create item from the request
    const { data: newItem, error: itemError } = await supabase
      .from('items')
      .insert({
        owner_id: user.id,
        title: itemRequest.title,
        description: itemRequest.description || null,
        category: itemRequest.category || null,
        condition: validatedData.condition || null,
        location: validatedData.location || null,
        image_url: validatedData.image_url || null,
        available: true,
      })
      .select()
      .single();

    if (itemError) {
      console.error('Error creating item:', itemError);
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: itemError.message },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }

    // Update item request to accepted
    const { data: updatedRequest, error: updateError } = await supabase
      .from('item_requests')
      .update({
        status: 'accepted',
        accepted_by_id: user.id,
        created_item_id: newItem.id,
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating item request:', updateError);
      // Item was created, but request update failed - this is not ideal but item exists
      const response = NextResponse.json<ApiResponse<any>>(
        { 
          success: true, 
          data: { item: newItem, request: null },
          error: 'Item created but request update failed' 
        },
        { status: 200 }
      );
      return addCorsHeaders(response);
    }

    const response = NextResponse.json<ApiResponse<{ item: any; request: any }>>(
      { 
        success: true, 
        data: { item: newItem, request: updatedRequest } 
      },
      { status: 200 }
    );
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Error in POST /api/item-requests/:id/accept:', error);

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
      { success: false, error: error.message || 'Failed to accept item request' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

