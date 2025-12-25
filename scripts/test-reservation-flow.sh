#!/bin/bash

# Reservation Flow Testing Script
# Tests the complete reservation lifecycle in the admin platform

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:8080}"
ADMIN_API="$BASE_URL/api/admin"
PUBLIC_API="$BASE_URL/api/public"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}TEST $TESTS_RUN: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ PASS: $1${NC}"
    ((TESTS_PASSED++))
}

print_failure() {
    echo -e "${RED}✗ FAIL: $1${NC}"
    echo -e "${RED}  Error: $2${NC}"
    ((TESTS_FAILED++))
}

print_info() {
    echo -e "${BLUE}ℹ INFO: $1${NC}"
}

# Test if backend is running
check_backend() {
    print_header "CHECKING BACKEND CONNECTION"
    ((TESTS_RUN++))
    
    if curl -s -f "$BASE_URL/actuator/health" > /dev/null 2>&1; then
        print_success "Backend is running at $BASE_URL"
        return 0
    else
        print_failure "Backend is not accessible" "Cannot connect to $BASE_URL"
        echo -e "\n${RED}Please start the backend server first:${NC}"
        echo "  cd Backend-Hotel"
        echo "  ./mvnw spring-boot:run"
        exit 1
    fi
}

# Test 1: Get all room types
test_get_room_types() {
    print_header "TEST 1: GET ROOM TYPES"
    ((TESTS_RUN++))
    
    RESPONSE=$(curl -s -w "\n%{http_code}" "$ADMIN_API/room-types")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        ROOM_TYPE_COUNT=$(echo "$BODY" | jq '. | length' 2>/dev/null)
        if [ -n "$ROOM_TYPE_COUNT" ] && [ "$ROOM_TYPE_COUNT" -gt 0 ]; then
            print_success "Retrieved $ROOM_TYPE_COUNT room types"
            echo "$BODY" | jq -r '.[] | "  - \(.name): \(.baseRate) FCFA/night"'
        else
            print_failure "No room types found" "Empty response"
        fi
    else
        print_failure "Failed to get room types" "HTTP $HTTP_CODE"
    fi
}

# Test 2: Get all rooms
test_get_rooms() {
    print_header "TEST 2: GET ALL ROOMS"
    ((TESTS_RUN++))
    
    RESPONSE=$(curl -s -w "\n%{http_code}" "$ADMIN_API/rooms")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        ROOM_COUNT=$(echo "$BODY" | jq '. | length' 2>/dev/null)
        if [ -n "$ROOM_COUNT" ] && [ "$ROOM_COUNT" -gt 0 ]; then
            print_success "Retrieved $ROOM_COUNT rooms"
            AVAILABLE_COUNT=$(echo "$BODY" | jq '[.[] | select(.status == "AVAILABLE")] | length')
            print_info "Available rooms: $AVAILABLE_COUNT"
            
            # Store first available room for later tests
            FIRST_ROOM_ID=$(echo "$BODY" | jq -r '[.[] | select(.status == "AVAILABLE")][0].id // empty')
            FIRST_ROOM_NUMBER=$(echo "$BODY" | jq -r '[.[] | select(.status == "AVAILABLE")][0].number // empty')
            
            if [ -n "$FIRST_ROOM_ID" ]; then
                print_info "Will use Room #$FIRST_ROOM_NUMBER (ID: $FIRST_ROOM_ID) for testing"
            fi
        else
            print_failure "No rooms found" "Empty response"
        fi
    else
        print_failure "Failed to get rooms" "HTTP $HTTP_CODE"
    fi
}

# Test 3: Create a new booking (public endpoint)
test_create_booking() {
    print_header "TEST 3: CREATE NEW BOOKING"
    ((TESTS_RUN++))
    
    # Calculate dates (check-in tomorrow, check-out in 3 days)
    CHECK_IN_DATE=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "+1 day" +%Y-%m-%d)
    CHECK_OUT_DATE=$(date -v+3d +%Y-%m-%d 2>/dev/null || date -d "+3 days" +%Y-%m-%d)
    
    BOOKING_DATA=$(cat <<EOF
{
  "guestName": "Test User",
  "guestEmail": "test@example.com",
  "guestPhone": "+23512345678",
  "checkInDate": "$CHECK_IN_DATE",
  "checkOutDate": "$CHECK_OUT_DATE",
  "adults": 2,
  "kids": 0,
  "roomType": "Standard",
  "specialRequests": "Test booking from automated script",
  "address": "123 Test Street",
  "city": "Test City",
  "zipCode": "12345",
  "country": "Test Country",
  "source": "WEB",
  "totalPrice": 75000,
  "pricePerNight": 25000,
  "currency": "XAF"
}
EOF
)
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PUBLIC_API/bookings" \
        -H "Content-Type: application/json" \
        -d "$BOOKING_DATA")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        BOOKING_ID=$(echo "$BODY" | jq -r '.id // empty')
        BOOKING_REF=$(echo "$BODY" | jq -r '.bookingReference // empty')
        
        if [ -n "$BOOKING_ID" ]; then
            print_success "Created booking #$BOOKING_REF (ID: $BOOKING_ID)"
            print_info "Check-in: $CHECK_IN_DATE, Check-out: $CHECK_OUT_DATE"
            
            # Export for later tests
            export TEST_BOOKING_ID="$BOOKING_ID"
            export TEST_BOOKING_REF="$BOOKING_REF"
        else
            print_failure "Booking created but no ID returned" "$BODY"
        fi
    else
        print_failure "Failed to create booking" "HTTP $HTTP_CODE - $BODY"
    fi
}

# Test 4: Get bookings by tab (PENDING)
test_get_pending_bookings() {
    print_header "TEST 4: GET PENDING BOOKINGS"
    ((TESTS_RUN++))
    
    RESPONSE=$(curl -s -w "\n%{http_code}" "$ADMIN_API/bookings?tab=PENDING&size=100")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        PENDING_COUNT=$(echo "$BODY" | jq '.content | length' 2>/dev/null)
        print_success "Retrieved $PENDING_COUNT pending bookings"
        
        if [ -n "$TEST_BOOKING_ID" ]; then
            FOUND=$(echo "$BODY" | jq ".content[] | select(.id == $TEST_BOOKING_ID) | .bookingReference" 2>/dev/null)
            if [ -n "$FOUND" ]; then
                print_info "Test booking $TEST_BOOKING_REF found in PENDING tab ✓"
            else
                print_info "Test booking not found in PENDING tab (may have different status)"
            fi
        fi
    else
        print_failure "Failed to get pending bookings" "HTTP $HTTP_CODE"
    fi
}

# Test 5: Confirm booking
test_confirm_booking() {
    print_header "TEST 5: CONFIRM BOOKING"
    ((TESTS_RUN++))
    
    if [ -z "$TEST_BOOKING_ID" ]; then
        print_failure "No test booking ID available" "Skipping test"
        return
    fi
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$ADMIN_API/bookings/$TEST_BOOKING_ID/status" \
        -H "Content-Type: application/json" \
        -d '{"status": "CONFIRMED"}')
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Booking $TEST_BOOKING_REF confirmed"
    else
        print_failure "Failed to confirm booking" "HTTP $HTTP_CODE - $BODY"
    fi
}

# Test 6: Check room availability
test_room_availability() {
    print_header "TEST 6: CHECK ROOM AVAILABILITY"
    ((TESTS_RUN++))
    
    if [ -z "$FIRST_ROOM_ID" ] || [ -z "$CHECK_IN_DATE" ] || [ -z "$CHECK_OUT_DATE" ]; then
        print_failure "Missing room ID or dates" "Skipping test"
        return
    fi
    
    RESPONSE=$(curl -s -w "\n%{http_code}" "$ADMIN_API/rooms/availability?roomId=$FIRST_ROOM_ID&checkInDate=$CHECK_IN_DATE&checkOutDate=$CHECK_OUT_DATE")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        AVAILABLE=$(echo "$BODY" | jq -r '.available')
        MESSAGE=$(echo "$BODY" | jq -r '.message')
        
        if [ "$AVAILABLE" = "true" ]; then
            print_success "Room #$FIRST_ROOM_NUMBER is available: $MESSAGE"
        else
            print_info "Room #$FIRST_ROOM_NUMBER is NOT available: $MESSAGE"
            print_success "Availability check working correctly"
        fi
    else
        print_failure "Failed to check availability" "HTTP $HTTP_CODE - $BODY"
    fi
}

# Test 7: Assign room to booking
test_assign_room() {
    print_header "TEST 7: ASSIGN ROOM TO BOOKING"
    ((TESTS_RUN++))
    
    if [ -z "$TEST_BOOKING_ID" ] || [ -z "$FIRST_ROOM_ID" ]; then
        print_failure "Missing test booking or room ID" "Skipping test"
        return
    fi
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ADMIN_API/bookings/$TEST_BOOKING_ID/assign-room" \
        -H "Content-Type: application/json" \
        -d "{\"roomId\": $FIRST_ROOM_ID}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Room #$FIRST_ROOM_NUMBER assigned to booking $TEST_BOOKING_REF"
    else
        print_failure "Failed to assign room" "HTTP $HTTP_CODE - $BODY"
    fi
}

# Test 8: Check-in booking
test_checkin_booking() {
    print_header "TEST 8: CHECK-IN BOOKING"
    ((TESTS_RUN++))
    
    if [ -z "$TEST_BOOKING_ID" ]; then
        print_failure "No test booking ID available" "Skipping test"
        return
    fi
    
    CHECK_IN_TIME=$(date +%H:%M)
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ADMIN_API/bookings/$TEST_BOOKING_ID/check-in" \
        -H "Content-Type: application/json" \
        -d "{\"checkInTime\": \"$CHECK_IN_TIME\"}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Booking $TEST_BOOKING_REF checked in at $CHECK_IN_TIME"
    else
        print_failure "Failed to check-in booking" "HTTP $HTTP_CODE - $BODY"
    fi
}

# Test 9: Get in-house bookings
test_get_inhouse_bookings() {
    print_header "TEST 9: GET IN-HOUSE BOOKINGS"
    ((TESTS_RUN++))
    
    RESPONSE=$(curl -s -w "\n%{http_code}" "$ADMIN_API/bookings?tab=IN_HOUSE&size=100")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        INHOUSE_COUNT=$(echo "$BODY" | jq '.content | length' 2>/dev/null)
        print_success "Retrieved $INHOUSE_COUNT in-house bookings"
        
        if [ -n "$TEST_BOOKING_ID" ]; then
            FOUND=$(echo "$BODY" | jq ".content[] | select(.id == $TEST_BOOKING_ID) | .bookingReference" 2>/dev/null)
            if [ -n "$FOUND" ]; then
                print_info "Test booking $TEST_BOOKING_REF found in IN-HOUSE tab ✓"
            fi
        fi
    else
        print_failure "Failed to get in-house bookings" "HTTP $HTTP_CODE"
    fi
}

# Test 10: Check-out booking
test_checkout_booking() {
    print_header "TEST 10: CHECK-OUT BOOKING"
    ((TESTS_RUN++))
    
    if [ -z "$TEST_BOOKING_ID" ]; then
        print_failure "No test booking ID available" "Skipping test"
        return
    fi
    
    CHECK_OUT_TIME=$(date +%H:%M)
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ADMIN_API/bookings/$TEST_BOOKING_ID/check-out" \
        -H "Content-Type: application/json" \
        -d "{\"checkOutTime\": \"$CHECK_OUT_TIME\"}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Booking $TEST_BOOKING_REF checked out at $CHECK_OUT_TIME"
    else
        print_failure "Failed to check-out booking" "HTTP $HTTP_CODE - $BODY"
    fi
}

# Test 11: Get past bookings
test_get_past_bookings() {
    print_header "TEST 11: GET PAST BOOKINGS"
    ((TESTS_RUN++))
    
    RESPONSE=$(curl -s -w "\n%{http_code}" "$ADMIN_API/bookings?tab=PAST&size=100")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        PAST_COUNT=$(echo "$BODY" | jq '.content | length' 2>/dev/null)
        print_success "Retrieved $PAST_COUNT past bookings"
        
        if [ -n "$TEST_BOOKING_ID" ]; then
            FOUND=$(echo "$BODY" | jq ".content[] | select(.id == $TEST_BOOKING_ID) | .bookingReference" 2>/dev/null)
            if [ -n "$FOUND" ]; then
                print_info "Test booking $TEST_BOOKING_REF found in PAST tab ✓"
            fi
        fi
    else
        print_failure "Failed to get past bookings" "HTTP $HTTP_CODE"
    fi
}

# Test 12: Test all tabs
test_all_tabs() {
    print_header "TEST 12: VERIFY ALL TABS"
    
    TABS=("PENDING" "ARRIVALS" "IN_HOUSE" "DEPARTURES" "UPCOMING" "PAST" "CANCELLED" "ALL")
    
    for TAB in "${TABS[@]}"; do
        ((TESTS_RUN++))
        print_test "Testing tab: $TAB"
        
        RESPONSE=$(curl -s -w "\n%{http_code}" "$ADMIN_API/bookings?tab=$TAB&size=10")
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        BODY=$(echo "$RESPONSE" | sed '$d')
        
        if [ "$HTTP_CODE" = "200" ]; then
            COUNT=$(echo "$BODY" | jq '.content | length' 2>/dev/null)
            print_success "$TAB tab: $COUNT bookings"
        else
            print_failure "$TAB tab failed" "HTTP $HTTP_CODE"
        fi
    done
}

# Cleanup function
cleanup_test_booking() {
    if [ -n "$TEST_BOOKING_ID" ] && [ "$CLEANUP" = "true" ]; then
        print_header "CLEANUP: DELETING TEST BOOKING"
        curl -s -X DELETE "$ADMIN_API/bookings/$TEST_BOOKING_ID" > /dev/null
        print_info "Test booking $TEST_BOOKING_REF deleted"
    fi
}

# Print summary
print_summary() {
    print_header "TEST SUMMARY"
    echo -e "Total Tests Run:    ${BLUE}$TESTS_RUN${NC}"
    echo -e "Tests Passed:       ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Tests Failed:       ${RED}$TESTS_FAILED${NC}"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}✓ ALL TESTS PASSED!${NC}\n"
        exit 0
    else
        echo -e "\n${RED}✗ SOME TESTS FAILED${NC}\n"
        exit 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════╗"
    echo "║  RESERVATION FLOW TESTING SCRIPT      ║"
    echo "║  Admin Platform - Backend Hotel       ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Check for required tools
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}Error: jq is required but not installed.${NC}"
        echo "Install it with: brew install jq (macOS) or apt-get install jq (Linux)"
        exit 1
    fi
    
    # Parse arguments
    CLEANUP="false"
    while [[ $# -gt 0 ]]; do
        case $1 in
            --cleanup)
                CLEANUP="true"
                shift
                ;;
            --base-url)
                BASE_URL="$2"
                ADMIN_API="$BASE_URL/api/admin"
                PUBLIC_API="$BASE_URL/api/public"
                shift 2
                ;;
            *)
                echo "Unknown option: $1"
                echo "Usage: $0 [--cleanup] [--base-url http://localhost:8080]"
                exit 1
                ;;
        esac
    done
    
    print_info "Testing against: $BASE_URL"
    
    # Run tests
    check_backend
    test_get_room_types
    test_get_rooms
    test_create_booking
    test_get_pending_bookings
    test_confirm_booking
    test_room_availability
    test_assign_room
    test_checkin_booking
    test_get_inhouse_bookings
    test_checkout_booking
    test_get_past_bookings
    test_all_tabs
    
    # Cleanup if requested
    cleanup_test_booking
    
    # Print summary
    print_summary
}

# Run main function
main "$@"
