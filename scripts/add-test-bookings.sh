#!/bin/bash

# Script to add test bookings for all tabs
# Run this to populate your admin platform with sample data

BASE_URL="http://localhost:8080"

echo "🏨 Adding Test Bookings to Admin Platform"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get today's date and calculate dates
TODAY=$(date +%Y-%m-%d)
YESTERDAY=$(date -v-1d +%Y-%m-%d)
TOMORROW=$(date -v+1d +%Y-%m-%d)
IN_2_DAYS=$(date -v+2d +%Y-%m-%d)
IN_3_DAYS=$(date -v+3d +%Y-%m-%d)
IN_5_DAYS=$(date -v+5d +%Y-%m-%d)
IN_7_DAYS=$(date -v+7d +%Y-%m-%d)
LAST_WEEK=$(date -v-7d +%Y-%m-%d)
LAST_WEEK_END=$(date -v-5d +%Y-%m-%d)

echo -e "${BLUE}📅 Date Reference:${NC}"
echo "Today: $TODAY"
echo "Tomorrow: $TOMORROW"
echo ""

# 1. PENDING TAB - Unconfirmed bookings
echo -e "${YELLOW}1. Creating PENDING bookings...${NC}"

curl -s -X POST "$BASE_URL/api/admin/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"guestName\": \"Alice Johnson\",
    \"guestEmail\": \"alice.johnson@email.com\",
    \"guestPhone\": \"+237670000001\",
    \"checkInDate\": \"$IN_3_DAYS\",
    \"checkOutDate\": \"$IN_5_DAYS\",
    \"roomType\": \"Deluxe Room\",
    \"adults\": 2,
    \"kids\": 1,
    \"totalPrice\": 150000,
    \"pricePerNight\": 75000,
    \"currency\": \"XAF\",
    \"status\": \"PENDING\"
  }" > /dev/null

curl -s -X POST "$BASE_URL/api/admin/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"guestName\": \"Bob Williams\",
    \"guestEmail\": \"bob.williams@email.com\",
    \"guestPhone\": \"+237670000002\",
    \"checkInDate\": \"$IN_5_DAYS\",
    \"checkOutDate\": \"$IN_7_DAYS\",
    \"roomType\": \"Standard Room\",
    \"adults\": 1,
    \"kids\": 0,
    \"totalPrice\": 100000,
    \"pricePerNight\": 50000,
    \"currency\": \"XAF\",
    \"status\": \"PENDING\"
  }" > /dev/null

echo -e "${GREEN}✓ Added 2 PENDING bookings${NC}"
echo ""

# 2. ARRIVALS TAB - Confirmed bookings arriving today
echo -e "${YELLOW}2. Creating ARRIVALS (today's check-ins)...${NC}"

# Arrival 1 - No deposit
ARRIVAL_1=$(curl -s -X POST "$BASE_URL/api/admin/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"guestName\": \"Carol Martinez\",
    \"guestEmail\": \"carol.martinez@email.com\",
    \"guestPhone\": \"+237670000003\",
    \"checkInDate\": \"$TODAY\",
    \"checkOutDate\": \"$IN_3_DAYS\",
    \"roomType\": \"Suite\",
    \"adults\": 2,
    \"kids\": 0,
    \"totalPrice\": 300000,
    \"pricePerNight\": 100000,
    \"currency\": \"XAF\",
    \"status\": \"CONFIRMED\"
  }")

ARRIVAL_1_ID=$(echo $ARRIVAL_1 | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)

# Arrival 2 - With deposit
ARRIVAL_2=$(curl -s -X POST "$BASE_URL/api/admin/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"guestName\": \"David Chen\",
    \"guestEmail\": \"david.chen@email.com\",
    \"guestPhone\": \"+237670000004\",
    \"checkInDate\": \"$TODAY\",
    \"checkOutDate\": \"$IN_2_DAYS\",
    \"roomType\": \"Deluxe Room\",
    \"adults\": 2,
    \"kids\": 1,
    \"totalPrice\": 150000,
    \"pricePerNight\": 75000,
    \"currency\": \"XAF\",
    \"status\": \"CONFIRMED\"
  }")

ARRIVAL_2_ID=$(echo $ARRIVAL_2 | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)

# Add deposit to Arrival 2
if [ ! -z "$ARRIVAL_2_ID" ]; then
  curl -s -X POST "$BASE_URL/api/admin/bookings/$ARRIVAL_2_ID/payments" \
    -H "Content-Type: application/json" \
    -d "{
      \"amount\": 50000,
      \"paymentMethod\": \"Card\",
      \"notes\": \"Deposit payment\"
    }" > /dev/null
fi

echo -e "${GREEN}✓ Added 2 ARRIVALS (1 with deposit, 1 without)${NC}"
echo ""

# 3. IN-HOUSE TAB - Currently staying guests
echo -e "${YELLOW}3. Creating IN-HOUSE guests...${NC}"

# In-House 1 - Partial payment
INHOUSE_1=$(curl -s -X POST "$BASE_URL/api/admin/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"guestName\": \"Emma Davis\",
    \"guestEmail\": \"emma.davis@email.com\",
    \"guestPhone\": \"+237670000005\",
    \"checkInDate\": \"$YESTERDAY\",
    \"checkOutDate\": \"$IN_2_DAYS\",
    \"roomType\": \"Deluxe Room\",
    \"roomId\": 1,
    \"adults\": 2,
    \"kids\": 0,
    \"totalPrice\": 225000,
    \"pricePerNight\": 75000,
    \"currency\": \"XAF\",
    \"status\": \"CONFIRMED\"
  }")

INHOUSE_1_ID=$(echo $INHOUSE_1 | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)

# Check in guest 1
if [ ! -z "$INHOUSE_1_ID" ]; then
  curl -s -X POST "$BASE_URL/api/admin/bookings/$INHOUSE_1_ID/check-in" \
    -H "Content-Type: application/json" \
    -d "{
      \"checkInTime\": \"14:30\"
    }" > /dev/null
  
  # Add partial payment
  curl -s -X POST "$BASE_URL/api/admin/bookings/$INHOUSE_1_ID/payments" \
    -H "Content-Type: application/json" \
    -d "{
      \"amount\": 150000,
      \"paymentMethod\": \"Cash\",
      \"notes\": \"Partial payment\"
    }" > /dev/null
  
  # Add a charge
  curl -s -X POST "$BASE_URL/api/admin/bookings/$INHOUSE_1_ID/charges" \
    -H "Content-Type: application/json" \
    -d "{
      \"amount\": 25000,
      \"description\": \"Room service\",
      \"category\": \"ROOM_SERVICE\"
    }" > /dev/null
fi

# In-House 2 - Fully paid
INHOUSE_2=$(curl -s -X POST "$BASE_URL/api/admin/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"guestName\": \"Frank Wilson\",
    \"guestEmail\": \"frank.wilson@email.com\",
    \"guestPhone\": \"+237670000006\",
    \"checkInDate\": \"$YESTERDAY\",
    \"checkOutDate\": \"$TOMORROW\",
    \"roomType\": \"Standard Room\",
    \"roomId\": 2,
    \"adults\": 1,
    \"kids\": 0,
    \"totalPrice\": 100000,
    \"pricePerNight\": 50000,
    \"currency\": \"XAF\",
    \"status\": \"CONFIRMED\"
  }")

INHOUSE_2_ID=$(echo $INHOUSE_2 | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)

# Check in guest 2
if [ ! -z "$INHOUSE_2_ID" ]; then
  curl -s -X POST "$BASE_URL/api/admin/bookings/$INHOUSE_2_ID/check-in" \
    -H "Content-Type: application/json" \
    -d "{
      \"checkInTime\": \"15:00\"
    }" > /dev/null
  
  # Full payment
  curl -s -X POST "$BASE_URL/api/admin/bookings/$INHOUSE_2_ID/payments" \
    -H "Content-Type: application/json" \
    -d "{
      \"amount\": 100000,
      \"paymentMethod\": \"Card\",
      \"notes\": \"Full payment\"
    }" > /dev/null
fi

echo -e "${GREEN}✓ Added 2 IN-HOUSE guests (1 partial paid, 1 fully paid)${NC}"
echo ""

# 4. DEPARTURES TAB - Checking out today
echo -e "${YELLOW}4. Creating DEPARTURES (checking out today)...${NC}"

# Departure 1 - Outstanding balance
DEPARTURE_1=$(curl -s -X POST "$BASE_URL/api/admin/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"guestName\": \"Grace Taylor\",
    \"guestEmail\": \"grace.taylor@email.com\",
    \"guestPhone\": \"+237670000007\",
    \"checkInDate\": \"$YESTERDAY\",
    \"checkOutDate\": \"$TODAY\",
    \"roomType\": \"Suite\",
    \"roomId\": 3,
    \"adults\": 2,
    \"kids\": 1,
    \"totalPrice\": 100000,
    \"pricePerNight\": 100000,
    \"currency\": \"XAF\",
    \"status\": \"CONFIRMED\"
  }")

DEPARTURE_1_ID=$(echo $DEPARTURE_1 | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)

# Check in and add partial payment
if [ ! -z "$DEPARTURE_1_ID" ]; then
  curl -s -X POST "$BASE_URL/api/admin/bookings/$DEPARTURE_1_ID/check-in" \
    -H "Content-Type: application/json" \
    -d "{
      \"checkInTime\": \"14:00\"
    }" > /dev/null
  
  curl -s -X POST "$BASE_URL/api/admin/bookings/$DEPARTURE_1_ID/payments" \
    -H "Content-Type: application/json" \
    -d "{
      \"amount\": 60000,
      \"paymentMethod\": \"Cash\",
      \"notes\": \"Deposit\"
    }" > /dev/null
fi

# Departure 2 - Fully paid
DEPARTURE_2=$(curl -s -X POST "$BASE_URL/api/admin/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"guestName\": \"Henry Brown\",
    \"guestEmail\": \"henry.brown@email.com\",
    \"guestPhone\": \"+237670000008\",
    \"checkInDate\": \"$YESTERDAY\",
    \"checkOutDate\": \"$TODAY\",
    \"roomType\": \"Deluxe Room\",
    \"roomId\": 4,
    \"adults\": 2,
    \"kids\": 0,
    \"totalPrice\": 75000,
    \"pricePerNight\": 75000,
    \"currency\": \"XAF\",
    \"status\": \"CONFIRMED\"
  }")

DEPARTURE_2_ID=$(echo $DEPARTURE_2 | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)

# Check in and full payment
if [ ! -z "$DEPARTURE_2_ID" ]; then
  curl -s -X POST "$BASE_URL/api/admin/bookings/$DEPARTURE_2_ID/check-in" \
    -H "Content-Type: application/json" \
    -d "{
      \"checkInTime\": \"15:30\"
    }" > /dev/null
  
  curl -s -X POST "$BASE_URL/api/admin/bookings/$DEPARTURE_2_ID/payments" \
    -H "Content-Type: application/json" \
    -d "{
      \"amount\": 75000,
      \"paymentMethod\": \"Card\",
      \"notes\": \"Full payment\"
    }" > /dev/null
fi

echo -e "${GREEN}✓ Added 2 DEPARTURES (1 with balance, 1 fully paid)${NC}"
echo ""

# 5. UPCOMING TAB - Future bookings
echo -e "${YELLOW}5. Creating UPCOMING bookings...${NC}"

curl -s -X POST "$BASE_URL/api/admin/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"guestName\": \"Ivy Anderson\",
    \"guestEmail\": \"ivy.anderson@email.com\",
    \"guestPhone\": \"+237670000009\",
    \"checkInDate\": \"$IN_5_DAYS\",
    \"checkOutDate\": \"$IN_7_DAYS\",
    \"roomType\": \"Suite\",
    \"adults\": 2,
    \"kids\": 2,
    \"totalPrice\": 200000,
    \"pricePerNight\": 100000,
    \"currency\": \"XAF\",
    \"status\": \"CONFIRMED\"
  }" > /dev/null

curl -s -X POST "$BASE_URL/api/admin/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"guestName\": \"Jack Thompson\",
    \"guestEmail\": \"jack.thompson@email.com\",
    \"guestPhone\": \"+237670000010\",
    \"checkInDate\": \"$IN_7_DAYS\",
    \"checkOutDate\": \"$(date -v+10d +%Y-%m-%d)\",
    \"roomType\": \"Deluxe Room\",
    \"adults\": 2,
    \"kids\": 0,
    \"totalPrice\": 225000,
    \"pricePerNight\": 75000,
    \"currency\": \"XAF\",
    \"status\": \"CONFIRMED\"
  }" > /dev/null

echo -e "${GREEN}✓ Added 2 UPCOMING bookings${NC}"
echo ""

# 6. PAST TAB - Checked out bookings
echo -e "${YELLOW}6. Creating PAST bookings...${NC}"

# Past 1 - Fully paid
PAST_1=$(curl -s -X POST "$BASE_URL/api/admin/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"guestName\": \"Karen White\",
    \"guestEmail\": \"karen.white@email.com\",
    \"guestPhone\": \"+237670000011\",
    \"checkInDate\": \"$LAST_WEEK\",
    \"checkOutDate\": \"$LAST_WEEK_END\",
    \"roomType\": \"Standard Room\",
    \"roomId\": 5,
    \"adults\": 1,
    \"kids\": 0,
    \"totalPrice\": 100000,
    \"pricePerNight\": 50000,
    \"currency\": \"XAF\",
    \"status\": \"CONFIRMED\"
  }")

PAST_1_ID=$(echo $PAST_1 | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)

# Check in, pay, and check out
if [ ! -z "$PAST_1_ID" ]; then
  curl -s -X POST "$BASE_URL/api/admin/bookings/$PAST_1_ID/check-in" \
    -H "Content-Type: application/json" \
    -d "{\"checkInTime\": \"14:00\"}" > /dev/null
  
  curl -s -X POST "$BASE_URL/api/admin/bookings/$PAST_1_ID/payments" \
    -H "Content-Type: application/json" \
    -d "{\"amount\": 100000, \"paymentMethod\": \"Cash\"}" > /dev/null
  
  curl -s -X POST "$BASE_URL/api/admin/bookings/$PAST_1_ID/check-out" \
    -H "Content-Type: application/json" \
    -d "{\"checkOutTime\": \"11:00\"}" > /dev/null
fi

# Past 2 - Partial payment (unpaid balance)
PAST_2=$(curl -s -X POST "$BASE_URL/api/admin/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"guestName\": \"Leo Garcia\",
    \"guestEmail\": \"leo.garcia@email.com\",
    \"guestPhone\": \"+237670000012\",
    \"checkInDate\": \"$LAST_WEEK\",
    \"checkOutDate\": \"$LAST_WEEK_END\",
    \"roomType\": \"Deluxe Room\",
    \"roomId\": 6,
    \"adults\": 2,
    \"kids\": 1,
    \"totalPrice\": 150000,
    \"pricePerNight\": 75000,
    \"currency\": \"XAF\",
    \"status\": \"CONFIRMED\"
  }")

PAST_2_ID=$(echo $PAST_2 | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)

# Check in, partial pay, and check out
if [ ! -z "$PAST_2_ID" ]; then
  curl -s -X POST "$BASE_URL/api/admin/bookings/$PAST_2_ID/check-in" \
    -H "Content-Type: application/json" \
    -d "{\"checkInTime\": \"15:00\"}" > /dev/null
  
  curl -s -X POST "$BASE_URL/api/admin/bookings/$PAST_2_ID/payments" \
    -H "Content-Type: application/json" \
    -d "{\"amount\": 100000, \"paymentMethod\": \"Card\"}" > /dev/null
  
  curl -s -X POST "$BASE_URL/api/admin/bookings/$PAST_2_ID/check-out" \
    -H "Content-Type: application/json" \
    -d "{\"checkOutTime\": \"10:30\"}" > /dev/null
fi

echo -e "${GREEN}✓ Added 2 PAST bookings (1 fully paid, 1 with outstanding)${NC}"
echo ""

# 7. CANCELLED TAB
echo -e "${YELLOW}7. Creating CANCELLED bookings...${NC}"

CANCELLED_1=$(curl -s -X POST "$BASE_URL/api/admin/bookings" \
  -H "Content-Type: application/json" \
  -d "{
    \"guestName\": \"Maria Lopez\",
    \"guestEmail\": \"maria.lopez@email.com\",
    \"guestPhone\": \"+237670000013\",
    \"checkInDate\": \"$IN_3_DAYS\",
    \"checkOutDate\": \"$IN_5_DAYS\",
    \"roomType\": \"Suite\",
    \"adults\": 2,
    \"kids\": 0,
    \"totalPrice\": 200000,
    \"pricePerNight\": 100000,
    \"currency\": \"XAF\",
    \"status\": \"CONFIRMED\"
  }")

CANCELLED_1_ID=$(echo $CANCELLED_1 | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)

# Cancel the booking
if [ ! -z "$CANCELLED_1_ID" ]; then
  curl -s -X POST "$BASE_URL/api/admin/bookings/$CANCELLED_1_ID/cancel" \
    -H "Content-Type: application/json" \
    -d "{\"reason\": \"Guest requested cancellation\"}" > /dev/null
fi

echo -e "${GREEN}✓ Added 1 CANCELLED booking${NC}"
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}✅ Test Data Creation Complete!${NC}"
echo ""
echo "📊 Summary:"
echo "  • Pending:    2 bookings"
echo "  • Arrivals:   2 bookings (1 with deposit)"
echo "  • In-House:   2 guests (1 partial, 1 paid)"
echo "  • Departures: 2 guests (1 with balance)"
echo "  • Upcoming:   2 bookings"
echo "  • Past:       2 bookings (1 paid, 1 outstanding)"
echo "  • Cancelled:  1 booking"
echo ""
echo "🎯 Now you can test:"
echo "  1. View different tabs to see bookings"
echo "  2. Click 'View' to see payment details"
echo "  3. Test payment recording on In-House/Departures"
echo "  4. Test charge addition on In-House guests"
echo "  5. Check color coding (red/green/yellow)"
echo ""
echo "🌐 Open your admin platform: http://localhost:8000"
echo ""
