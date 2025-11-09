/**
 * Single Item API Route
 * GET /api/items/:id - Get item details
 * DELETE /api/items/:id - Delete an item (owner only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getUser } from '@/lib/getUser';
import { itemIdParamSchema } from '@/lib/schemas';
import { Item, ApiResponse } from '@/lib/types';
import { addCorsHeaders, handleOptionsRequest } from '@/lib/cors';

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  return handleOptionsRequest();
}

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
    
    const { data: item, error } = await supabase
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
    
    // Fetch owner information
    let ownerInfo = null;
    if (item.owner_id) {
      const { data: owner, error: ownerError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', item.owner_id)
        .single();
      
      if (!ownerError && owner) {
        ownerInfo = {
          id: owner.id,
          name: owner.name || owner.email || 'Unknown User',
          email: owner.email,
        };
      }
    }
    
    // Add owner info to item data
    const itemWithOwner = {
      ...item,
      owner_name: ownerInfo?.name,
      owner_email: ownerInfo?.email,
    };
    
    const response = NextResponse.json<ApiResponse<Item>>(
      { success: true, data: itemWithOwner as Item },
      { status: 200 }
    );
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Error in GET /api/items/:id:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }
    
    const response = NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to fetch item' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

/**
 * DELETE /api/items/:id
 * Delete an item (only the owner can delete their item)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser(request);
    
    // Validate item ID
    const { id } = itemIdParamSchema.parse({ id: params.id });
    
    const supabase = getSupabaseClient();
    
    // First, get the item to check ownership and get image URL
    const { data: item, error: fetchError } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching item:', fetchError);
      
      // Handle not found
      if (fetchError.code === 'PGRST116') {
        const response = NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Item not found' },
          { status: 404 }
        );
        return addCorsHeaders(response);
      }
      
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }
    
    // Check if user is the owner
    if (item.owner_id !== user.id) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Only the item owner can delete this item' },
        { status: 403 }
      );
      return addCorsHeaders(response);
    }
    
    // Check if item is currently borrowed (has approved borrow requests)
    const { data: activeBorrows } = await supabase
      .from('borrow_requests')
      .select('id')
      .eq('item_id', id)
      .eq('status', 'approved')
      .limit(1);
    
    if (activeBorrows && activeBorrows.length > 0) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Cannot delete item that is currently being borrowed. Please wait for the item to be returned.' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }
    
    // Delete image from storage if it exists
    if (item.image_url) {
      try {
        // Extract file path from URL
        const url = new URL(item.image_url);
        const pathParts = url.pathname.split('/');
        const filePath = pathParts.slice(pathParts.indexOf('item-images')).join('/');
        
        // Delete from Supabase Storage
        const { error: storageError } = await supabase.storage
          .from('item-images')
          .remove([filePath]);
        
        if (storageError) {
          console.error('Error deleting image from storage:', storageError);
          // Continue with item deletion even if image deletion fails
        }
      } catch (imageError) {
        console.error('Error processing image deletion:', imageError);
        // Continue with item deletion even if image deletion fails
      }
    }
    
    // Delete the item (this will cascade delete borrow_requests and messages due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('items')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting item:', deleteError);
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }
    
    const response = NextResponse.json<ApiResponse<null>>(
      { success: true, data: null },
      { status: 200 }
    );
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Error in DELETE /api/items/:id:', error);
    
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
      { success: false, error: error.message || 'Failed to delete item' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

