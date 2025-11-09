/**
 * Profile API Route
 * GET /api/profile - Get user profile
 * PUT /api/profile - Update user profile
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getUser } from '@/lib/getUser';
import { ApiResponse } from '@/lib/types';
import { addCorsHeaders, handleOptionsRequest } from '@/lib/cors';
import { z } from 'zod';

const updateProfileSchema = z.object({
  venmo_username: z.string().optional().nullable(),
  cashapp_username: z.string().optional().nullable(),
  zelle_email: z.string().optional().nullable(), // Allow any string for Zelle (can be email or phone)
  profile_picture_url: z.string().optional().nullable().refine(
    (val) => {
      // If empty or null, it's valid
      if (!val || val.trim() === '') return true;
      // If provided, validate as URL
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Profile picture URL must be a valid URL if provided' }
  ),
});

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  return handleOptionsRequest();
}

/**
 * GET /api/profile
 * Get the current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    const supabase = getSupabaseClient();

    // Fetch user profile from database
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, profile_picture_url, venmo_username, cashapp_username, zelle_email, created_at, updated_at')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }

    const response = NextResponse.json<ApiResponse<any>>(
      { success: true, data },
      { status: 200 }
    );
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Error in GET /api/profile:', error);
    
    if (error.message?.includes('Unauthorized')) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 401 }
      );
      return addCorsHeaders(response);
    }

    const response = NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

/**
 * PUT /api/profile
 * Update the current user's profile
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getUser(request);
    const body = await request.json();
    
    // Validate request body
    const validatedData = updateProfileSchema.parse(body);
    
    const supabase = getSupabaseClient();
    
    // Update user profile
    const { data, error } = await supabase
      .from('users')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('id, email, name, profile_picture_url, venmo_username, cashapp_username, zelle_email, created_at, updated_at')
      .single();
    
    if (error) {
      console.error('Error updating profile:', error);
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }
    
    const response = NextResponse.json<ApiResponse<any>>(
      { success: true, data },
      { status: 200 }
    );
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Error in PUT /api/profile:', error);
    
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
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

