/**
 * Items API Routes
 * POST /api/items - Create a new item
 * GET /api/items - List all items
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getUser } from '@/lib/getUser';
import { createItemSchema } from '@/lib/schemas';
import { Item, ApiResponse } from '@/lib/types';
import { addCorsHeaders, handleOptionsRequest } from '@/lib/cors';

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  return handleOptionsRequest();
}

/**
 * POST /api/items
 * Create a new item
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    const body = await request.json();
    
    // Validate request body
    const validatedData = createItemSchema.parse(body);
    
    const supabase = getSupabaseClient();
    
    // Insert item into database
    const { data, error } = await supabase
      .from('items')
      .insert({
        owner_id: user.id,
        ...validatedData,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating item:', error);
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }
    
    const response = NextResponse.json<ApiResponse<Item>>(
      { success: true, data: data as Item },
      { status: 201 }
    );
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Error in POST /api/items:', error);
    
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
      { success: false, error: error.message || 'Failed to create item' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

/**
 * GET /api/items
 * List all items (optionally filter by available status)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const available = searchParams.get('available');
    
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Filter by availability if specified
    if (available !== null) {
      query = query.eq('available', available === 'true');
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching items:', error);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    const response = NextResponse.json<ApiResponse<Item[]>>(
      { success: true, data: data as Item[] },
      { status: 200 }
    );
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Error in GET /api/items:', error);
    const response = NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to fetch items' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

