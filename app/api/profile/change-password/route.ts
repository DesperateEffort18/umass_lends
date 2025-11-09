/**
 * Change Password API Route
 * POST /api/profile/change-password - Change user password
 */
import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/getUser';
import { ApiResponse } from '@/lib/types';
import { addCorsHeaders, handleOptionsRequest } from '@/lib/cors';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const changePasswordSchema = z.object({
  current_password: z.string().min(6, 'Current password is required'),
  new_password: z.string().min(6, 'New password must be at least 6 characters'),
});

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  return handleOptionsRequest();
}

/**
 * POST /api/profile/change-password
 * Change the current user's password
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    const body = await request.json();
    
    // Validate request body
    const validatedData = changePasswordSchema.parse(body);
    
    // Get Supabase client with service role for password update
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // First, verify current password by attempting to sign in
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email || '',
      password: validatedData.current_password,
    });
    
    if (signInError) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      );
      return addCorsHeaders(response);
    }
    
    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: validatedData.new_password }
    );
    
    if (updateError) {
      console.error('Error updating password:', updateError);
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: updateError.message || 'Failed to update password' },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }
    
    const response = NextResponse.json<ApiResponse<{ message: string }>>(
      { success: true, data: { message: 'Password updated successfully' } },
      { status: 200 }
    );
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Error in POST /api/profile/change-password:', error);
    
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
      { success: false, error: error.message || 'Failed to change password' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

