/**
 * User Profile API Route
 * GET /api/users/:id - Get user profile by ID (public info only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { ApiResponse } from '@/lib/types';
import { addCorsHeaders, handleOptionsRequest } from '@/lib/cors';
import { z } from 'zod';

const userIdParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  return handleOptionsRequest();
}

/**
 * GET /api/users/:id
 * Get public user profile information by user ID
 * Returns: name, email, profile_picture_url, venmo_username, cashapp_username, zelle_email
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate user ID
    const { id } = userIdParamSchema.parse({ id: params.id });
    
    const supabase = getSupabaseClient();
    
    // Fetch public user profile information
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, profile_picture_url, venmo_username, cashapp_username, zelle_email')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      
      // Handle not found
      if (error.code === 'PGRST116') {
        const response = NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
        return addCorsHeaders(response);
      }
      
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }
    
    const response = NextResponse.json<ApiResponse<any>>(
      { success: true, data: user },
      { status: 200 }
    );
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Error in GET /api/users/:id:', error);
    
    if (error.name === 'ZodError') {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }
    
    const response = NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to fetch user profile' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

