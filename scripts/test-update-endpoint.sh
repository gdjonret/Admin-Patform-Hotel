#!/bin/bash

# Test the update booking endpoint

echo "Testing PUT /api/admin/bookings/{id} endpoint..."
echo ""

# First, get a booking ID
echo "1. Getting a booking to test with..."
BOOKING=$(curl -s "http://localhost:8080/api/admin/bookings?tab=ALL&size=1")
BOOKING_ID=$(echo "$BOOKING" | jq -r '.content[0].id')

if [ -z "$BOOKING_ID" ] || [ "$BOOKING_ID" = "null" ]; then
    echo "❌ No bookings found in database"
    echo "Please create a booking first"
    exit 1
fi

echo "✅ Found booking ID: $BOOKING_ID"
echo ""

# Test the update endpoint
echo "2. Testing update endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "http://localhost:8080/api/admin/bookings/$BOOKING_ID" \
    -H "Content-Type: application/json" \
    -d '{
        "guestName": "Test Update",
        "guestEmail": "test@example.com",
        "checkInDate": "2025-01-15",
        "checkOutDate": "2025-01-18"
    }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS! Endpoint is working"
    echo ""
    echo "Response:"
    echo "$BODY" | jq '.'
else
    echo "❌ FAILED! Endpoint returned error"
    echo ""
    echo "Response:"
    echo "$BODY"
fi
