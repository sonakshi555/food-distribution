// client/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_BASE_URL;

// Helper to fetch dashboard data with JWT
const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    const client = axios.create({
        baseURL: API_URL,
        headers: { Authorization: `Bearer ${token}` }
    });
    
    // Calls the single, role-aware endpoint defined in server/routes/users.js
    const response = await client.get('/dashboard');
    return response.data;
};

const Dashboard = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const role = localStorage.getItem('role');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const result = await fetchDashboardData();
            setData(result);
        } catch (err) {
            setError(err.response?.data?.msg || "Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    };
    
    // --- Handlers for Restaurant Actions (Atomic PUT request) ---
    const handleStatusUpdate = async (requestId, status) => {
        if (!window.confirm(`Are you sure you want to set status to '${status}'?`)) return;

        try {
            const token = localStorage.getItem('token');
            const client = axios.create({
                baseURL: API_URL,
                headers: { Authorization: `Bearer ${token}` }
            });

            await client.put(`/requests/${requestId}`, { status });
            alert(`Request ${requestId} updated to ${status}.`);
            loadData(); // Reload data to show updated status
        } catch (err) {
            alert(`Error updating status: ${err.response?.data?.msg || 'Failed network call'}`);
        }
    };


    if (loading) return <div style={styles.container}>Loading Dashboard...</div>;
    if (error) return <div style={{...styles.container, color: 'red'}}>Error: {error}</div>;

    return (
        <div style={styles.container}>
            <h2>Welcome, {role === 'restaurant' ? 'Restaurant Owner' : 'Charity'}</h2>
            
            {role === 'restaurant' ? (
                <RestaurantView data={data} handleStatusUpdate={handleStatusUpdate} />
            ) : (
                <CharityView data={data} />
            )}
        </div>
    );
};

// --- Sub-Component for Restaurant View ---
const RestaurantView = ({ data, handleStatusUpdate }) => (
    <div style={styles.view}>
        <h3>Your Posted Food Items and Requests</h3>
        {data.length === 0 && <p>You haven't posted any food yet.</p>}
        
        {data.map(item => (
            <div key={item.food_id} style={styles.card}>
                <h4>{item.item_name} (Qty: {item.quantity})</h4>
                <p>Status: {item.is_available ? 'AVAILABLE' : 'CLAIMED'}</p>
                
                {item.requests && item.requests.length > 0 ? (
                    <div>
                        <h5>Pending Requests ({item.requests.filter(r => r.status === 'pending').length})</h5>
                        {item.requests.map(req => (
                            <div key={req.request_id} style={styles.requestItem}>
                                <span>Request ID {req.request_id} - Status: **{req.status.toUpperCase()}**</span>
                                
                                {req.status === 'pending' && (
                                    <div style={styles.actionButtons}>
                                        <button onClick={() => handleStatusUpdate(req.request_id, 'accepted')} style={styles.acceptButton}>Accept</button>
                                        <button onClick={() => handleStatusUpdate(req.request_id, 'rejected')} style={styles.rejectButton}>Reject</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No requests for this item yet.</p>
                )}
            </div>
        ))}
    </div>
);

// --- Sub-Component for Charity View ---
const CharityView = ({ data }) => (
    <div style={styles.view}>
        <h3>Your Current Food Requests</h3>
        {/* FIX 1: Check if data is empty */}
        {data.length === 0 && <p>You have not placed any food requests yet.</p>}
        
        {data.map(req => (
            // FIX 2: Ensure the request object (req) has the status property before rendering
            req && req.status ? (
                <div key={req.request_id} style={styles.card}>
                    {/* The problem likely occurs here, as req might be undefined */}
                    <h4>{req.item_name} from {req.restaurant_name}</h4>
                    <p>Requested Quantity: {req.quantity}</p>
                    <p>Current Status: <span style={styles[req.status]}>**{req.status.toUpperCase()}**</span></p>
                </div>
            ) : (
                // Fallback for unexpected data structure (optional, but safer)
                <p key={Math.random()}>Error loading request data.</p>
            )
        ))}
    </div>
);

const styles = {
    container: { padding: '20px', fontFamily: 'Arial, sans-serif' },
    view: { marginTop: '20px' },
    card: { border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    requestItem: { borderTop: '1px solid #eee', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    actionButtons: { display: 'flex', gap: '8px' },
    acceptButton: { padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    rejectButton: { padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    pending: { color: 'orange', fontWeight: 'bold' },
    accepted: { color: 'green', fontWeight: 'bold' },
    rejected: { color: 'red', fontWeight: 'bold' },
    completed: { color: 'blue', fontWeight: 'bold' }
};

export default Dashboard;