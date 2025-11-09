/**
 * OpenAI Service
 * Handles AI-powered recommendations using OpenAI's API
 * Selects from existing database items based on season
 */
import OpenAI from 'openai';
import { Item } from './types';
import { getCurrentAcademicPeriod, type AcademicPeriod } from './recommendationEngine';

// Initialize OpenAI client (only if API key is available)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

/**
 * Get season/period description for AI context
 */
function getPeriodDescription(period: AcademicPeriod): string {
  const descriptions: Record<AcademicPeriod, string> = {
    semester_start: 'the beginning of the semester when students are moving in and setting up their dorm rooms',
    midterms: 'midterm exam season when students need study materials and tools',
    finals: 'final exam season when students need study materials, stress relief items, and comfort items',
    summer: 'summer break when students are doing outdoor activities, internships, or traveling',
    winter_break: 'winter break and holiday season',
    general: 'general time of year for college students',
  };
  return descriptions[period] || descriptions.general;
}

/**
 * Generate AI-powered recommendations using OpenAI
 * Selects 2-3 items from existing database items that are most relevant for the current season/period
 */
export async function getAIRecommendations(
  items: Item[],
  period: AcademicPeriod = getCurrentAcademicPeriod(),
  limit: number = 3
): Promise<{ itemIds: string[]; explanation: string }> {
  if (!openai || !process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }

  if (!items || items.length === 0) {
    return {
      itemIds: [],
      explanation: 'No items available for recommendations.',
    };
  }

  const periodDescription = getPeriodDescription(period);
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Format items for AI context
  const itemsContext = items
    .map(
      (item, index) =>
        `${index + 1}. [ID: ${item.id}] ${item.title}${item.description ? ` - ${item.description}` : ''}${item.category ? ` (Category: ${item.category})` : ''}`
    )
    .join('\n');

  const prompt = `You are a helpful assistant for a college student item lending platform (like a library for sharing items between students).

Current date: ${currentDate}
Current period: ${periodDescription}

Available items in the database:
${itemsContext}

Task: Select exactly ${limit} items (by their IDs) from the list above that would be most useful for college students during this time period. 

Consider:
- What college students typically need during this season/period
- Practicality and relevance to student life
- Seasonal needs (e.g., tools for moving in, calculators for exams, outdoor gear for summer)
- Items that solve common problems students face during this time
- Match items to the current period's needs

Respond in JSON format with this exact structure:
{
  "itemIds": ["id1", "id2", "id3"],
  "explanation": "A brief 1-2 sentence explanation of why these items are recommended for this time period"
}

IMPORTANT: Only include item IDs that exist in the list above. Return exactly ${limit} item IDs.`;

  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using the more cost-effective model
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that recommends items for college students based on the time of year and their needs. Always respond with valid JSON in the exact format requested. Only select items that exist in the provided list.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(responseContent);
    const itemIds = Array.isArray(parsed.itemIds) ? parsed.itemIds : [];
    const explanation = parsed.explanation || `Recommended items for ${period.replace('_', ' ')}.`;

    // Validate that all item IDs exist
    const validItemIds = itemIds.filter((id: string) =>
      items.some((item) => item.id === id)
    );

    // If we got fewer valid IDs than requested, fill with top items
    if (validItemIds.length < limit && validItemIds.length < items.length) {
      const usedIds = new Set(validItemIds);
      const additionalItems = items
        .filter((item) => !usedIds.has(item.id))
        .slice(0, limit - validItemIds.length)
        .map((item) => item.id);
      validItemIds.push(...additionalItems);
    }

    return {
      itemIds: validItemIds.slice(0, limit),
      explanation: explanation,
    };
  } catch (error: any) {
    console.error('Error calling OpenAI API:', error);
    throw new Error(`Failed to generate AI recommendations: ${error.message}`);
  }
}

/**
 * Fallback to rule-based recommendations if OpenAI fails
 */
export function getFallbackRecommendations(
  items: Item[],
  period: AcademicPeriod,
  limit: number
): { itemIds: string[]; explanation: string } {
  // Simple fallback: return first N available items
  const itemIds = items.slice(0, limit).map((item) => item.id);
  return {
    itemIds,
    explanation: `Top ${limit} available items for ${period.replace('_', ' ')}.`,
  };
}

