# Quick Verification Guide - 2026 Compliance Checklist

**Purpose:** Verify that the project meets all 10 compliance controls before production deployment.

**Duration:** ~15 minutes

**Prerequisites:**
- Project running locally or in staging
- curl or Postman available
- Access to database (optional, for index verification)

---

## ✅ Pre-Flight Checklist (5 min)

### Environment Variables
```bash
# Verify required env vars are set
[ ] JWT_SECRET is defined (test: echo "${JWT_SECRET:-MISSING}")
[ ] DATABASE_URL or SUPABASE_DB_URL is defined
[ ] OFFICIAL_PRODUCTION_DOMAIN is defined

# Recommended
[ ] SENTRY_DSN is defined (error tracking)
[ ] RESEND_API_KEY is defined (email)
```

### Backend Health
```bash
# Start backend
cd backend && npm install && npm start

# In another terminal, verify health endpoints
curl http://localhost:5000/health
# Expected: 200 {"status":"ok","uptime":123}

curl http://localhost:5000/api/health
# Expected: 200 {"status":"ok","database":"connected"}
```

### Test Suite
```bash
# All tests must pass
cd backend && npm test -- --runInBand --testTimeout=10000

# Expected output:
# Test Suites: 5 passed, 5 total
# Tests: 45 passed, 45 total
```

---

## ✅ Control 1: Authorization & Access Control (1 min)

**Verify:** User A cannot access User B's videos

```bash
# Register and login as User A
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"userA","password":"Pass123!"}'
# Response: {"token":"eyJ...","user":{...}}
TOKEN_A="eyJ..."

# Register and login as User B
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"userB","password":"Pass123!"}'
TOKEN_B="eyJ..."

# User A creates a video
curl -X POST http://localhost:5000/api/videos \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"title":"UserA Video"}'
# Response: {"id":"video-123","userId":"user-a",...}
VIDEO_ID="video-123"

# User B tries to access User A's video
curl -X GET http://localhost:5000/api/videos/$VIDEO_ID \
  -H "Authorization: Bearer $TOKEN_B"

# Expected: 403 Forbidden OR 404 Not Found (not 200 OK)
```

**✅ PASS** if response is 403 or 404  
**❌ FAIL** if response is 200 (ownership check broken)

---

## ✅ Control 2: Input Validation & Sanitization (1 min)

**Verify:** Invalid inputs are rejected with 422

```bash
# Test 1: Invalid email
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email"}'

# Expected: 422 VALIDATION_ERROR with details array

# Test 2: Weak password (<6 chars)
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"abcd1234","password":"weak"}'

# Expected: 422 VALIDATION_ERROR

# Test 3: HTML tag stripping (should accept but strip)
curl -X POST http://localhost:5000/api/videos \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"title":"<script>alert(1)</script>Video"}'

# Response should have title: "alert(1)Video" (tags stripped)
# Expected: 200 (or 422 depending on schema)
```

**✅ PASS** if invalid inputs return 422/400 and HTML is stripped  
**❌ FAIL** if invalid inputs are accepted as 200

---

## ✅ Control 3: CORS Configuration (1 min)

**Verify:** Disallowed origins are rejected

```bash
# Test 1: Localhost allowed
curl -X GET http://localhost:5000/api/videos \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Origin: http://localhost:3000"

# Expected: 200 (plus Access-Control-Allow-Origin: http://localhost:3000)

# Test 2: Random domain blocked (in browser context - can't fully test with curl)
# Note: curl doesn't fully simulate CORS, but header should be absent
curl -X GET http://localhost:5000/api/videos \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Origin: https://attacker.com" -v

# Expected: In real browser: CORS error
# With curl: headers show no Access-Control-Allow-Origin
```

**✅ PASS** if localhost is allowed and other origins show no CORS headers  
**❌ FAIL** if arbitrary origins get CORS headers

---

## ✅ Control 4: API Rate Limiting (2 min)

**Verify:** Requests are throttled after limit

```bash
# Make 101 requests within 15 minutes
for i in {1..101}; do
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    http://localhost:5000/api/videos \
    -H "Authorization: Bearer $TOKEN_A")
  
  if [ "$RESPONSE" == "429" ]; then
    echo "✅ Rate limit hit at request $i"
    break
  fi
done

# Expected: 429 appears somewhere around request 100

# Verify rate limit error message
curl -s http://localhost:5000/api/videos \
  -H "Authorization: Bearer $TOKEN_A" | grep -q "RATE_LIMITED"
```

**✅ PASS** if 429 is returned after ~100 requests  
**❌ FAIL** if requests never get rate limited

---

## ✅ Control 5: Secure Password Reset (3 min)

**Verify:** Token is one-time-use and expires after 30 min

```bash
# Step 1: Request password reset
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com"}'

# Response: message about email sent (check logs or dev console)
# Extract token from email (or from log if using dev fallback)
RESET_TOKEN="abc123..."

# Step 2: Use token to reset password (first use - SHOULD SUCCEED)
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$RESET_TOKEN\",\"password\":\"NewPass123!\"}"

# Expected: 200 OK "Password reset successful"

# Step 3: Reuse same token (second use - SHOULD FAIL)
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$RESET_TOKEN\",\"password\":\"AnotherPass123!\"}"

# Expected: 400 "Invalid or expired token"

# Step 4: Verify token expires after 30 min (manual test)
# - Request reset token at time T
# - Wait 31 minutes
# - Attempt to use token at time T+31m
# - Expected: 400 "Expired token"
```

**✅ PASS** if token works once then fails on reuse, and expires after 30 min  
**❌ FAIL** if token can be reused multiple times

---

## ✅ Control 6: Error Handling (1 min)

**Verify:** Errors don't expose stack traces to clients

```bash
# Trigger 401 (missing auth)
curl -s http://localhost:5000/api/videos | jq .

# Expected body:
# { "error": "Authentication required. Please log in.", "code": "UNAUTHENTICATED" }
# NO "stack" field visible

# Trigger 400 (validation error)
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

# Expected body:
# { "error": "Validation failed", "code": "VALIDATION_ERROR", "details": [...] }
# NO "stack" field or sensitive internals

# Test Error Boundary (frontend)
# - Open browser dev console
# - Navigate to http://localhost:3000/reset-password?token=invalid
# - Force a React error by breaking the page (modify DOM manually)
# - Expected: Friendly fallback UI with "Something went wrong"
```

**✅ PASS** if no stack traces or internals visible in error responses  
**❌ FAIL** if stack traces are shown to clients

---

## ✅ Control 7: Database Optimization (1 min)

**Verify:** Indexes exist on high-frequency lookup columns

```bash
# For SQLite (test environment)
sqlite3 backend/h5p.db ".indices"

# Expected output includes:
# idx_users_email
# idx_users_reset_token
# idx_videos_user_id
# idx_videos_status

# For PostgreSQL/Supabase
psql -d your_database -c "\di"

# Expected: listing of idx_* indexes on Users and Videos tables
```

**✅ PASS** if all expected indexes exist  
**❌ FAIL** if critical indexes are missing

---

## ✅ Control 8: Observability & Logging (1 min)

**Verify:** Logs are structured and don't contain secrets

```bash
# Check logs for PII / secrets
cd backend && npm start > logs.txt 2>&1 &

# Make a request with sensitive data
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# Stop server
kill %1

# Check logs - should NOT contain
grep -E "(password|token|secret|email=)" logs.txt
# Expected: empty (no matches)

# Check logs - SHOULD contain
grep -E "(requestId|method|statusCode)" logs.txt
# Expected: multiple matches with metadata
```

**✅ PASS** if logs have structured metadata and no plaintext secrets  
**❌ FAIL** if passwords, tokens, or emails appear in plain text

---

## ✅ Control 9: System Monitoring & Alerts (1 min)

**Verify:** Health endpoints and error tracking are configured

```bash
# Health endpoint responds
curl -s http://localhost:5000/health | jq .
# Expected: {"status":"ok","uptime":12345}

curl -s http://localhost:5000/api/health | jq .
# Expected: {"status":"ok","database":"connected"}

# Sentry integration (if configured)
if [ ! -z "$SENTRY_DSN" ]; then
  # Check environment variable
  echo "✅ SENTRY_DSN is set"
  
  # Trigger an error and check Sentry dashboard within 2 min
  # Expected: Error appears in Sentry with requestId and userId
else
  echo "⚠️  SENTRY_DSN not configured (development mode)"
fi
```

**✅ PASS** if health endpoints respond and Sentry is configured (if prod)  
**⚠️  WARN** if Sentry not configured (OK for staging)

---

## ✅ Control 10: Deployment Resilience (2 min)

**Verify:** Container is working and can rollback

```bash
# Build Docker image
docker build -t h5p-api:test .

# Run container with health check
docker run --rm -p 5000:5000 \
  -e JWT_SECRET="test-secret" \
  -e DATABASE_URL="sqlite:///h5p.db" \
  h5p-api:test

# In another terminal, wait 10 seconds for startup then test
sleep 10
curl http://localhost:5000/health

# Expected: 200 OK with health data

# Verify container health check
docker inspect h5p-api:test | jq '.[] | .HealthCheck'

# Expected: health check is defined and uses /health endpoint
```

**✅ PASS** if image builds, runs, and health check works  
**❌ FAIL** if build fails or health check is missing

---

## Summary Report Template

Use this template to document compliance verification:

```markdown
# Compliance Verification Report

**Date:** [date]
**Environment:** Local / Staging / Production
**Verifier:** [name]

## Results

| Control | Test | Status | Evidence |
|---------|------|--------|----------|
| 1. Authorization | Cross-user access blocked | ✅ PASS | Returns 403 |
| 2. Input Validation | Invalid email rejected | ✅ PASS | Returns 422 |
| 3. CORS | Disallowed origin blocked | ✅ PASS | No CORS header |
| 4. Rate Limiting | 429 after threshold | ✅ PASS | 429 at request 101 |
| 5. Password Reset | One-time token | ✅ PASS | Reuse fails |
| 6. Error Handling | No stack traces | ✅ PASS | Clean error objects |
| 7. DB Optimization | Indexes exist | ✅ PASS | All indexes present |
| 8. Logging | No secrets in logs | ✅ PASS | No passwords visible |
| 9. Monitoring | Health endpoints OK | ✅ PASS | /health responds 200 |
| 10. Resilience | Docker builds | ✅ PASS | Image runs with healthcheck |

## Overall Status: ✅ FULLY COMPLIANT

All 10 controls verified. Ready for production deployment.

**Approver:** _________________  
**Sign-off Date:** _________________
```

---

## Troubleshooting

### Control 1 fails (ownership not blocked)
- Check: `backend/middleware/rbac.js` is imported in routes
- Check: Route includes `requireOwnership(...)` middleware
- Fix: Manually add ownership check to getUserVideo route

### Control 2 fails (invalid input accepted)
- Check: `validate(schema)` middleware is used on route
- Check: Zod schema constraints are correct
- Fix: Adjust schema min/max/format rules

### Control 4 fails (no rate limiting)
- Check: `backend/server.js` has `rateLimit` middleware
- Check: Rate limiter is applied to `/api/*`
- Fix: npm install express-rate-limit && restart

### Control 5 fails (token reusable)
- Check: `resetToken` is cleared in User.update() after reset
- Check: Token is hashed before storage
- Fix: Review authRoutes.js password reset logic

### Control 7 fails (no indexes)
- Check: Database migration ran: `npm run migrate:indexes`
- Check: Database dialect is correct (SQLite/PostgreSQL)
- Fix: Run `backend/scripts/addIndexes.js` manually

### All tests fail
- Check: Node version >=14
- Check: npm install completed in /backend
- Fix: `cd backend && npm install && npm test`

---

**For questions, contact the security team.**

**Last updated:** February 2026
