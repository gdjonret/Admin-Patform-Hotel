#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing Backend Integration for Room Management${NC}"
echo "----------------------------------------"

# Check if backend server is running
echo -e "${YELLOW}Step 1: Checking if backend server is running...${NC}"
if curl -s http://localhost:8080/actuator/health > /dev/null; then
  echo -e "${GREEN}✓ Backend server is running${NC}"
else
  echo -e "${RED}✗ Backend server is not running or not accessible${NC}"
  echo -e "${YELLOW}Please start your backend server at http://localhost:8080${NC}"
  echo -e "${YELLOW}If your backend is running on a different URL, update REACT_APP_API_URL in .env file${NC}"
  exit 1
fi

# Start the React application
echo -e "${YELLOW}Step 2: Starting the React application...${NC}"
echo -e "${YELLOW}Testing instructions:${NC}"
echo -e "1. When the app loads, you should see a message 'No rooms found' if your backend database is empty"
echo -e "2. Try adding a new room - it should be saved to the backend"
echo -e "3. Try changing a room's status - it should update in the backend"
echo -e "4. Try refreshing the page - your rooms should persist"
echo -e "${YELLOW}Press Ctrl+C to stop the application when done testing${NC}"

npm start
