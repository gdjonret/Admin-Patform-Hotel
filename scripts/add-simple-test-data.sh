#!/bin/bash

# Simple script to add visible test bookings
# Uses correct endpoint: /api/public/bookings

BASE_URL="http://localhost:8080"

echo "🏨 Adding Simple Test Bookings"
echo "==============================="
echo ""

# 1. PENDING booking
echo "1. Creating PENDING booking..."
curl -s -X POST "$BASE_URL/api/public/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "guestName": "Alice Johnson - TEST",
    "guestEmail": "alice.test@email.com",
    "guestPhone": "+237670000001",
    "checkInDate": "2025-10-10",
    "checkOutDate": "2025-10-12",
    "roomTypeId": 2,
    "adults": 2,
    "kids": 1,
    "totalPrice": 150000,
    "pricePerNight": 75000,
    "currency": "XAF"
  }' | jq -r '.id // "Created"'

echo "✓ PENDING booking created"
echo ""

# 2. CONFIRMED booking (for Arrivals - arriving today)
echo "2. Creating ARRIVALS booking (today)..."
ARRIVAL=$(curl -s -X POST "$BASE_URL/api/public/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "guestName": "Bob Smith - TEST ARRIVAL",
    "guestEmail": "bob.test@email.com",
    "guestPhone": "+237670000002",
    "checkInDate": "2025-10-07",
    "checkOutDate": "2025-10-09",
    "roomTypeId": 2,
    "adults": 2,
    "kids": 0,
    "totalPrice": 100000,
    "pricePerNight": 50000,
    "currency": "XAF"
  }')

ARRIVAL_ID=$(echo $ARRIVAL | jq -r '.id')
echo "Created booking ID: $ARRIVAL_ID"

# Confirm it
if [ ! -z "$ARRIVAL_ID" ] && [ "$ARRIVAL_ID" != "null" ]; then
  curl -s -X POST "$BASE_URL/api/admin/bookings/$ARRIVAL_ID/confirm" > /dev/null
  echo "✓ ARRIVAL booking confirmed"
fi
echo ""

# 3. IN-HOUSE booking (checked in)
echo "3. Creating IN-HOUSE booking..."
INHOUSE=$(curl -s -X POST "$BASE_URL/api/public/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "guestName": "Carol Davis - TEST IN-HOUSE",
    "guestEmail": "carol.test@email.com",
    "guestPhone": "+237670000003",
    "checkInDate": "2025-10-06",
    "checkOutDate": "2025-10-09",
    "roomTypeId": 2,
    "adults": 2,
    "kids": 0,
    "totalPrice": 150000,
    "pricePerNight": 50000,
    "currency": "XAF"
  }')

INHOUSE_ID=$(echo $INHOUSE | jq -r '.id')
echo "Created booking ID: $INHOUSE_ID"

# Confirm and check-in
if [ ! -z "$INHOUSE_ID" ] && [ "$INHOUSE_ID" != "null" ]; then
  curl -s -X POST "$BASE_URL/api/admin/bookings/$INHOUSE_ID/confirm" > /dev/null
  curl -s -X POST "$BASE_URL/api/admin/bookings/$INHOUSE_ID/check-in" \
    -H "Content-Type: application/json" \
    -d '{"checkInTime": "14:30"}' > /dev/null
  
  # Add partial payment
  curl -s -X POST "$BASE_URL/api/admin/bookings/$INHOUSE_ID/payments" \
    -H "Content-Type: application/json" \
    -d '{"amount": 100000, "paymentMethod": "Cash", "notes": "Partial payment"}' > /dev/null
  
  echo "✓ IN-HOUSE booking created and checked in (50,000 FCFA outstanding)"
fi
echo ""

# 4. DEPARTURE booking (checking out today)
echo "4. Creating DEPARTURE booking..."
DEPARTURE=$(curl -s -X POST "$BASE_URL/api/public/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "guestName": "David Wilson - TEST DEPARTURE",
    "guestEmail": "david.test@email.com",
    "guestPhone": "+237670000004",
    "checkInDate": "2025-10-06",
    "checkOutDate": "2025-10-07",
    "roomTypeId": 2,
    "adults": 1,
    "kids": 0,
    "totalPrice": 50000,
    "pricePerNight": 50000,
    "currency": "XAF"
  }')

DEPARTURE_ID=$(echo $DEPARTURE | jq -r '.id')
echo "Created booking ID: $DEPARTURE_ID"

# Confirm and check-in
if [ ! -z "$DEPARTURE_ID" ] && [ "$DEPARTURE_ID" != "null" ]; then
  curl -s -X POST "$BASE_URL/api/admin/bookings/$DEPARTURE_ID/confirm" > /dev/null
  curl -s -X POST "$BASE_URL/api/admin/bookings/$DEPARTURE_ID/check-in" \
    -H "Content-Type: application/json" \
    -d '{"checkInTime": "15:00"}' > /dev/null
  
  # Add partial payment
  curl -s -X POST "$BASE_URL/api/admin/bookings/$DEPARTURE_ID/payments" \
    -H "Content-Type: application/json" \
    -d '{"amount": 30000, "paymentMethod": "Card", "notes": "Deposit"}' > /dev/null
  
  echo "✓ DEPARTURE booking created (20,000 FCFA outstanding)"
fi
echo ""

# 5. UPCOMING booking
echo "5. Creating UPCOMING booking..."
curl -s -X POST "$BASE_URL/api/public/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "guestName": "Emma Brown - TEST UPCOMING",
    "guestEmail": "emma.test@email.com",
    "guestPhone": "+237670000005",
    "checkInDate": "2025-10-15",
    "checkOutDate": "2025-10-17",
    "roomTypeId": 2,
    "adults": 2,
    "kids": 1,
    "totalPrice": 100000,
    "pricePerNight": 50000,
    "currency": "XAF"
  }' | jq -r '.id // "Created"'

echo "✓ UPCOMING booking created"
echo ""

echo "==============================="
echo "✅ Test Data Created!"
echo ""
echo "📊 You should now see:"
echo "  • Pending: Alice Johnson"
echo "  • Arrivals: Bob Smith (today)"
echo "  • In-House: Carol Davis (50k outstanding)"
echo "  • Departures: David Wilson (20k outstanding)"
echo "  • Upcoming: Emma Brown"
echo ""
echo "🌐 Refresh http://localhost:8000 to see the bookings"
echo ""
