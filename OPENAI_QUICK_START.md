# 🚀 OpenAI AI Recommendations - Quick Start

## ✅ 3-Step Setup

### Step 1: Get OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy your key (starts with `sk-`)

### Step 2: Add to .env File

Add this line to your `.env` file:

```env
OPENAI_API_KEY=sk-your-key-here
```

### Step 3: Restart Backend

```bash
# Stop backend (Ctrl+C)
npm run dev:backend
```

---

## ✅ That's It!

Now your recommendations will be **AI-powered**! 

- Shows **2-3 items** based on the season
- Displays **"AI-Powered" badge** 🤖
- Provides **intelligent explanations** of why items are recommended

---

## 🧪 Test It

1. Open: `http://localhost:5173`
2. Look for **"✨ Recommended for You"** section
3. Check for **"🤖 AI-Powered"** badge

---

## 💰 Cost

- Uses `gpt-4o-mini` (very affordable)
- ~$0.0001 - $0.0005 per recommendation
- Estimated: **$0.30 - $1.50 per month** for a small college platform

---

## 🐛 Troubleshooting

**No "AI-Powered" badge?**
- Check `OPENAI_API_KEY` is in `.env`
- Restart backend server
- Check backend console for errors

**Still not working?**
- System automatically falls back to rule-based recommendations
- Check OpenAI status: https://status.openai.com/
- Verify API key is correct

---

For detailed documentation, see: `docs/OPENAI_SETUP.md`

