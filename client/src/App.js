// client/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import all your page components

import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register'; 
import Dashboard from './pages/Dashboard';    
import FoodList from './pages/Food/FoodList'; 
import AddFood from './pages/Food/AddFood'; // <-- MUST BE IMPORTED
import Header from './components/Header'; 

// Simple component to protect routes (Checks if token exists)
const PrivateRoute = ({ children }) => {
    const isAuthenticated = localStorage.getItem('token');
    return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Header /> 
      <div className="content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/food-list" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/food-list" element={<FoodList />} />
          
          {/* INSERTION POINT: Add the new protected route here */}
          <Route path="/add-food" element={<PrivateRoute><AddFood /></PrivateRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;