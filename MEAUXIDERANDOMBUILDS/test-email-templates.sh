#!/bin/bash

# Test Email Templates Script
# This script seeds the email templates and sends test emails

API_URL="${API_URL:-https://inneranimalmedia-dev.meauxbility.workers.dev}"
TEST_EMAIL="${TEST_EMAIL:-meauxbility@gmail.com}"

echo "🚀 Testing Email Templates..."
echo "API URL: $API_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

# Step 1: Seed email templates
echo "📧 Step 1: Seeding email templates..."
SEED_RESPONSE=$(curl -s -X POST "$API_URL/api/email-templates/seed" \
  -H "Content-Type: application/json" \
  -H "Origin: https://inneranimalmedia.com")

echo "Seed Response: $SEED_RESPONSE"
echo ""

# Step 2: Wait a moment for templates to be saved
sleep 2

# Step 3: Send test emails
echo "📨 Step 2: Sending test emails to $TEST_EMAIL..."
TEST_RESPONSE=$(curl -s -X POST "$API_URL/api/email-templates/test" \
  -H "Content-Type: application/json" \
  -H "Origin: https://inneranimalmedia.com" \
  -d "{\"email\": \"$TEST_EMAIL\"}")

echo "Test Response: $TEST_RESPONSE"
echo ""

# Parse and display results
echo "✅ Test complete! Check your email at $TEST_EMAIL"
