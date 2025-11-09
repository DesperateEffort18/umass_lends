# AI-Powered Recommendations System

## Overview

The UMass Lends platform includes an intelligent recommendation system that suggests items to students based on the current time of year and academic calendar. The system automatically detects the academic period (semester start, midterms, finals, etc.) and recommends relevant items.

## How It Works

### Academic Period Detection

The system automatically determines the current academic period based on the date:

- **Semester Start** (Late August - September, Late January - February)
  - Recommends: Tools, furniture, dorm essentials
  - Example items: Screwdrivers, desk lamps, storage boxes

- **Midterms** (October - Early November, March - Early April)
  - Recommends: Calculators, textbooks, study materials
  - Example items: Calculators, notebooks, highlighters

- **Finals** (Late November - December, Late April - May)
  - Recommends: Calculators, study materials, stress relief items
  - Example items: Calculators, coffee mugs, desk lamps

- **Summer** (June - Early August)
  - Recommends: Outdoor equipment, summer gear
  - Example items: Camping gear, bikes, sports equipment

- **Winter Break** (Mid-December - Mid-January)
  - Recommends: Holiday items, winter clothing
  - Example items: Holiday decorations, winter coats

### Recommendation Algorithm

1. **Keyword Matching**: Items are scored based on keyword matches in their title, description, and category
2. **Category Matching**: Items matching relevant categories get bonus points
3. **Scoring**: Items are ranked by relevance score, with title matches weighted more heavily
4. **Filtering**: Only available items with positive scores are included

### API Endpoint

**GET `/api/recommendations`**

Query Parameters:
- `limit` (optional): Number of recommendations to return (default: 6)
- `period` (optional): Override academic period for testing (e.g., `midterms`, `finals`)

Response:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "period": "midterms",
    "explanation": "Essential items for midterm exams and studying!"
  }
}
```

## Customization

### Adding New Keywords

Edit `lib/recommendationEngine.ts` to add keywords for specific periods:

```typescript
{
  period: 'midterms',
  keywords: ['calculator', 'textbook', 'study', ...],
  categories: ['Electronics', 'Books', 'School Supplies'],
  description: 'Essential items for midterm exams and studying!'
}
```

### Adjusting Academic Calendar

Modify the `getCurrentAcademicPeriod()` function in `lib/recommendationEngine.ts` to match your specific academic calendar dates.

### Testing Different Periods

You can test recommendations for different periods by adding the `period` query parameter:

```
GET /api/recommendations?period=midterms
GET /api/recommendations?period=finals
GET /api/recommendations?period=semester_start
```

## Frontend Integration

The recommendations are automatically displayed on the Home page in a prominent section above the regular item listings. The section includes:

- A visually distinct header with UMass branding
- An explanation of why items are recommended
- The current academic period indicator
- A grid of recommended items using the same ItemCard component

## Future Enhancements

Potential improvements to the recommendation system:

1. **Machine Learning**: Use historical borrowing data to improve recommendations
2. **User Preferences**: Factor in user's past borrowing history
3. **Weather Integration**: Consider weather conditions for outdoor items
4. **Event-Based**: Integrate with campus event calendar
5. **Collaborative Filtering**: Recommend items based on what similar users borrowed
6. **Seasonal Trends**: Learn from seasonal borrowing patterns

