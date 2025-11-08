/**
 * Single Item API Route
 * GET /api/items/:id - Get item details
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { itemIdParamSchema } from '@/lib/schemas';
import { Item, ApiResponse } from '@/lib/types';

/**
 * GET /api/items/:id
 * Get a single item by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate item ID
    const { id } = itemIdParamSchema.parse({ id: params.id });
    
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching item:', error);
      
      // Handle not found
      if (error.code === 'PGRST116') {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Item not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json<ApiResponse<Item>>(
      { success: true, data: data as Item },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in GET /api/items/:id:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to fetch item' },
      { status: 500 }
    );
  }
}

