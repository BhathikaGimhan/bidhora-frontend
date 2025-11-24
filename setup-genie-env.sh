#!/bin/bash

# Genie Payment Gateway - Environment Setup Script
# This script creates/updates your .env file with Genie credentials

echo "🚀 Setting up Genie Payment Gateway credentials..."
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists. Creating backup..."
    cp .env .env.backup
    echo "✅ Backup created: .env.backup"
fi

# Genie Credentials
APPLICATION_ID="3a374c7d-f339-4a98-8491-44458c116be2"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjNhMzc0YzdkLWYzMzktNGE5OC04NDkxLTQ0NDU4YzExNmJlMiIsImNvbXBhbnlJZCI6IjY5MWFmNTFiOTVhNDRhODY2MzkzYTgzNCIsImlhdCI6MTc2MzM3NDM2MywiZXhwIjo0OTE5MDQ3OTYzfQ.4xstJOgVULqR4XDVohf_-a4A4RYuBPd3njQak7XmxmM"
PUBLIC_KEY="pk_production_ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpJam9pTmpreFlXWTFNV0k1TldFME5HRTROall6T1ROaE9ETTBJaXdpYUNJNkltaDBkSEJ6T2k4dlpHRnphR0p2WVhKa0xtZGxibWxsWW1sNkxteHJJaXdpWVNJNklqTmhNemMwWXpka0xXWXpNemt0TkdFNU9DMDRORGt4TFRRME5EVTRZekV4Tm1KbE1pSXNJblZ4SWpvaU0yUXdZakpqTW1RdE5EUXpaaTAwTkdWakxXSXhZamt0WldRMk1qRmlPVEEzWVdVMElpd2lhV0YwSWpveE56WXpNemMwTXpZekxDSmxlSEFpT2pRNU1Ua3dORGM1TmpOOS44OTlTd0lKVElKR2RPMENlaWVOeGk5Wl91b"

# Create or update .env file
cat > .env << EOF
# Genie Payment Gateway Configuration
VITE_GENIE_APPLICATION_ID=${APPLICATION_ID}
VITE_GENIE_API_KEY=${API_KEY}
VITE_GENIE_PUBLIC_KEY=${PUBLIC_KEY}

# Add your Firebase configuration below if not already present
# VITE_FIREBASE_API_KEY=your_firebase_api_key
# VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
# VITE_FIREBASE_PROJECT_ID=your_project_id
# VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
# VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
# VITE_FIREBASE_APP_ID=your_app_id
EOF

echo ""
echo "✅ Genie credentials added to .env file!"
echo ""
echo "📋 Configuration Summary:"
echo "  • Application ID: ${APPLICATION_ID}"
echo "  • API Key: ••••••••"
echo "  • Public Key: ••••••••"
echo ""
echo "🧪 Test your integration:"
echo "  1. Run: npm run dev"
echo "  2. Visit: http://localhost:8080/test-genie-payment"
echo ""
echo "⚠️  Note: Remember to add your Firebase credentials to .env if not already present!"
