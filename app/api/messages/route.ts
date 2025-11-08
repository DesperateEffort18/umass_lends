/**
 * Messages API Routes
 * POST /api/messages - Send a message
 * GET /api/messages?itemId=xxx - Get messages for an item
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getUser } from '@/lib/getUser';
import { createMessageSchema, messagesQuerySchema } from '@/lib/schemas';
import { Message, ApiResponse } from '@/lib/types';
import { addCorsHeaders, handleOptionsRequest } from '@/lib/cors';

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  return handleOptionsRequest();
}

/**
 * POST /api/messages
 * Send a message related to an item
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    const body = await request.json();
    
    // Validate request body
    const validatedData = createMessageSchema.parse(body);
    
    const supabase = getSupabaseClient();
    
    // Verify that the item exists
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('id')
      .eq('id', validatedData.item_id)
      .single();
    
    if (itemError || !item) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
      return addCorsHeaders(response);
    }
    
    // Insert message into database
    const { data, error } = await supabase
      .from('messages')
      .insert({
        item_id: validatedData.item_id,
        sender_id: user.id,
        text: validatedData.text,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating message:', error);
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }
    
    const response = NextResponse.json<ApiResponse<Message>>(
      { success: true, data: data as Message },
      { status: 201 }
    );
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Error in POST /api/messages:', error);
    
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
      { success: false, error: error.message || 'Failed to send message' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

/**
 * GET /api/messages?itemId=xxx
 * Get all messages for a specific item
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    
    // Validate query parameter
    if (!itemId) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'itemId query parameter is required' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }
    
    const validatedQuery = messagesQuerySchema.parse({ itemId });
    
    const supabase = getSupabaseClient();
    
    // Fetch messages for the item
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('item_id', validatedQuery.itemId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }
    
    const response = NextResponse.json<ApiResponse<Message[]>>(
      { success: true, data: data as Message[] },
      { status: 200 }
    );
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Error in GET /api/messages:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }
    
    const response = NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

