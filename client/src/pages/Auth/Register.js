// client/src/pages/Auth/Register.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../api/authApi';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'restaurant', lat: '34.0522', lng: '-118.2437' // Default LA for testing location
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await register(formData);
            alert('Registration successful! Please log in.');
            navigate('/login'); 
            
        } catch (err) {
            setError(err);
        }
    };

    return (
        <div style={styles.container}>
            <h2>Register</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
                {error && <p style={styles.error}>{error}</p>}
                
                <input type="text" name="name" placeholder="Name (Restaurant/Charity)" value={formData.name} onChange={handleChange} required style={styles.input} />
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required style={styles.input} />
                <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required style={styles.input} />
                
                <label style={styles.label}>Registering as:</label>
                <select name="role" value={formData.role} onChange={handleChange} style={styles.select}>
                    <option value="restaurant">Restaurant Owner (Can add food)</option>
                    <option value="charity">Charity (Can request food)</option>
                </select>

                <p style={styles.locationInfo}>Location (Lat/Lng - Google Maps basic location for simplicity):</p>
                <input type="text" name="lat" placeholder="Latitude (e.g., 34.0522)" value={formData.lat} onChange={handleChange} required style={styles.input} />
                <input type="text" name="lng" placeholder="Longitude (e.g., -118.2437)" value={formData.lng} onChange={handleChange} required style={styles.input} />
                
                <button type="submit" style={styles.button}>Register</button>
            </form>
            <p style={styles.linkText}>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
    );
};

const styles = {
    // Reusing Login styles for simplicity and consistency
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', fontFamily: 'Arial, sans-serif' },
    form: { display: 'flex', flexDirection: 'column', width: '350px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    input: { padding: '12px', margin: '8px 0', borderRadius: '4px', border: '1px solid #ccc' },
    select: { padding: '12px', margin: '8px 0', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white' },
    button: { padding: '12px', marginTop: '15px', backgroundColor: '#3f51b5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' },
    error: { color: '#f44336', marginBottom: '10px', fontWeight: 'bold' },
    label: { marginTop: '10px', fontWeight: 'bold' },
    locationInfo: { marginTop: '15px', fontWeight: 'bold', fontSize: '14px', borderTop: '1px solid #eee', paddingTop: '10px' },
    linkText: { marginTop: '20px' }
};

export default Register;