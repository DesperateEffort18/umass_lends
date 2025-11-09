# 🤖 OpenAI AI Recommendations Setup

## Overview

The UMass Lends platform now uses **OpenAI's GPT-4o-mini** to provide intelligent, AI-powered recommendations for college students based on the current season and time of year.

## Features

- **AI-Powered Recommendations**: Uses OpenAI to intelligently recommend 2-3 items based on the season
- **Season-Aware**: Considers the academic calendar (semester start, midterms, finals, summer, etc.)
- **Context-Aware**: Understands what college students need during different times of year
- **Fallback System**: Automatically falls back to rule-based recommendations if AI is unavailable

---

## Setup Instructions

### Step 1: Get Your OpenAI API Key

1. Go to: https://platform.openai.com/
2. Sign up or log in to your account
3. Go to: **API Keys** (in the left sidebar)
4. Click: **Create new secret key**
5. Copy your API key (you'll only see it once!)

### Step 2: Add API Key to .env File

Add your OpenAI API key to your `.env` file in the root directory:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Important**: 
- Never commit your `.env` file to git (it's already in `.gitignore`)
- Keep your API key secret
- Don't share it publicly

### Step 3: Restart Your Backend Server

After adding the API key, **restart your backend server**:

```bash
# Stop the backend (Ctrl+C)
# Then restart:
npm run dev:backend
```

Environment variables are only read when the server starts!

---

## How It Works

### Backend (API Route)

1. **Fetches all available items** from the database
2. **Determines current academic period** (semester start, midterms, finals, etc.)
3. **Calls OpenAI API** with:
   - List of all available items
   - Current date and academic period
   - Request for 2-3 recommendations
4. **OpenAI analyzes** items and returns the most relevant ones for the current season
5. **Returns recommendations** with AI-generated explanation

### Frontend

1. **Calls `/api/recommendations`** endpoint
2. **Displays 2-3 recommended items** at the top of the home page
3. **Shows "AI-Powered" badge** when AI is being used
4. **Displays AI-generated explanation** of why items are recommended

---

## API Endpoint

**GET `/api/recommendations`**

### Query Parameters

- `limit` (optional): Number of recommendations (default: 3, max: 5)
- `period` (optional): Override academic period for testing
- `useAI` (optional): Enable/disable AI (default: true)

### Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "title": "Calculator",
        "description": "...",
        ...
      }
    ],
    "period": "midterms",
    "explanation": "These items are perfect for midterm exams! Calculators help with math problems, and notebooks are essential for studying.",
    "aiPowered": true
  }
}
```

### Example Requests

```bash
# Get 3 AI recommendations (default)
GET /api/recommendations

# Get 2 recommendations
GET /api/recommendations?limit=2

# Test for a specific period
GET /api/recommendations?period=finals

# Disable AI (use fallback)
GET /api/recommendations?useAI=false
```

---

## Cost Considerations

### Model Used

- **Model**: `gpt-4o-mini` (cost-effective option)
- **Cost**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Typical cost per request**: ~$0.0001 - $0.0005 (very cheap!)

### Cost Optimization

- Uses `gpt-4o-mini` instead of `gpt-4` (much cheaper)
- Limits recommendations to 2-3 items
- Uses structured JSON responses (more efficient)
- Caches results (recommendations only refresh on page load)

### Estimated Monthly Cost

For a small college platform:
- ~100 recommendations per day
- ~3,000 recommendations per month
- **Estimated cost**: ~$0.30 - $1.50 per month

---

## Fallback System

If OpenAI API is unavailable or fails:

1. **Automatically falls back** to rule-based recommendations
2. **No error shown to users** (seamless experience)
3. **Still provides recommendations** (just not AI-powered)
4. **Logs warning** in backend console

### When Fallback is Used

- `OPENAI_API_KEY` is not set
- OpenAI API returns an error
- API rate limit is exceeded
- Network issues

---

## Testing

### Test AI Recommendations

1. **Make sure `.env` has `OPENAI_API_KEY`**
2. **Start backend**: `npm run dev:backend`
3. **Start frontend**: `npm run dev:frontend`
4. **Open home page**: `http://localhost:5173`
5. **Check for "AI-Powered" badge** on recommendations

### Test Different Periods

You can test recommendations for different periods:

```bash
# Test midterms recommendations
curl "http://localhost:3000/api/recommendations?period=midterms"

# Test finals recommendations
curl "http://localhost:3000/api/recommendations?period=finals"

# Test semester start recommendations
curl "http://localhost:3000/api/recommendations?period=semester_start"
```

### Test Fallback

To test the fallback system:

```bash
# Temporarily remove OPENAI_API_KEY from .env
# Or use useAI=false parameter
curl "http://localhost:3000/api/recommendations?useAI=false"
```

---

## Troubleshooting

### "OPENAI_API_KEY is not set"

**Solution**: Add `OPENAI_API_KEY` to your `.env` file and restart the backend server.

### "Failed to generate AI recommendations"

**Possible causes**:
1. Invalid API key
2. API rate limit exceeded
3. Network issues
4. OpenAI API is down

**Solution**: 
- Check your API key is correct
- Check OpenAI status: https://status.openai.com/
- System will automatically fall back to rule-based recommendations

### Recommendations not showing "AI-Powered" badge

**Possible causes**:
1. AI failed and fell back to rule-based
2. `useAI=false` parameter was used
3. API key is missing

**Solution**: Check backend console for error messages

### High API costs

**Solution**:
- Already using cost-effective `gpt-4o-mini` model
- Consider caching recommendations
- Limit number of recommendations per user
- Add rate limiting

---

## Security Best Practices

1. **Never commit `.env` file** to git (already in `.gitignore`)
2. **Use environment variables** (not hardcoded keys)
3. **Rotate API keys** periodically
4. **Monitor API usage** in OpenAI dashboard
5. **Set usage limits** in OpenAI dashboard to prevent unexpected costs

---

## Future Enhancements

Potential improvements:

1. **Caching**: Cache recommendations for a period (e.g., 1 hour)
2. **User History**: Factor in user's past borrowing history
3. **Personalization**: Learn from user preferences
4. **Batch Processing**: Generate recommendations for multiple users at once
5. **A/B Testing**: Compare AI vs rule-based recommendations

---

## Summary

✅ **Add `OPENAI_API_KEY` to `.env`**  
✅ **Restart backend server**  
✅ **Recommendations will automatically use AI**  
✅ **Shows "AI-Powered" badge when active**  
✅ **Falls back gracefully if AI unavailable**

That's it! Your AI-powered recommendations are ready! 🎉

