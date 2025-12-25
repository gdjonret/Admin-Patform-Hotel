# Backend Integration Guide

This document explains how the Admin Platform integrates with the Spring Boot backend for room management.

## Backend API Structure

The Spring Boot backend provides the following endpoints for room management:

- `GET /api/admin/rooms` - List all rooms
- `POST /api/admin/rooms` - Create a new room
- `POST /api/admin/rooms/{id}/status?status=STATUS` - Update a room's status

## Data Mapping

### Backend Room Model

```java
public class RoomEntity {
    private Long id;
    private String number;
    private Long roomTypeId;
    private Integer floor;
    private RoomStatus status; // CLEAN, DIRTY, OOO
}
```

### Frontend Room Model

```javascript
{
  id: 101,
  type: 'Standard', // or 'Deluxe'
  capacity: 2,
  price: 20000,
  status: 'Available', // or 'Occupied', 'Maintenance'
  amenities: ['Wi-Fi', 'TV', 'Air Conditioning']
}
```

### Status Mapping

| Backend Status | Frontend Status |
|----------------|----------------|
| CLEAN          | Available      |
| DIRTY          | Occupied       |
| OOO            | Maintenance    |

### Room Type Mapping

| roomTypeId | Frontend Type | Capacity | Price  | Amenities                                            |
|------------|--------------|----------|--------|------------------------------------------------------|
| 1          | Standard     | 2        | 20,000 | Wi-Fi, TV, Air Conditioning                           |
| 2          | Deluxe       | 3        | 25,000 | Wi-Fi, TV, Air Conditioning, Mini Bar, Ocean View     |

## Implementation Details

1. **API Service Layer**: The `src/api/rooms.js` file contains methods that transform data between frontend and backend formats.

2. **Context Provider**: The `RoomContext.js` manages state and API interactions.

3. **Configuration**: The backend URL is configured in the `.env` file as `REACT_APP_API_URL`.

## Limitations

1. The backend API doesn't support full CRUD operations for all room properties:
   - We can create rooms with all properties
   - We can only update the status of existing rooms
   - We can't delete rooms (we mark them as OOO instead)

2. Room amenities and prices are not stored in the backend; they're derived from the room type.

## Data Storage

All room data is now stored exclusively in the backend. The application no longer has any hardcoded room data. When the application starts:

1. It fetches all rooms from the backend API
2. If the backend is not available or returns an error, an empty room list is displayed
3. New rooms are saved directly to the backend
4. Room status changes are immediately persisted to the backend

## Testing

Run the test script to verify the backend integration:

```bash
./test-backend-integration.sh
```

This script checks if the backend is accessible and starts the React application.
