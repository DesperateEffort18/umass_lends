/**
 * Collateral Recommendations API Route
 * GET /api/collateral - Get AI-powered collateral recommendations for an item
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Item, ApiResponse } from '@/lib/types';
import { addCorsHeaders, handleOptionsRequest } from '@/lib/cors';
import { getCollateralRecommendations } from '@/lib/openaiService';

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  return handleOptionsRequest();
}

/**
 * GET /api/collateral
 * Get AI-powered collateral recommendations for an item
 * Query params:
 *   - itemId: ID of the item being borrowed (required)
 *   - limit: number of recommendations to return (default: 5)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const limitParam = parseInt(searchParams.get('limit') || '5', 10);
    const limit = Math.min(Math.max(limitParam, 1), 10); // Clamp between 1 and 10

    if (!itemId) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'itemId parameter is required' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    const supabase = getSupabaseClient();

    // Fetch the item being borrowed
    const { data: borrowedItem, error: itemError } = await supabase
      .from('items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError || !borrowedItem) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
      return addCorsHeaders(response);
    }

    // Fetch all available items (excluding the borrowed item)
    const { data: availableItems, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .eq('available', true)
      .neq('id', itemId)
      .order('created_at', { ascending: false });

    if (itemsError) {
      console.error('Error fetching items for collateral:', itemsError);
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: itemsError.message },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }

    if (!availableItems || availableItems.length === 0) {
      const response = NextResponse.json<ApiResponse<{
        items: Item[];
        explanation: string;
      }>>(
        {
          success: true,
          data: {
            items: [],
            explanation: 'No items available for collateral recommendations.',
          }
        },
        { status: 200 }
      );
      return addCorsHeaders(response);
    }

    // Get AI recommendations
    try {
      const recommendations = await getCollateralRecommendations(
        borrowedItem as Item,
        availableItems as Item[],
        limit
      );

      const response = NextResponse.json<ApiResponse<{
        items: Item[];
        explanation: string;
      }>>(
        {
          success: true,
          data: {
            items: recommendations.items,
            explanation: recommendations.explanation,
          }
        },
        { status: 200 }
      );
      return addCorsHeaders(response);
    } catch (aiError: any) {
      console.error('Error getting collateral recommendations:', aiError);
      // Fallback to similar category items
      const similarItems = (availableItems as Item[])
        .filter(
          (item) =>
            item.category === borrowedItem.category || !borrowedItem.category
        )
        .slice(0, limit);

      const response = NextResponse.json<ApiResponse<{
        items: Item[];
        explanation: string;
      }>>(
        {
          success: true,
          data: {
            items: similarItems,
            explanation: 'Suggested items from similar category as collateral.',
          }
        },
        { status: 200 }
      );
      return addCorsHeaders(response);
    }
  } catch (error: any) {
    console.error('Error in GET /api/collateral:', error);
    const response = NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to fetch collateral recommendations' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

