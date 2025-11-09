/**
 * Recommendations API Route
 * GET /api/recommendations - Get AI-powered recommended items based on current time period
 * Uses AI to select from existing database items
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Item, ApiResponse } from '@/lib/types';
import { addCorsHeaders } from '@/lib/cors';
import {
  getCurrentAcademicPeriod,
  type AcademicPeriod
} from '@/lib/recommendationEngine';

/**
 * Handle OPTIONS request for CORS preflight
 * This handler is standalone and fast - no dependencies on other imports
 */
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

/**
 * GET /api/recommendations
 * Get AI-powered recommended items based on the current academic period
 * Uses AI to select from existing database items
 * Query params:
 *   - limit: number of recommendations to return (default: 3, max: 5)
 *   - period: optional override for academic period (for testing)
 *   - useAI: whether to use AI recommendations (default: true, set to false for fallback)
 */
export async function GET(request: NextRequest) {

  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '3', 10);
    const limit = Math.min(Math.max(limitParam, 1), 5); // Clamp between 1 and 5
    const periodOverride = searchParams.get('period') as AcademicPeriod | null;
    const useAI = searchParams.get('useAI') !== 'false'; // Default to true

    // Determine current academic period
    const currentPeriod = periodOverride || getCurrentAcademicPeriod();

    const supabase = getSupabaseClient();

    // Fetch all available items from database
    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .eq('available', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching items for recommendations:', error);
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }

    if (!items || items.length === 0) {
      const response = NextResponse.json<ApiResponse<{
        items: Item[];
        period: AcademicPeriod;
        explanation: string;
        aiPowered: boolean;
      }>>(
        {
          success: true,
          data: {
            items: [],
            period: currentPeriod,
            explanation: 'No items available for recommendations.',
            aiPowered: false,
          }
        },
        { status: 200 }
      );
      return addCorsHeaders(response);
    }

    let recommendedItemIds: string[] = [];
    let explanation = '';
    let aiPowered = false;

    // Use AI recommendations if OpenAI API key is available and useAI is true
    if (useAI && process.env.OPENAI_API_KEY) {
      try {
        // Dynamically import OpenAI service to avoid breaking if package is missing
        const { getAIRecommendations, getFallbackRecommendations } = await import('@/lib/openaiService');
        const aiResult = await getAIRecommendations(items, currentPeriod, limit);
        recommendedItemIds = aiResult.itemIds;
        explanation = aiResult.explanation;
        aiPowered = true;
      } catch (aiError: any) {
        console.warn('AI recommendation failed, using fallback:', aiError.message);
        // Fall back to simple recommendations
        try {
          const { getFallbackRecommendations } = await import('@/lib/openaiService');
          const fallback = getFallbackRecommendations(items, currentPeriod, limit);
          recommendedItemIds = fallback.itemIds;
          explanation = fallback.explanation;
        } catch (fallbackError: any) {
          // Ultimate fallback: just return first N items
          recommendedItemIds = items.slice(0, limit).map(item => item.id);
          explanation = `Top ${limit} available items for ${currentPeriod.replace('_', ' ')}.`;
        }
        aiPowered = false;
      }
    } else {
      // Use fallback if AI is disabled or API key is missing
      try {
        const { getFallbackRecommendations } = await import('@/lib/openaiService');
        const fallback = getFallbackRecommendations(items, currentPeriod, limit);
        recommendedItemIds = fallback.itemIds;
        explanation = fallback.explanation;
      } catch (fallbackError: any) {
        // Ultimate fallback: just return first N items
        recommendedItemIds = items.slice(0, limit).map(item => item.id);
        explanation = `Top ${limit} available items for ${currentPeriod.replace('_', ' ')}.`;
      }
      aiPowered = false;
    }

    // Get the actual item objects for the recommended IDs
    const recommendedItems = items.filter((item) =>
      recommendedItemIds.includes(item.id)
    );

    // Ensure we maintain the order from AI recommendations
    const orderedItems = recommendedItemIds
      .map((id) => recommendedItems.find((item) => item.id === id))
      .filter((item): item is Item => item !== undefined);

    const response = NextResponse.json<ApiResponse<{
      items: Item[];
      period: AcademicPeriod;
      explanation: string;
      aiPowered: boolean;
    }>>(
      {
        success: true,
        data: {
          items: orderedItems,
          period: currentPeriod,
          explanation: explanation,
          aiPowered: aiPowered,
        }
      },
      { status: 200 }
    );
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Error in GET /api/recommendations:', error);
    const response = NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to fetch recommendations' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

