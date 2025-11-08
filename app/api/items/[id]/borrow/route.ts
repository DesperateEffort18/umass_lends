/**
 * Borrow Request API Route
 * POST /api/items/:id/borrow - Submit a borrow request for an item
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getUser } from '@/lib/getUser';
import { itemIdParamSchema, createBorrowRequestSchema } from '@/lib/schemas';
import { BorrowRequest, ApiResponse } from '@/lib/types';

/**
 * POST /api/items/:id/borrow
 * Submit a borrow request for an item
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    const body = await request.json();
    
    // Validate item ID
    const { id: itemId } = itemIdParamSchema.parse({ id: params.id });
    
    // Validate request body
    const validatedData = createBorrowRequestSchema.parse(body);
    
    const supabase = getSupabaseClient();
    
    // First, check if item exists and get owner
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('owner_id, available')
      .eq('id', itemId)
      .single();
    
    if (itemError || !item) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }
    
    // Check if item is available
    if (!item.available) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Item is not available for borrowing' },
        { status: 400 }
      );
    }
    
    // Check if user is trying to borrow their own item
    if (item.owner_id === user.id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Cannot borrow your own item' },
        { status: 400 }
      );
    }
    
    // Check if there's already a pending request for this item by this user
    const { data: existingRequest } = await supabase
      .from('borrow_requests')
      .select('id')
      .eq('item_id', itemId)
      .eq('borrower_id', user.id)
      .eq('status', 'pending')
      .single();
    
    if (existingRequest) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'You already have a pending request for this item' },
        { status: 400 }
      );
    }
    
    // Create borrow request
    const { data, error } = await supabase
      .from('borrow_requests')
      .insert({
        item_id: itemId,
        borrower_id: user.id,
        owner_id: item.owner_id,
        status: 'pending',
        borrow_start_date: validatedData.borrow_start_date,
        borrow_end_date: validatedData.borrow_end_date,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating borrow request:', error);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json<ApiResponse<BorrowRequest>>(
      { success: true, data: data as BorrowRequest },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/items/:id/borrow:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to create borrow request' },
      { status: 500 }
    );
  }
}

