# API Key Security Guide

## Current Status: ✅ SECURE ARCHITECTURE

Your app is correctly configured:
- ✅ API keys are stored **only in `backend/.env`** (never in frontend)
- ✅ `.env` is in `.gitignore` and won't be committed to Git
- ✅ Backend handles all API calls; frontend never sees the keys
- ✅ Frontend calls backend endpoints like `/api/ai/analyze-stream` instead

---

## 🔒 How to Keep Your Keys Secure

### 1. **NEVER Expose Your `.env` File**
- Don't screenshot or share your `backend/.env` publicly
- Don't paste `.env` content in GitHub issues or Discord
- Don't commit `.env` to public repositories

### 2. **Current API Keys You Have**
In `backend/.env`:
- `GROQ_API_KEY` — Groq API (FREE AI provider)
- `SUPABASE_ANON_KEY` — Supabase public key (limited scope)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase admin key (keep secret!)
- `JWT_SECRET` / `SESSION_SECRET` — Authentication secrets
- `RESEND_API_KEY` — Email service API

### 3. **What to Do Before Uploading to GitHub**

#### ✅ Safe to Upload (already configured):
```
.gitignore                    # Contains: backend/.env, frontend/.env, .env.*
backend/.env.example          # Template with placeholders only
```

#### ❌ DO NOT Upload:
```
backend/.env                  # KEEP LOCAL ONLY
frontend/.env                 # KEEP LOCAL ONLY  
.env.production              # KEEP LOCAL ONLY
```

---

## 🔑 Rotating Your Groq API Key

### If You Suspect Exposure:

1. **Go to Groq Console:**
   - Visit https://console.groq.com
   - Log in to your account
   - Find "API Keys" section

2. **Revoke Old Key:**
   - Click "Revoke" on the exposed key
   - This immediately stops it from working

3. **Create New Key:**
   - Click "Create New API Key"
   - Copy the new key (starts with `gsk_`)

4. **Update Your `.env`:**
   ```bash
   # In backend/.env
   GROQ_API_KEY=gsk_YOUR_NEW_KEY_HERE
   ```

5. **Restart Backend:**
   ```bash
   # Kill the server (Ctrl+C if running)
   cd backend && npm start
   ```

---

## 🛡️ Security Best Practices

### Local Development ✅
- Keep `.env` file local only
- Use strong, random JWT secrets
- Rotate keys monthly or if exposed

### Before Production 🚀
1. **Generate new keys** for production environment
2. **Create production `.env`** with production keys only
3. **Use environment-specific secrets** (dev vs prod)
4. **Enable rate limiting** on backend APIs
5. **Monitor API usage** for unauthorized access

### If You Accidentally Commit Keys:
1. **Rotate keys immediately** (revoke old, create new)
2. **Amend git history** (use `git filter-branch` or `bfg`)
3. **Force push** (if not shared with team)
4. **Never force push public repos** — contact GitHub Security

---

## 📋 Checklist Before Sharing Repo

- [ ] `.env` is in `.gitignore` ✓ (already done)
- [ ] Never committed actual `.env` to Git ✓ (verify with `git log backend/.env`)
- [ ] `.env.example` has only placeholders
- [ ] No API keys in comments or README
- [ ] No keys in git history
- [ ] Backend API never returns keys to frontend ✓ (verified in code)

---

## 🔍 Verification Commands

### Check if `.env` was ever committed:
```bash
git log --all -- backend/.env
# Should show: "fatal: your filter must consume input in one pass"
# or list only deletions/gitignores
```

### Check if any keys are in git history:
```bash
# Search for common key prefixes in git
git log --all -p | grep -i "gsk_\|sk_\|Bearer\|GROQ_API_KEY="
# If nothing shows up, you're safe ✓
```

### Verify frontend never sends keys:
```bash
cd frontend
grep -r "GROQ_API_KEY\|Bearer.*gsk" src/
# Should return nothing — frontend doesn't know the key ✓
```

---

## ⚠️ What If Someone Gets Your Key?

**Impact:** They can use your Groq API quota (limited to 14,400 requests/day free tier)

**What They Can Do:**
- ❌ Access your videos (keys don't have video access)
- ❌ Modify your data (keys are read-only for most services)
- ✅ Use up your AI request quota

**What To Do:**
1. Immediately revoke the key at console.groq.com
2. Create a new key
3. Update `backend/.env`
4. Restart backend
5. Monitor your API usage for suspicious activity

---

## 🚀 Deployment (Future Reference)

When deploying to production:

### Environment Variables Setup
```bash
# Don't use .env files in production!
# Instead, set via platform:
#  - Heroku: Config Vars
#  - AWS: Secrets Manager
#  - Docker: --env or docker-compose.yml
#  - GitHub Actions: Secrets
```

### Example (Docker):
```bash
docker run \
  -e GROQ_API_KEY=gsk_xxx \
  -e SUPABASE_URL=https://... \
  -e JWT_SECRET=... \
  my-app:latest
```

---

## Summary

Your application is **secure by design**:
- API keys live only on backend
- Frontend has no access to keys
- Backend routes expose no sensitive data
- `.env` is properly ignored

**Just remember:** Don't screenshot or share your `.env` file, and you're good! ✅
