// client/src/api/foodApi.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_BASE_URL;

// Helper to get authenticated client instance
const getAuthClient = () => {
    const token = localStorage.getItem('token');
    return axios.create({
        baseURL: API_URL,
        headers: { Authorization: `Bearer ${token}` }
    });
};

// --- GET Food List (Atomic Unit) ---
export const getFoodList = async () => {
    try {
        // Food list is public, no auth header needed
        const response = await axios.get(`${API_URL}/foods`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.msg || "Failed to fetch food list.";
    }
};

// --- POST Add Food (Atomic Unit - Uses FormData for images) ---
export const addFood = async (formData) => {
    try {
        const client = getAuthClient();
        
        // axios automatically sets 'Content-Type': 'multipart/form-data' for FormData
        const response = await client.post('/foods', formData); 
        return response.data;
    } catch (error) {
        throw error.response?.data?.msg || "Failed to post food item.";
    }
};

// --- POST Request Food (Atomic Unit) ---
export const requestFood = async (foodId) => {
    try {
        const client = getAuthClient();
        const response = await client.post('/requests', { food_id: foodId }); 
        return response.data;
    } catch (error) {
        throw error.response?.data?.msg || "Failed to submit request.";
    }
};