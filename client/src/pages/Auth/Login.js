// client/src/pages/Auth/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../api/authApi';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const data = await login(email, password);
            alert(`Login successful! Role: ${data.role}`);
            navigate('/dashboard'); 
            
        } catch (err) {
            setError(err);
        }
    };

    return (
        <div style={styles.container}>
            <h2>Login</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
                {error && <p style={styles.error}>{error}</p>}
                
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />
                
                <button type="submit" style={styles.button}>Login</button>
            </form>
            <p style={styles.linkText}>Don't have an account? <Link to="/register">Register here</Link></p>
        </div>
    );
};

// Simple styles (move to App.css or separate file later)
const styles = {
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', fontFamily: 'Arial, sans-serif' },
    form: { display: 'flex', flexDirection: 'column', width: '300px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    input: { padding: '12px', margin: '8px 0', borderRadius: '4px', border: '1px solid #ccc' },
    button: { padding: '12px', marginTop: '15px', backgroundColor: '#3f51b5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' },
    error: { color: '#f44336', marginBottom: '10px', fontWeight: 'bold' },
    linkText: { marginTop: '20px' }
};

export default Login;