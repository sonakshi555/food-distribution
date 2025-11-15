// client/src/pages/Auth/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../api/authApi';
import '../../index.css'; // Assuming styles are now primarily here

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loginType, setLoginType] = useState('user'); // 'user' (default) or 'admin'
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const data = await login(email, password);
            
            // Critical Role Check based on the chosen path
            if (loginType === 'user' && data.role === 'admin') {
                setError('Admin accounts must use the Admin Login portal.');
                return;
            }
            if (loginType === 'admin' && data.role !== 'admin') {
                setError('Only Administrator accounts are permitted here.');
                return;
            }

            alert(`Login successful! Role: ${data.role}`);
            navigate('/dashboard'); 
            
        } catch (err) {
            setError(err);
        }
    };

    const handleSwitchToAdmin = () => setLoginType('admin');
    const handleSwitchToUser = () => setLoginType('user');


    // --- Common Login Form (Used by both views) ---
    const LoginForm = ({ roleLabel }) => (
        <form onSubmit={handleSubmit} className="form-container" style={{ width: '300px' }}>
            <h3 style={{ marginTop: 0 }}>{roleLabel} Login</h3>
            {error && <p className="error-message">{error}</p>}
            
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" />
            
            <button type="submit" className="button login-button" style={{ marginTop: '15px' }}>Log In</button>
        </form>
    );

    // --- Main Render Block ---
    return (
        <div className="app-container" style={styles.container}>
            <h2>Welcome Back</h2>
            
            {loginType === 'user' ? (
                // --- USER (Restaurant/Charity) CARD ---
                <div className="card" style={styles.card}>
                    <LoginForm roleLabel="Restaurant / Charity" />
                    <button onClick={handleSwitchToAdmin} className="button" style={styles.switchButton}>
                        Switch to Admin Login
                    </button>
                    <p style={styles.linkText}>Don't have an account? <Link to="/register">Register here</Link></p>
                </div>
            ) : (
                // --- ADMIN CARD ---
                <div className="card" style={styles.card}>
                    <LoginForm roleLabel="System Administrator" />
                    <button onClick={handleSwitchToUser} className="button" style={styles.switchButton}>
                        Switch to User Login
                    </button>
                    <p style={styles.linkText}>Only existing Admin accounts can log in here.</p>
                </div>
            )}
        </div>
    );
};

// Local styles for structure (not presentation)
const styles = {
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', fontFamily: 'Arial, sans-serif' },
    card: { padding: '20px', width: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    switchButton: { marginTop: '10px', backgroundColor: '#e0e0e0', color: '#333', padding: '10px', fontSize: '14px' },
    linkText: { marginTop: '20px' }
};

export default Login;