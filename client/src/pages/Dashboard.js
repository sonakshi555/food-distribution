import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { completePickup, submitFeedback } from '../api/foodApi'; 

// Import Google Maps components
import { useLoadScript, GoogleMap, Marker } from '@react-google-maps/api'; 
import '../index.css'; // CSS import is necessary for styling

const API_URL = process.env.REACT_APP_API_BASE_URL;
const MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY"; // REPLACE WITH YOUR KEY

// Helper to fetch dashboard data with JWT
const fetchDashboardData = async (role) => {
    const token = localStorage.getItem('token');
    const client = axios.create({
        baseURL: API_URL,
        headers: { Authorization: `Bearer ${token}` }
    });

    if (role === 'admin') {
        const response = await client.get('/admin/monitor'); 
        return response.data; // Returns { users: [...], foodItems: [...] }
    } else {
        const response = await client.get('/dashboard'); 
        return response.data; // Returns array of data
    }
};

// --- Dashboard Component (Parent) ---
const Dashboard = () => {
    const [data, setData] = useState({}); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const role = localStorage.getItem('role');
    const navigate = useNavigate();

    // Load Maps script 
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: MAPS_API_KEY, 
    });


    useEffect(() => {
        loadData(role);
    }, [role]); 

    const loadData = async (currentRole) => {
        try {
            const result = await fetchDashboardData(currentRole);
            setData(result);
        } catch (err) {
            setError(err.response?.data?.msg || "Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    };
    
    // --- Handler for Restaurant Status Update (Accept/Reject) ---
    const handleStatusUpdate = async (requestId, status) => {
        if (!window.confirm(`Are you sure you want to set status to '${status}'?`)) return;

        try {
            const token = localStorage.getItem('token');
            const client = axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${token}` } });

            await client.put(`/requests/${requestId}`, { status });
            alert(`Request ${requestId} updated to ${status}.`);
            loadData(role); 
        } catch (err) {
            alert(`Error updating status: ${err.response?.data?.msg || 'Failed network call'}`);
        }
    };
    
    // --- NEW Handler: Confirm Pickup (Completes the transaction) ---
    const handleCompletePickup = async (requestId) => {
        if (!window.confirm("Confirming pickup will mark the food as UNAVAILABLE. Proceed?")) return;

        try {
            await completePickup(requestId); 
            alert("Pickup successfully confirmed. Food is now marked unavailable.");
            loadData(role); 
        } catch (err) {
            alert(`Error confirming pickup: ${err.response?.data?.msg || 'Failed network call'}`);
        }
    };


    if (loading) return <div className="app-container">Loading Dashboard...</div>;
    if (error) return <div className="app-container" style={{ color: 'red' }}>Error: {error}</div>; 

    return (
        <div className="app-container">
            <h2>Welcome, {role === 'admin' ? 'System Administrator' : (role === 'restaurant' ? 'Restaurant Owner' : 'Charity')}</h2>
            
            {/* Conditional Rendering for the three roles */}
            {role === 'admin' ? (
                <AdminView data={data} loadData={loadData} /> 
            ) : role === 'restaurant' ? (
                <RestaurantView 
                    data={data} 
                    handleStatusUpdate={handleStatusUpdate} 
                    handleCompletePickup={handleCompletePickup} 
                    isLoaded={isLoaded}
                />
            ) : (
                <CharityView data={data} isLoaded={isLoaded} navigate={navigate} loadData={loadData} />
            )}
        </div>
    );
};


// --- Sub-Component: Feedback Form ---
const FeedbackForm = ({ requestId, onSubmit }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(requestId, rating, comment);
    };

    return (
        <form onSubmit={handleSubmit} className="feedback-form">
            <label>Rating (1-5):</label>
            <input 
                type="number" min="1" max="5" value={rating} 
                onChange={(e) => setRating(Number(e.target.value))} required 
                className="input-field"
            />
            <textarea 
                placeholder="Comments..." value={comment} 
                onChange={(e) => setComment(e.target.value)} 
                className="input-field" 
                style={{height: '60px'}}
            />
            <button type="submit" className="button submit-button">Submit Feedback</button>
        </form>
    );
};

// --- Sub-Component for Restaurant View ---
const RestaurantView = ({ data, handleStatusUpdate, handleCompletePickup, isLoaded }) => (
    <div className="view-container"> 
        <h3>Your Posted Food Items and Requests</h3>
        {data.length === 0 && <p>You haven't posted any food yet.</p>}
        
        {data.map(item => (
            <div key={item.food_id} className="card">
                <h4>{item.item_name} (Qty: {item.quantity})</h4>
                <p>Status: {item.is_available ? 'AVAILABLE' : 'CLAIMED'}</p>
                
                {/* Aggregate requests data is in item.requests array */}
                {item.requests && item.requests.length > 0 && (
                    <div>
                        <h5>Requests ({item.requests.filter(r => r.request_id).length})</h5>
                        {item.requests.map(req => (
                            <div key={req.request_id || Math.random()} className="request-item">
                                <div>
                                    {/* Status Display */}
                                    <span>Request ID {req.request_id} - Status: <span className={`status-${req.status}`}>{req.status.toUpperCase()}</span></span>
                                    
                                    {/* Display Charity Address and Feedback */}
                                    {req.status === 'accepted' && (
                                        <p className="address-text">Pickup Address: **{req.charity_address || 'Address N/A'}**</p>
                                    )}

                                    {/* Display Feedback left by Charity */}
                                    {req.rating && req.comment && (
                                        <p style={{ fontSize: '12px', color: '#3f51b5' }}>Feedback: 🌟 {req.rating}/5 - "{req.comment}"</p>
                                    )}
                                </div>
                                
                                <div className="action-buttons">
                                    {/* Accept/Reject Buttons */}
                                    {req.status === 'pending' && (
                                        <>
                                            <button onClick={() => handleStatusUpdate(req.request_id, 'accepted')} className="button accept-button">Accept</button>
                                            <button onClick={() => handleStatusUpdate(req.request_id, 'rejected')} className="button reject-button">Reject</button>
                                        </>
                                    )}

                                    {/* CONFIRM PICKUP BUTTON */}
                                    {req.status === 'accepted' && (
                                        <button 
                                            onClick={() => handleCompletePickup(req.request_id)} 
                                            className="button complete-button"
                                        >
                                            Confirm Pickup
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ))}
    </div>
);

// --- Sub-Component for Charity View ---
const CharityView = ({ data, isLoaded, navigate, loadData }) => {
    
    const handleFeedbackSubmit = async (requestId, rating, comment) => {
        try {
            await submitFeedback(requestId, rating, comment);
            alert("Thank you for your feedback!");
            loadData(localStorage.getItem('role')); // Reload data
        } catch (error) {
            alert(`Failed to submit feedback: ${error}`);
        }
    };

    return (
        <div className="view-container">
            <h3>Your Current Food Requests</h3>
            {data.length === 0 && <p>You have not placed any food requests yet.</p>}
            
            {data.map(req => (
                <div key={req.request_id || Math.random()} className="card">
                    <h4>{req.item_name} from {req.restaurant_name}</h4>
                    <p>Current Status: <span className={`status-${req.status}`}>{req.status.toUpperCase()}</span></p>

                    {/* Show Feedback form for completed requests */}
                    {req.status === 'completed' && !req.rating && ( // Check if rating is NOT present
                        <FeedbackForm requestId={req.request_id} onSubmit={handleFeedbackSubmit} />
                    )}
                    
                    {/* Maps Integration - Show Restaurant Location if accepted */}
                    {req.status === 'accepted' && req.location_lat && isLoaded && (
                        <div className="map-container">
                            <p style={{fontWeight: 'bold'}}>Pickup Location:</p>
                            <GoogleMap
                                mapContainerStyle={{width: '100%', height: '300px'}}
                                center={{ lat: parseFloat(req.location_lat), lng: parseFloat(req.location_lng) }}
                                zoom={14}
                            >
                                <Marker position={{ lat: parseFloat(req.location_lat), lng: parseFloat(req.location_lng) }} />
                            </GoogleMap>
                        </div>
                    )}
                    
                    {/* Display Feedback submitted by charity */}
                    {req.rating && req.comment && (
                        <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                            <p><strong>Your Feedback:</strong> 🌟 {req.rating} / 5</p>
                            <p>{req.comment}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};


// --- Sub-Component for Admin Monitoring View (NEW CODE) ---
const AdminView = ({ data, loadData }) => {
    
    const handleRemoveUser = async (userId, name) => {
        if (window.confirm(`Are you sure you want to remove user ${name} (ID: ${userId})? THIS ACTION IS PERMANENT.`)) {
            try {
                const token = localStorage.getItem('token');
                const client = axios.create({ 
                    baseURL: API_URL, 
                    headers: { Authorization: `Bearer ${token}` } 
                });
                
                // Call the new DELETE endpoint
                await client.delete(`/admin/user/${userId}`); 
                
                alert(`SUCCESS: User ${name} has been removed.`);
                loadData('admin'); // Reload the Admin dashboard list
            } catch (error) {
                alert(`ERROR: Failed to remove user. Check backend terminal.`);
            }
        }
    };

    const handleAddUserRedirect = () => {
        // Directs admin to the standard registration page to add a new user
        window.location.href = '/register'; 
    };

    return (
        <div className="view-container">
            <h3>System Monitoring Dashboard (Full Oversight)</h3>

            {/* System Metrics */}
            <div className="card" style={{ marginBottom: '30px', backgroundColor: '#fffbe6' }}>
                <h4>System Metrics & Control</h4>
                <p>Total Registered Users: <strong>{data.users ? data.users.length : 0}</strong></p>
                <p>Total Food Items Posted: <strong>{data.foodItems ? data.foodItems.length : 0}</strong></p>
                <p>Active (Available) Food: <strong>{data.foodItems ? data.foodItems.filter(f => f.is_available).length : 0}</strong></p>
                
                <button onClick={handleAddUserRedirect} className="button login-button" style={{ marginTop: '10px', width: '200px' }}>
                    + Add New User
                </button>
            </div>

            {/* 1. All Users List */}
            <h4 style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>All Users (Control)</h4>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {data.users && data.users.map(user => (
                    <div key={user.user_id} className="request-item" style={{ marginBottom: '5px' }}>
                        <div>
                            <strong>{user.name}</strong> ({user.email}) | Role: <span className={`status-${user.role}`}>{user.role.toUpperCase()}</span>
                            <p style={{ fontSize: '12px', color: '#555', margin: '2px 0' }}>Phone: {user.phone_number || 'N/A'}</p>
                        </div>
                        <button onClick={() => handleRemoveUser(user.user_id, user.name)} className="button reject-button" style={{ padding: '5px 10px', marginTop: 0 }}>
                            Remove
                        </button>
                    </div>
                ))}
            </div>
            
            <h4 style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px', marginTop: '40px' }}>2. All Food Listings & History</h4>
            
            {data.foodItems && data.foodItems.map(item => (
                <div key={item.food_id} className="card">
                    <h5>{item.item_name} (ID: {item.food_id})</h5>
                    <p>Posted By: {item.restaurant_name} ({item.restaurant_email})</p>
                    <p>Current Status: <span className={`status-${item.is_available ? 'available' : 'claimed'}`}>{item.is_available ? 'AVAILABLE' : 'CLAIMED'}</span></p>

                    {item.requests_history && item.requests_history.length > 0 && (
                        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '5px', border: '1px solid #eee' }}>
                            <h6>Transaction History ({item.requests_history.length} Requests)</h6>
                            {item.requests_history.map((req, index) => (
                                <p key={index} style={{ fontSize: '12px', margin: '5px 0', borderBottom: '1px dotted #ccc' }}>
                                    - **Charity {req.charity_id}** ({req.charity_address || 'No Address'}) | Status: **{req.status.toUpperCase()}** | Rating: {req.rating || 'N/A'}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};


export default Dashboard;