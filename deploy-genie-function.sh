#!/bin/bash

echo "🚀 Deploying Genie Payment Cloud Function"
echo "========================================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found!"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

echo "📝 Step 1: Setting Genie credentials in Firebase Functions config..."
echo ""
echo "Please enter your Genie credentials:"
echo ""

# Application ID (already known)
APPLICATION_ID="3a374c7d-f339-4a98-8491-44458c116be2"
echo "Application ID: $APPLICATION_ID"

# Ask for API Key
read -sp "Enter Genie API Key (JWT): " API_KEY
echo ""

if [ -z "$API_KEY" ]; then
    echo "❌ API Key cannot be empty!"
    exit 1
fi

# Set Firebase Functions config
echo ""
echo "Setting Firebase config..."
firebase functions:config:set \
  genie.application_id="$APPLICATION_ID" \
  genie.api_key="$API_KEY"

if [ $? -eq 0 ]; then
    echo "✅ Firebase config set successfully!"
else
    echo "❌ Failed to set Firebase config"
    exit 1
fi

echo ""
echo "📦 Step 2: Deploying Cloud Function..."
firebase deploy --only functions:geniePayment

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🎉 Next steps:"
    echo "1. Test the payment at http://localhost:8082/test-genie-payment"
    echo "2. Check Cloud Function logs: firebase functions:log --only geniePayment"
    echo "3. Monitor in Firebase Console > Functions"
    echo ""
    echo "📍 Cloud Function URL:"
    echo "https://us-central1-bidhora.cloudfunctions.net/geniePayment"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Check the error messages above"
    exit 1
fi
