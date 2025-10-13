// client/src/api/authApi.js
import axios from 'axios';

// Ensure your client/.env has: REACT_APP_API_BASE_URL=http://localhost:5000/api
const API_URL = process.env.REACT_APP_API_BASE_URL;

// --- Login Function (Atomic Unit) ---
export const login = async (email, password) => {
    try {
        const response = await axios.post(`${API_URL}/login`, { email, password });
        
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('role', response.data.role);
        }
        return response.data;
    } catch (error) {
        throw error.response?.data?.msg || "Login failed due to network error.";
    }
};

// --- Register Function (Atomic Unit) ---
export const register = async (userData) => {
    try {
        // userData includes { email, password, role, name, lat, lng }
        const response = await axios.post(`${API_URL}/register`, userData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.msg || "Registration failed.";
    }
};

// --- Logout Function ---
export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
};