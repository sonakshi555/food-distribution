// client/src/components/Header.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../api/authApi';

const Header = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
       <header className="app-header">
            <Link to="/" style={styles.logo}>Food Redistribution App</Link>
            <nav style={styles.nav}>
                <Link to="/food-list" style={styles.link}>Food List</Link>
                {token ? (
                    <>
                        <Link to="/dashboard" style={styles.link}>Dashboard ({role})</Link>
                        {role === 'restaurant' && (
                            <Link to="/add-food" style={styles.link}>Add Food</Link>
                        )}
                        <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={styles.link}>Login</Link>
                        <Link to="/register" style={styles.link}>Register</Link>
                    </>
                )}
            </nav>
        </header>
    );
};

const styles = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', backgroundColor: '#2196F3', color: 'white' },
    logo: { color: 'white', textDecoration: 'none', fontSize: '24px', fontWeight: 'bold' },
    nav: { display: 'flex', gap: '15px' },
    link: { color: 'white', textDecoration: 'none', fontSize: '16px' },
    logoutButton: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px', padding: 0 }
};

export default Header;