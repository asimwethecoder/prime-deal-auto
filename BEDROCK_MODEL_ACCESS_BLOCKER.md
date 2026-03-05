# Bedrock Model Access Blocker - AI Chat Assistant

**Date:** March 4, 2026  
**Status:** ⏸️ BLOCKED - Waiting for AWS Bedrock Model Access Approval

---

## Current Situation

The AI Chat Assistant feature is **fully implemented and deployed**, but cannot be tested because AWS Bedrock model access has not been granted yet.

### What's Deployed

✅ **Backend Implementation (Complete)**
- VPC Proxy Lambda pattern implemented (cost-optimized, no NAT Gateway)
- Chat Lambda (no VPC) - handles Bedrock calls
- VPC Proxy Lambda (in VPC) - handles database operations
- All repositories, services, and handlers implemented
- Rate limiting (10 messages/minute per user)
- Tool use pattern with `search_cars` and `get_car_details` tools
- NO FINANCING policy enforced in system prompt

✅ **Infrastructure (Deployed)**
- API Gateway routes configured: `POST /chat`, `GET/DELETE /chat/sessions`, `GET/DELETE /chat/sessions/{id}`
- Both Lambdas deployed with proper IAM permissions
- CloudWatch logging enabled
- API endpoint: `https://urwy8bxz7g.execute-api.us-east-1.amazonaws.com/v1/chat`

✅ **Database Schema**
- `chat_sessions` table created
- `chat_messages` table created
- `leads` table ready for AI-generated leads

### The Problem

**Error:** `ValidationException: Operation not allowed`

**Root Cause:** New AWS accounts require explicit model access approval for Anthropic Claude models, even for older versions like Claude 3.5 Sonnet v2.

**Current Configuration:**
- Model ID: `anthropic.claude-3-5-sonnet-20241022-v2:0` (temporary)
- Target Model: `anthropic.claude-sonnet-4-20250514-v1:0` (preferred)
- Region: `us-east-1`

---

## Action Required

### Step 1: Request Model Access (Root Account Required)

1. **Log into AWS root account** (Account ID: 141814481613)
2. **Navigate to Bedrock Model Access:**
   - URL: https://console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess
   - Or: Bedrock Console → Left sidebar → "Model access"
3. **Click "Manage model access" or "Request model access"**
4. **Find "Anthropic" in the provider list**
5. **Check the box for Claude Sonnet 4** (and optionally Claude 3.5 Sonnet v2 as backup)
6. **Paste the use case description below:**

```
AI-powered sales assistant for Prime Deal Auto, an automotive dealership in South Africa. The assistant helps customers discover vehicles, answers questions about inventory, provides recommendations, and captures leads. Deployed via AWS Lambda using Bedrock Converse API with tool-based architecture for real-time inventory queries. Expected volume: 100-5,000 conversations/month. Claude Sonnet 4 selected for superior reasoning and multi-turn conversation capabilities essential for automotive sales.
```

7. **Submit the request**

**Expected Approval Time:** Minutes to a few hours (typically very fast for Anthropic models)

---

## After Approval - Resume Steps

### Step 2: Update Infrastructure to Claude Sonnet 4

Once model access is approved, update the API stack:

```bash
# Navigate to infrastructure directory
cd infrastructure

# Update api-stack.ts:
# 1. Change BEDROCK_MODEL_ID from 'anthropic.claude-3-5-sonnet-20241022-v2:0'
#    to 'anthropic.claude-sonnet-4-20250514-v1:0'
# 2. Update IAM policy resource ARN to Claude Sonnet 4

# Deploy the updated stack
npx cdk deploy PrimeDeals-Api --profile prime-deal-auto --require-approval never
```

**Files to update:**
- `infrastructure/lib/stacks/api-stack.ts` (lines ~210 and ~245)

### Step 3: Test the Chat Endpoint

```bash
# Test with the sample payload
$body = Get-Content test-chat-payload.json -Raw
Invoke-RestMethod -Uri "https://urwy8bxz7g.execute-api.us-east-1.amazonaws.com/v1/chat" -Method Post -Body $body -ContentType "application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "...",
    "sessionToken": "...",
    "conversationId": "..."
  }
}
```

### Step 4: Verify VPC Proxy Lambda

Check CloudWatch logs for both Lambdas:
```bash
# Chat Lambda logs
aws logs tail /aws/lambda/PrimeDeals-Api-ChatHandler6667856F-yrfgv2SdIOnw --follow --profile prime-deal-auto

# VPC Proxy Lambda logs
aws logs tail /aws/lambda/PrimeDeals-Api-VpcProxyHandlerE518F785-vrKQeff5GbwY --follow --profile prime-deal-auto
```

### Step 5: Mark Tasks Complete

Update `.kiro/specs/ai-chat-assistant/tasks.md`:
- Mark Task 10 (Testing) as complete
- Mark Task 11 (Infrastructure) as complete
- Close out the spec

---

## Technical Details

### VPC Proxy Lambda Pattern Benefits
- **Cost Savings:** Avoids NAT Gateway ($33-70/month) by keeping Chat Lambda outside VPC
- **Performance:** Chat Lambda calls Bedrock directly without VPC overhead
- **Security:** Database operations still isolated in VPC via Proxy Lambda
- **Extra Cost:** ~$0-2/month for additional Lambda invocations

### Architecture Flow
```
User → API Gateway → Chat Lambda (no VPC)
                     ↓
                     Bedrock (Claude Sonnet 4)
                     ↓
                     VPC Proxy Lambda (in VPC)
                     ↓
                     RDS Proxy → Aurora PostgreSQL
```

### Current Lambda Configuration
- **Chat Lambda:**
  - Memory: 1024 MB
  - Timeout: 60 seconds
  - No VPC attachment
  - Environment: `BEDROCK_MODEL_ID`, `VPC_PROXY_FUNCTION_NAME`, `FRONTEND_URL`

- **VPC Proxy Lambda:**
  - Memory: 512 MB
  - Timeout: 30 seconds
  - VPC: Private isolated subnets
  - Environment: `DB_HOST`, `DB_NAME`, `SECRET_ARN`

---

## Files Modified in This Implementation

### Backend
- `backend/src/chat-lambda.ts` - Standalone Chat Lambda handler
- `backend/src/vpc-proxy.ts` - VPC Proxy Lambda handler
- `backend/src/lib/vpc-proxy-client.ts` - Client for invoking VPC Proxy
- `backend/src/lib/bedrock.ts` - Bedrock client with NO FINANCING policy
- `backend/src/repositories/chat-session.repository.ts`
- `backend/src/repositories/chat-message.repository.ts`
- `backend/src/repositories/lead.repository.ts`
- `backend/src/types/chat.types.ts`
- `backend/src/services/chat.service.ts` (OLD - no longer used by chat endpoints)
- `backend/src/handlers/chat.handler.ts` (OLD - no longer used)
- `backend/src/lambda.ts` (cleaned up - chat routes removed)

### Infrastructure
- `infrastructure/lib/stacks/api-stack.ts` - Added both Lambdas, API routes, IAM policies

### Dependencies Added
- `@aws-sdk/client-lambda` - For VPC Proxy invocation

---

## Contact & Support

**AWS Account:** 141814481613  
**Region:** us-east-1  
**Profile:** prime-deal-auto  
**API Endpoint:** https://urwy8bxz7g.execute-api.us-east-1.amazonaws.com/v1/

**Next Action:** Request Bedrock model access via root account, then resume testing.
