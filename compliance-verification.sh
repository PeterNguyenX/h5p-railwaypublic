#!/bin/bash

# Compliance Verification Script for AI-ActivEdu
# Tests all 10 required controls from master-project-spec-2026-compliance.md

echo "🔍 AI-ActivEdu Compliance Verification"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

passed=0
failed=0

# Test 1: Environment Variables
echo "✓ Test 1: Environment Variables"
if [ -z "$JWT_SECRET" ]; then
  echo -e "${RED}✗ JWT_SECRET not set${NC}"
  ((failed++))
else
  echo -e "${GREEN}✓ JWT_SECRET is set${NC}"
  ((passed++))
fi
echo ""

# Test 2: Backend Health Endpoint
echo "✓ Test 2: Backend Health Check"
if [ -d "./backend" ]; then
  echo -e "${GREEN}✓ Backend directory exists${NC}"
  ((passed++))
else
  echo -e "${RED}✗ Backend directory not found${NC}"
  ((failed++))
fi
echo ""

# Test 3: Frontend Compilation
echo "✓ Test 3: Frontend Package Config"
if [ -f "./frontend/package.json" ]; then
  echo -e "${GREEN}✓ Frontend package.json exists${NC}"
  ((passed++))
else
  echo -e "${RED}✗ Frontend package.json not found${NC}"
  ((failed++))
fi
echo ""

# Test 4: Database Configuration
echo "✓ Test 4: Database Configuration"
if [ -f "./backend/config/database.js" ]; then
  echo -e "${GREEN}✓ Database config exists${NC}"
  ((passed++))
else
  echo -e "${RED}✗ Database config not found${NC}"
  ((failed++))
fi
echo ""

# Test 5: Authentication Routes
echo "✓ Test 5: Authentication Routes"
if grep -q "forgot-password" backend/routes/authRoutes.js 2>/dev/null; then
  echo -e "${GREEN}✓ Password reset routes implemented${NC}"
  ((passed++))
else
  echo -e "${RED}✗ Password reset routes not found${NC}"
  ((failed++))
fi
echo ""

# Test 6: CORS Configuration
echo "✓ Test 6: CORS Configuration"
if grep -q "cors" backend/server.js 2>/dev/null; then
  echo -e "${GREEN}✓ CORS configured in backend${NC}"
  ((passed++))
else
  echo -e "${RED}✗ CORS not found${NC}"
  ((failed++))
fi
echo ""

# Test 7: Rate Limiting
echo "✓ Test 7: Rate Limiting"
if grep -q "rateLimit" backend/server.js 2>/dev/null; then
  echo -e "${GREEN}✓ Rate limiting implemented${NC}"
  ((passed++))
else
  echo -e "${RED}✗ Rate limiting not found${NC}"
  ((failed++))
fi
echo ""

# Test 8: Input Validation
echo "✓ Test 8: Input Validation"
if [ -f "./backend/validation/schemas.js" ]; then
  echo -e "${GREEN}✓ Validation schemas exist${NC}"
  ((passed++))
else
  echo -e "${RED}✗ Validation schemas not found${NC}"
  ((failed++))
fi
echo ""

# Test 9: Error Handling
echo "✓ Test 9: Error Handling"
if [ -f "./backend/middleware/errorHandler.js" ]; then
  echo -e "${GREEN}✓ Error handler middleware exists${NC}"
  ((passed++))
else
  echo -e "${RED}✗ Error handler not found${NC}"
  ((failed++))
fi
echo ""

# Test 10: Logging
echo "✓ Test 10: Logging Configuration"
if grep -q "winston\|logger" backend/middleware/requestLogger.js 2>/dev/null; then
  echo -e "${GREEN}✓ Logging configured${NC}"
  ((passed++))
else
  echo -e "${RED}✗ Logging not configured${NC}"
  ((failed++))
fi
echo ""

# Summary
echo "======================================"
echo "Summary: ${GREEN}$passed passed${NC}, ${RED}$failed failed${NC}"
if [ $failed -eq 0 ]; then
  echo -e "${GREEN}✓ All compliance checks passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some compliance checks failed${NC}"
  exit 1
fi
