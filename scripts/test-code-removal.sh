#!/bin/bash

echo "=========================================="
echo "Testing Code Field Removal"
echo "=========================================="
echo ""

# Get authentication token (assuming you have a test user)
# Replace with your actual credentials
TOKEN="your-jwt-token-here"

echo "1. Testing GET /api/admin/room-types"
echo "--------------------------------------"
curl -s -X GET http://localhost:8080/api/admin/room-types \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

echo "2. Testing POST /api/admin/room-types (Create without code)"
echo "--------------------------------------"
curl -s -X POST http://localhost:8080/api/admin/room-types \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Room Type",
    "capacity": 2,
    "baseRate": 30000,
    "sortOrder": 10,
    "active": true,
    "amenitiesJson": "{\"equipment\":[\"Air conditioning\"],\"amenities\":[\"Free Wi-Fi\"]}"
  }' | jq '.'
echo ""
echo ""

echo "3. Testing GET /api/public/room-types"
echo "--------------------------------------"
curl -s -X GET http://localhost:8080/api/public/room-types \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

echo "=========================================="
echo "✅ All tests completed!"
echo "=========================================="
echo ""
echo "Expected results:"
echo "- No 'code' field in any response"
echo "- POST request succeeds without 'code' field"
echo "- All room types returned successfully"
