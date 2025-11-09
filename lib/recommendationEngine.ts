/**
 * Recommendation Engine
 * Provides time-based recommendations for items based on the academic calendar
 */

export type AcademicPeriod = 
  | 'semester_start' 
  | 'midterms' 
  | 'finals' 
  | 'summer' 
  | 'winter_break'
  | 'general';

export interface RecommendationRule {
  period: AcademicPeriod;
  keywords: string[];
  categories: string[];
  description: string;
}

/**
 * Determine the current academic period based on the date
 * UMass academic calendar:
 * - Fall semester: Late August - December
 * - Spring semester: Late January - May
 * - Summer: June - August
 */
export function getCurrentAcademicPeriod(date: Date = new Date()): AcademicPeriod {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  // Summer (June - early August)
  if (month >= 6 && month <= 7) {
    return 'summer';
  }
  if (month === 8 && day <= 15) {
    return 'summer';
  }

  // Winter break (mid-December to mid-January)
  if (month === 12 && day >= 15) {
    return 'winter_break';
  }
  if (month === 1 && day <= 15) {
    return 'winter_break';
  }

  // Semester start periods
  // Fall: Late August - September
  if (month === 8 && day > 15) {
    return 'semester_start';
  }
  if (month === 9) {
    return 'semester_start';
  }
  // Spring: Late January - February
  if (month === 1 && day > 15) {
    return 'semester_start';
  }
  if (month === 2) {
    return 'semester_start';
  }

  // Midterms
  // Fall: October - early November
  if (month === 10) {
    return 'midterms';
  }
  if (month === 11 && day <= 15) {
    return 'midterms';
  }
  // Spring: March - early April
  if (month === 3) {
    return 'midterms';
  }
  if (month === 4 && day <= 15) {
    return 'midterms';
  }

  // Finals
  // Fall: Late November - December
  if (month === 11 && day > 15) {
    return 'finals';
  }
  if (month === 12 && day < 15) {
    return 'finals';
  }
  // Spring: Late April - May
  if (month === 4 && day > 15) {
    return 'finals';
  }
  if (month === 5) {
    return 'finals';
  }

  return 'general';
}

/**
 * Recommendation rules mapping periods to relevant keywords and categories
 */
export const RECOMMENDATION_RULES: RecommendationRule[] = [
  {
    period: 'semester_start',
    keywords: [
      'screwdriver', 'screwdrivers', 'tool', 'tools', 'furniture', 'desk', 'chair',
      'lamp', 'storage', 'organizer', 'dorm', 'room', 'setup', 'moving', 'box', 'boxes'
    ],
    categories: ['Tools', 'Furniture', 'Home & Living'],
    description: 'Perfect for setting up your dorm room at the start of the semester!'
  },
  {
    period: 'midterms',
    keywords: [
      'calculator', 'calculators', 'textbook', 'textbooks', 'book', 'books',
      'study', 'notebook', 'notebooks', 'pen', 'pens', 'pencil', 'pencils',
      'highlight', 'highlighter', 'ruler', 'protractor', 'compass'
    ],
    categories: ['Electronics', 'Books', 'School Supplies'],
    description: 'Essential items for midterm exams and studying!'
  },
  {
    period: 'finals',
    keywords: [
      'calculator', 'calculators', 'textbook', 'textbooks', 'book', 'books',
      'study', 'notebook', 'notebooks', 'coffee', 'mug', 'thermos', 'lamp',
      'desk', 'chair', 'stress', 'relief', 'yoga', 'mat'
    ],
    categories: ['Electronics', 'Books', 'School Supplies', 'Home & Living'],
    description: 'Everything you need to ace your finals!'
  },
  {
    period: 'summer',
    keywords: [
      'outdoor', 'camping', 'tent', 'sleeping bag', 'hiking', 'backpack',
      'beach', 'swim', 'swimming', 'sunscreen', 'cooler', 'grill', 'barbecue',
      'bike', 'bicycle', 'sports', 'equipment'
    ],
    categories: ['Outdoor', 'Sports', 'Recreation'],
    description: 'Great for summer activities and adventures!'
  },
  {
    period: 'winter_break',
    keywords: [
      'holiday', 'gift', 'wrapping', 'decorations', 'lights', 'tree',
      'winter', 'coat', 'jacket', 'gloves', 'hat', 'scarf', 'boots'
    ],
    categories: ['Holiday', 'Clothing', 'Home & Living'],
    description: 'Perfect for the holiday season!'
  }
];

/**
 * Score an item based on how well it matches the current period
 */
export function scoreItemForPeriod(
  item: { title: string; description?: string; category?: string },
  period: AcademicPeriod
): number {
  const rule = RECOMMENDATION_RULES.find(r => r.period === period);
  if (!rule) return 0;

  let score = 0;
  const searchText = `${item.title} ${item.description || ''} ${item.category || ''}`.toLowerCase();

  // Check keyword matches (weighted by position)
  rule.keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    if (searchText.includes(keywordLower)) {
      // Title matches are worth more
      if (item.title.toLowerCase().includes(keywordLower)) {
        score += 10;
      } else {
        score += 5;
      }
    }
  });

  // Check category matches
  if (item.category && rule.categories.includes(item.category)) {
    score += 15;
  }

  return score;
}

/**
 * Get recommendation explanation for a period
 */
export function getRecommendationExplanation(period: AcademicPeriod): string {
  const rule = RECOMMENDATION_RULES.find(r => r.period === period);
  return rule?.description || 'Recommended items for you!';
}

