// server/routes/auth.js
const router = require('express').Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// --- POST /api/register (Atomic Endpoint) ---
router.post('/register', async (req, res) => {
    try {
        const { email, password, role, name, lat, lng } = req.body;

        // Input validation (simplified)
        if (!email || !password || !role) return res.status(400).json({ msg: 'Missing credentials.' });

        // 1. Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 2. Insert user into DB
        const newUser = await pool.query(
            "INSERT INTO users (email, password_hash, role, name, location_lat, location_lng) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id, email, role",
            [email, passwordHash, role, name, lat, lng]
        );

        res.status(201).json({ 
            msg: 'Registration successful.', 
            user: newUser.rows[0] 
        });
    } catch (err) {
        // Handle unique email constraint violation
        if (err.code === '23505') return res.status(409).json({ msg: 'User with this email already exists.' });
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// --- POST /api/login (Atomic Endpoint) ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // 1. Select user by email
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) return res.status(401).json({ msg: 'Invalid Credentials.' });

        // 2. Compare password
        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPassword) return res.status(401).json({ msg: 'Invalid Credentials.' });

        // 3. Generate JWT Token
        const token = jwt.sign(
            { id: user.rows[0].user_id, role: user.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token, role: user.rows[0].role });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;