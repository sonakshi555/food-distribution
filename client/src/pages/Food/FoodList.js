// client/src/pages/Food/FoodList.js
import React, { useState, useEffect } from 'react';
import { getFoodList, requestFood } from '../../api/foodApi';
import { useNavigate } from 'react-router-dom';

// Note: You must update App.js routing to include this path
// <Route path="/food-list" element={<FoodList />} />

const FoodList = () => {
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const role = localStorage.getItem('role');
    const navigate = useNavigate();

    useEffect(() => {
        fetchFoods();
    }, []);

    const fetchFoods = async () => {
        try {
            const data = await getFoodList();
            setFoods(data);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRequest = async (foodId, itemName) => {
        if (role !== 'charity') {
            alert("You must be logged in as a Charity to request food.");
            navigate('/login');
            return;
        }

        if (window.confirm(`Are you sure you want to request ${itemName}?`)) {
            try {
                await requestFood(foodId);
                alert('Request successfully placed! Check your dashboard for status.');
            } catch (err) {
                alert(`Failed to place request: ${err}`);
            }
        }
    };

    if (loading) return <p>Loading available food...</p>;
    if (error) return <p style={styles.error}>Error fetching food: {error}</p>;

    return (
        <div style={styles.container}>
            <h2>Available Food Items ({foods.length})</h2>
            <div style={styles.list}>
                {foods.map(food => (
                    <div key={food.food_id} style={styles.card}>
                        <h3>{food.item_name}</h3>
                        <p>Quantity: **{food.quantity}**</p>
                        <p>Restaurant: {food.restaurant_name}</p>
                        <p style={styles.location}>Location: Lat: {food.location_lat}, Lng: {food.location_lng}</p>
                        
                        {food.image_path && (
                            <img 
                                src={`http://localhost:5000${food.image_path}`} 
                                alt={food.item_name} 
                                style={styles.image} 
                                onError={(e) => { e.target.onerror = null; e.target.src = "placeholder.jpg" }}
                            />
                        )}
                        
                        {/* Action button visible only to authenticated Charities */}
                        {role === 'charity' && (
                            <button onClick={() => handleRequest(food.food_id, food.item_name)} style={styles.requestButton}>
                                Request Food
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '20px', fontFamily: 'Arial, sans-serif' },
    list: { display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px' },
    card: { border: '1px solid #ccc', padding: '15px', width: '300px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    image: { width: '100%', height: 'auto', maxHeight: '150px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' },
    location: { fontSize: '12px', color: '#555', marginTop: '5px' },
    requestButton: { marginTop: '10px', padding: '10px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    error: { color: 'red' }
};

export default FoodList;