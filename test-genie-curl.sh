#!/bin/bash

# Test Genie Payment API with curl
# This helps diagnose the 403 Forbidden error

API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6ImU2MDkyYWM0LTNkYmEtNDY2Yy1iMGE3LTEzNzU2NmZkODFhZiIsImNvbXBhbnlJZCI6IjY5MWFmNTFiOTVhNDRhODY2MzkzYTgzNCIsImlhdCI6MTc2Mzc4Njg0MSwiZXhwIjo0OTE5NDYwNDQxfQ.CBoQW3aJauu9wtfFgPdVQCAqV9ZbS2YB93nFjw0kb40"
APP_ID="e6092ac4-3dba-466c-b0a7-137566fd81af"

echo "Testing Genie Payment API..."
echo "================================"

curl -v -X POST https://api.geniebiz.lk/v1/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"applicationId\": \"$APP_ID\",
    \"amount\": 1000,
    \"currency\": \"LKR\",
    \"reference\": \"TEST_$(date +%s)\",
    \"description\": \"Test Payment\",
    \"customer\": {
      \"name\": \"Test Customer\",
      \"email\": \"test@example.com\",
      \"phone\": \"0771234567\"
    },
    \"redirectUrl\": \"https://bidhora.com/payment-success\",
    \"cancelUrl\": \"https://bidhora.com/payment-cancel\",
    \"webhookUrl\": \"https://bidhora.com/api/payment-notify\"
  }"

echo ""
echo "================================"
echo "Check the response above for error details"
