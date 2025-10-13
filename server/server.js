// server/server.js
// 1. Load environment variables FIRST
require('dotenv').config(); 

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware (Must be loaded before routes)
app.use(cors());
app.use(express.json());

// Static folder for images (Local Images)
// This is required to serve files from your /uploads folder
app.use('/uploads', express.static('uploads'));

// --- Route Imports (Structure Layer) ---
const authRouter = require('./routes/auth');
const foodsRouter = require('./routes/foods');
const usersRouter = require('./routes/users');

// --- Route Wiring ---
app.use('/api', authRouter);
app.use('/api', foodsRouter);
app.use('/api', usersRouter);

// Test Route
app.get('/', (req, res) => {
    res.send('Food Redistribution Backend Running!');
});

// Start Server
// ⬇️ ⬇️ ⬇️  CRITICAL FIX APPLIED HERE ⬇️ ⬇️ ⬇️
app.listen(PORT, '0.0.0.0', () => { // <--- Added '0.0.0.0'
    // Changed console log to reflect the stable IP for clear debugging
    console.log(`Server is running on http://127.0.0.1:${PORT}`);
    console.log(`Connect to database: ${process.env.DB_DATABASE}`);
});