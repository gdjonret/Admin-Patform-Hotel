const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

// Store connected clients for SSE
let clients = [];

// Enable CORS for all routes
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Store bookings in memory
let bookings = [
  {
    id: 1,
    guestName: 'John Smith',
    roomNumber: '101',
    checkIn: '2025-08-25',
    checkOut: '2025-08-28',
    status: 'Confirmed',
    paymentStatus: 'Paid',
    createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  {
    id: 2,
    guestName: 'Jane Doe',
    roomNumber: '205',
    checkIn: '2025-08-26',
    checkOut: '2025-08-30',
    status: 'Pending',
    paymentStatus: 'Pending',
    createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
  }
];

// GET all bookings
app.get('/api/bookings', (req, res) => {
  res.json(bookings);
});

// Helper function to generate a booking reference
function generateBookingReference() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `HLP${year}${month}${day}-${random}`;
}

// POST new booking
app.post('/api/bookings', (req, res) => {
  const newBooking = {
    id: bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1,
    bookingReference: generateBookingReference(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  bookings.push(newBooking);
  
  // Send notification to all connected clients
  const notification = {
    id: Date.now(),
    type: 'Reservation',
    user: newBooking.guestName,
    date: new Date().toISOString(),
    bookingId: newBooking.id
  };
  
  sendNotificationToAll('BOOKING_CREATED', notification);
  
  res.status(201).json(newBooking);
});

// PUT update booking
app.put('/api/bookings/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = bookings.findIndex(b => b.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  
  const updatedBooking = {
    ...bookings[index],
    ...req.body
  };
  
  bookings[index] = updatedBooking;
  
  // Send notification to all connected clients
  const notification = {
    id: Date.now(),
    type: 'Update',
    user: updatedBooking.guestName,
    date: new Date().toISOString(),
    bookingId: updatedBooking.id
  };
  
  sendNotificationToAll('BOOKING_UPDATED', notification);
  
  res.json(updatedBooking);
});

// DELETE booking
app.delete('/api/bookings/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = bookings.findIndex(b => b.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  
  const deletedBooking = bookings[index];
  bookings.splice(index, 1);
  
  // Send notification to all connected clients
  const notification = {
    id: Date.now(),
    type: 'Cancellation',
    user: deletedBooking.guestName,
    date: new Date().toISOString(),
    bookingId: deletedBooking.id
  };
  
  sendNotificationToAll('BOOKING_CANCELLED', notification);
  
  res.json({ success: true });
});

// SSE endpoint for notifications
app.get('/api/notifications/stream', (req, res) => {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Credentials': 'true'
  });
  
  // Send a heartbeat immediately
  res.write('event: heartbeat\ndata: {}\n\n');
  
  // Generate a client id
  const clientId = Date.now();
  
  // Add this client to our connected clients
  const newClient = {
    id: clientId,
    res
  };
  
  clients.push(newClient);
  
  // Remove client when they disconnect
  req.on('close', () => {
    clients = clients.filter(client => client.id !== clientId);
  });
});

// Helper function to send notifications to all connected clients
function sendNotificationToAll(eventType, data) {
  clients.forEach(client => {
    client.res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
  });
}

// Start server
app.listen(port, () => {
  console.log(`Mock API server running at http://localhost:${port}`);
  console.log(`SSE notifications available at http://localhost:${port}/api/notifications/stream`);
});
