import axios from "axios";

// FIXED: Use environment variable for API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api/admin";

//Get all guests
export const fetchGuests = async () => {
    // Add timestamp to prevent browser caching
    const response = await axios.get(`${API_BASE_URL}/guests?_t=${Date.now()}`);
    return response.data;
}

//Get guest by id
export const fetchGuestById = async (id) => {
    const response = await axios.get(`${API_BASE_URL}/guests/${id}`);
    return response.data;
}

//Create guest
export const createGuest = async (guestData) => {
    const response = await axios.post(`${API_BASE_URL}/guests`, guestData);
    return response.data;
}

//Update guest
export const updateGuest = async (id, guestData) => {
    const response = await axios.put(`${API_BASE_URL}/guests/${id}`, guestData);
    return response.data;
}

//Delete guest
export const deleteGuest = async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/guests/${id}`);
    return response.data;
}

//Get guest by name
export const fetchGuestByName = async (name) => {
    const response = await axios.get(`${API_BASE_URL}/guests?name=${name}`);
    return response.data;
}

//Get guest by email
export const fetchGuestByEmail = async (email) => {
    const response = await axios.get(`${API_BASE_URL}/guests?email=${email}`);
    return response.data;
}

//Get guest by phone
export const fetchGuestByPhone = async (phone) => {
    const response = await axios.get(`${API_BASE_URL}/guests?phone=${phone}`);
    return response.data;
}

//Get all bookings for a guest by email
export const fetchGuestBookings = async (email) => {
    const response = await axios.get(`${API_BASE_URL}/bookings?guestEmail=${email}&size=1000`);
    return response.data.content || response.data || [];
}

//Get all payments for a booking
export const fetchBookingPayments = async (bookingId) => {
    const response = await axios.get(`${API_BASE_URL}/bookings/${bookingId}/payments`);
    return response.data || [];
}
