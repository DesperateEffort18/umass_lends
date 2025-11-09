/**
 * OpenAI Service
 * Handles AI-powered recommendations using OpenAI's API
 * Selects from existing database items based on season
 */
import OpenAI from 'openai';
import { Item } from './types';
import { getCurrentAcademicPeriod, type AcademicPeriod } from './recommendationEngine';

// Lazy initialization of OpenAI client to avoid blocking module load
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!openai && process.env.OPENAI_API_KEY) {
    try {
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      return null;
    }
  }
  return openai;
}

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
  const client = getOpenAIClient();
  if (!client || !process.env.OPENAI_API_KEY) {
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

  if (!client) {
    throw new Error('OpenAI client not initialized');
  }

  try {
    const completion = await client.chat.completions.create({
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

/**
 * Generate AI-powered collateral recommendations
 * Suggests items of equivalent value that a borrower could give as collateral
 */
export async function getCollateralRecommendations(
  borrowedItem: Item,
  availableItems: Item[],
  limit: number = 5
): Promise<{ items: Item[]; explanation: string }> {
  if (!availableItems || availableItems.length === 0) {
    return {
      items: [],
      explanation: 'No items available for collateral recommendations.',
    };
  }

  // Format available items for AI context
  const itemsContext = availableItems
    .filter(item => item.id !== borrowedItem.id) // Exclude the item being borrowed
    .map(
      (item, index) =>
        `${index + 1}. [ID: ${item.id}] ${item.title}${item.description ? ` - ${item.description}` : ''}${item.category ? ` (Category: ${item.category})` : ''}`
    )
    .join('\n');

  const prompt = `You are helping a college student lending platform determine collateral for item borrowing.

Item being borrowed:
- Title: ${borrowedItem.title}
- Description: ${borrowedItem.description || 'No description'}
- Category: ${borrowedItem.category || 'Uncategorized'}

Available items that could be used as collateral:
${itemsContext}

Task: Select up to ${limit} items (by their IDs) that would be appropriate collateral for the item being borrowed. Consider:
- Equivalent or similar monetary value
- Similar item type (e.g., if borrowing a charger, suggest another charger or similar electronics)
- Practical items that students commonly have
- Items that provide reasonable security for the lender
- Items that are commonly available and not too valuable to be practical

Examples:
- If borrowing a MacBook charger → suggest another charger, phone, or small electronics
- If borrowing a textbook → suggest another book, calculator, or school supplies
- If borrowing a tool → suggest another tool or item of similar value

Respond in JSON format with this exact structure:
{
  "itemIds": ["id1", "id2", "id3"],
  "explanation": "A brief explanation of why these items are good collateral options"
}

Only include item IDs that exist in the list above. Return up to ${limit} item IDs.`;

  const client = getOpenAIClient();
  if (!client) {
    // Fallback to similar category items
    const similarItems = availableItems
      .filter(
        (item) =>
          item.id !== borrowedItem.id &&
          (item.category === borrowedItem.category || !borrowedItem.category)
      )
      .slice(0, limit);
    return {
      items: similarItems,
      explanation: `Suggested items from similar category as collateral.`,
    };
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that suggests appropriate collateral items for lending. Always respond with valid JSON in the exact format requested. Only select items that exist in the provided list.',
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
    const explanation = parsed.explanation || 'Suggested collateral items.';

    // Validate that all item IDs exist
    const validItemIds = itemIds.filter((id: string) =>
      availableItems.some((item) => item.id === id && item.id !== borrowedItem.id)
    );

    // Get the actual item objects
    const recommendedItems = availableItems.filter((item) =>
      validItemIds.includes(item.id)
    );

    // If we got fewer items than requested, fill with similar category items
    if (recommendedItems.length < limit) {
      const usedIds = new Set([...validItemIds, borrowedItem.id]);
      const similarCategoryItems = availableItems
        .filter(
          (item) =>
            !usedIds.has(item.id) &&
            (item.category === borrowedItem.category || !borrowedItem.category)
        )
        .slice(0, limit - recommendedItems.length);
      recommendedItems.push(...similarCategoryItems);
    }

    return {
      items: recommendedItems.slice(0, limit),
      explanation: explanation,
    };
  } catch (error: any) {
    console.error('Error calling OpenAI API for collateral:', error);
    // Fallback to similar category items
    const similarItems = availableItems
      .filter(
        (item) =>
          item.id !== borrowedItem.id &&
          (item.category === borrowedItem.category || !borrowedItem.category)
      )
      .slice(0, limit);
    return {
      items: similarItems,
      explanation: `Suggested items from similar category as collateral.`,
    };
  }
}

