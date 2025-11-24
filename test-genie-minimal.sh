#!/bin/bash

# Minimal test to check if the API accepts the credentials

API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6ImU2MDkyYWM0LTNkYmEtNDY2Yy1iMGE3LTEzNzU2NmZkODFhZiIsImNvbXBhbnlJZCI6IjY5MWFmNTFiOTVhNDRhODY2MzkzYTgzNCIsImlhdCI6MTc2Mzc4Njg0MSwiZXhwIjo0OTE5NDYwNDQxfQ.CBoQW3aJauu9wtfFgPdVQCAqV9ZbS2YB93nFjw0kb40"
APP_ID="e6092ac4-3dba-466c-b0a7-137566fd81af"

echo "Test 1: Trying to GET application details..."
curl -s -X GET "https://api.geniebiz.lk/v1/applications/$APP_ID" \
  -H "Authorization: Bearer $API_KEY" | jq .

echo ""
echo "Test 2: Trying to GET payments list..."
curl -s -X GET "https://api.geniebiz.lk/v1/payments" \
  -H "Authorization: Bearer $API_KEY" | jq .

echo ""
echo "Test 3: Minimal payment request..."
curl -s -X POST https://api.geniebiz.lk/v1/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"amount\": 1000,
    \"currency\": \"LKR\"
  }" | jq .
