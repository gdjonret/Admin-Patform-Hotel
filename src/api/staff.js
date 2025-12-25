import http from './http';

// Get all staff members
export const getAllStaff = async () => {
  try {
    const response = await http.get('/api/admin/staff');
    return response.data;
  } catch (error) {
    console.error('Error fetching staff:', error);
    throw error;
  }
};

// Get staff by ID
export const getStaffById = async (id) => {
  try {
    const response = await http.get(`/api/admin/staff/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching staff:', error);
    throw error;
  }
};

// Get staff by status
export const getStaffByStatus = async (status) => {
  try {
    const response = await http.get(`/api/admin/staff/status/${status}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching staff by status:', error);
    throw error;
  }
};

// Create new staff member
export const createStaff = async (staffData) => {
  try {
    const response = await http.post('/api/admin/staff', staffData);
    return response.data;
  } catch (error) {
    console.error('Error creating staff:', error);
    throw error;
  }
};

// Update staff member
export const updateStaff = async (id, staffData) => {
  try {
    const response = await http.put(`/api/admin/staff/${id}`, staffData);
    return response.data;
  } catch (error) {
    console.error('Error updating staff:', error);
    throw error;
  }
};

// Delete staff member
export const deleteStaff = async (id) => {
  try {
    const response = await http.delete(`/api/admin/staff/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting staff:', error);
    throw error;
  }
};
