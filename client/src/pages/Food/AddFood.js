// client/src/pages/Food/AddFood.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addFood } from '../../api/foodApi';

const AddFood = () => {
    const [itemName, setItemName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!imageFile) {
            setError('Please select an image file.');
            return;
        }

        // 1. Create FormData for file upload
        const formData = new FormData();
        formData.append('item_name', itemName);
        formData.append('quantity', quantity);
        formData.append('food_image', imageFile); // 'food_image' MUST match the name in server/middleware/upload.js

        try {
            await addFood(formData);
            alert('Food item successfully posted!');
            navigate('/dashboard'); 
        } catch (err) {
            setError(err);
        }
    };

    return (
        <div style={styles.container}>
            <h2>Post Food Item for Donation</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
                {error && <p style={styles.error}>{error}</p>}
                
                <input type="text" placeholder="Item Name (e.g., Lasagna)" value={itemName} onChange={(e) => setItemName(e.target.value)} required style={styles.input} />
                <input type="number" placeholder="Quantity (e.g., 20 servings)" value={quantity} onChange={(e) => setQuantity(e.target.value)} required style={styles.input} />
                
                {/* 2. File Input for Local Images */}
                <label style={styles.label}>Upload Image:</label>
                <input type="file" onChange={(e) => setImageFile(e.target.files[0])} required style={styles.fileInput} />
                
                <button type="submit" style={styles.button}>Post Food</button>
            </form>
        </div>
    );
};

const styles = { /* ... (Use existing styles or create new ones) ... */
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', fontFamily: 'Arial, sans-serif' },
    form: { display: 'flex', flexDirection: 'column', width: '400px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    input: { padding: '12px', margin: '8px 0', borderRadius: '4px', border: '1px solid #ccc' },
    fileInput: { padding: '10px 0', margin: '8px 0' },
    button: { padding: '12px', marginTop: '15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    error: { color: 'red', marginBottom: '10px', fontWeight: 'bold' },
    label: { marginTop: '10px', fontWeight: 'bold' }
};

export default AddFood;