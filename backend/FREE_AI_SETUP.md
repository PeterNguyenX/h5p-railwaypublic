# FREE AI Setup Guide

Your system now supports **3 AI providers** with automatic fallback. All are FREE or locally hosted!

## 🚀 Quick Start Options

### Option 1: Groq (FASTEST - Recommended) ⭐⭐⭐

**Speed**: 30 tokens/sec | **Cost**: FREE | **Setup**: 2 minutes

Groq is a FREE cloud service that's **6x faster** than local Ollama. Perfect for immediate results.

#### Setup:
1. Go to https://console.groq.com
2. Create a free account
3. Generate an API key
4. Add to `.env`:
```bash
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
```

#### Limits:
- Free tier: 14,400 requests/day (plenty!)
- Rate limit: ~30 requests/minute
- Models: Mixtral 8x7b-32768, Llama2-70b, etc.

#### Test:
```bash
# Backend will automatically detect and use Groq
npm start
# Click "Transcribe & Generate H5P with AI"
```

---

### Option 2: Ollama (FREE, Local) ⭐⭐⭐

**Speed**: 5-10 tokens/sec | **Cost**: FREE | **Setup**: 5 minutes | **No internet required**

Run AI locally on your GPU. Best for privacy and offline use.

#### Setup:
1. Install Ollama: https://ollama.ai
2. Download a fast model:
```bash
# Option A: Fastest (recommended)
ollama pull mistral

# Option B: Better quality (slightly slower)
ollama pull neural-chat

# Option C: Most capable but slower
ollama pull llama2
```

3. Start Ollama:
```bash
ollama serve
```

4. Add to `.env`:
```bash
OLLAMA_ENABLED=true
OLLAMA_MODEL=mistral  # or neural-chat, llama2
```

#### Model Comparison:
| Model | Speed | Quality | VRAM |
|-------|-------|---------|------|
| mistral | 10 tok/s | Good | 7GB |
| neural-chat | 8 tok/s | Very Good | 4GB |
| llama2 | 5 tok/s | Excellent | 4GB |
| llama3.2:3b | 3 tok/s | Good | 2GB |

#### Verify Installation:
```bash
# In new terminal
ollama list
# Should show: mistral (or your model)
```

---

### Option 3: Claude (Paid Fallback)

**Speed**: 20 tokens/sec | **Cost**: $0.15 per 1M input tokens | **Setup**: 1 minute

If Groq and Ollama fail, automatically falls back to Claude.

#### Setup:
```bash
# Add to .env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
```

---

## 🔧 How It Works

The system tries providers in this order:

```
1️⃣ Groq (if GROQ_API_KEY set)  ← FASTEST FREE
   ↓ (on failure)
2️⃣ Ollama (if enabled)         ← LOCAL FREE
   ↓ (on failure)
3️⃣ Claude (if ANTHROPIC_API_KEY set) ← PAID
   ↓ (if all fail)
❌ Error: No provider configured
```

---

## 📊 Comparison Table

| Feature | Groq | Ollama | Claude |
|---------|------|--------|--------|
| **Cost** | FREE ✓ | FREE ✓ | $$$$ |
| **Speed** | 30 tok/s | 5-10 tok/s | 20 tok/s |
| **Setup** | 2 min | 5 min | 1 min |
| **Internet** | Required | Optional | Required |
| **Privacy** | Cloud | Local | Cloud |
| **Reliability** | 99.9% | Local GPU | 99.99% |
| **Best For** | Speed | Privacy | Quality |

---

## 🎯 My Recommendation

**For Development/Testing:**
→ Use **Groq** (fastest, simplest, FREE)

**For Production:**
→ Use **Ollama** (local, no API costs) OR **Groq** (fast & reliable)

**For Maximum Quality:**
→ Use **Claude** (with Groq/Ollama fallback)

---

## 🚀 Testing Your Setup

After setting up, test the AI pipeline:

```bash
# Terminal 1: Start backend
npm start

# Terminal 2: Check which provider is active
# Watch logs during "Transcribe & Generate H5P with AI"
```

Expected log output:
```
[AI] Attempting Groq (FREE, ultra-fast)...
[Groq AI] Persisted AI results for video xxx with 4 topics
```

Or for Ollama:
```
[AI] Attempting Ollama (FREE, local)...
[Ollama] Persisted AI results for video xxx with 4 topics
```

---

## ⚙️ Environment Variables

```bash
# .env file
GROQ_API_KEY=gsk_xxxxx              # For Groq (optional)
OLLAMA_ENABLED=true                 # Enable Ollama (default: true)
OLLAMA_MODEL=mistral                # Which model to use
ANTHROPIC_API_KEY=sk-ant-xxxx       # For Claude fallback (optional)
```

---

## 🐛 Troubleshooting

### Groq not working
```bash
# Check API key is valid
curl -X GET \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  https://api.groq.com/openai/v1/models
```

### Ollama not working
```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# If not found, start Ollama:
ollama serve

# If model not found, pull it:
ollama pull mistral
```

### Still too slow?
→ Use **Groq** (30 tokens/sec)
→ Use **faster Ollama model** (mistral > neural-chat)
→ Use **Claude** with smaller transcripts

---

## 💡 Pro Tips

1. **Groq is best for speed:** 6x faster than local Ollama, completely FREE
2. **Ollama is best for privacy:** Runs locally, no API calls
3. **Use smaller models first:** mistral is good balance of speed/quality
4. **Monitor usage:** Check `/backend/logs/` for AI provider logs
5. **Caching:** System caches transcripts, so re-running is instant after first analysis

---

## 📝 References

- **Groq Console**: https://console.groq.com
- **Ollama Models**: https://ollama.ai/library
- **Anthropic**: https://console.anthropic.com

