// server/routes/users.js
const router = require('express').Router();
const pool = require('../db');
const { verifyToken, checkRole } = require('../middleware/auth');

// --- POST /api/requests (Atomic Endpoint: Charity places a request) ---
router.post('/requests', verifyToken, checkRole('charity'), async (req, res) => {
    try {
        const { food_id } = req.body;
        // User ID is taken securely from the JWT token
        const charity_id = req.user.id;

        // Atomic action: insert a new request
        const newRequest = await pool.query(
            'INSERT INTO requests (food_id, charity_id, status) VALUES ($1, $2, $3) RETURNING *',
            [food_id, charity_id, 'pending']
        );

        res.status(201).json({ msg: 'Food request created successfully.', request: newRequest.rows[0] });

    } catch (err) {
        console.error("Request POST Error:", err.message);
        // Handle case where food_id or charity_id is invalid (foreign key constraint)
        if (err.code === '23503') return res.status(404).json({ msg: 'Invalid food item or user ID.' });
        res.status(500).send('Server error');
    }
});

// --- PUT /api/requests/:id (Atomic Endpoint: Restaurant updates status) ---
router.put('/requests/:id', verifyToken, checkRole('restaurant'), async (req, res) => {
    try {
        const requestId = req.params.id;
        const { status } = req.body;

        // Atomic action: update request status, checking ownership via subquery
        const updateRequest = await pool.query(
            `UPDATE requests SET status = $1 WHERE request_id = $2 
             AND food_id IN (SELECT food_id FROM foods WHERE restaurant_id = $3) RETURNING *`,
            [status, requestId, req.user.id]
        );

        if (updateRequest.rows.length === 0) return res.status(404).json({ msg: 'Request not found or you do not own the food item.' });

        res.json({ msg: `Request status updated to ${status}.`, request: updateRequest.rows[0] });

    } catch (err) {
        console.error("Request PUT Error:", err.message);
        res.status(500).send('Server error');
    }
});

// ----------------------------------------------------------------------------------
// --- GET /api/dashboard (Atomic Endpoint: Role-aware data fetching) ---
// ----------------------------------------------------------------------------------
router.get('/dashboard', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        let data;

        if (role === 'restaurant') {
            // Restaurant Dashboard Query (Shows items posted and pending requests)
            data = await pool.query(
                `SELECT 
                    f.food_id, f.item_name, f.quantity, f.is_available, f.created_at,
                    json_agg(r.*) FILTER (WHERE r.request_id IS NOT NULL) as requests
                 FROM foods f
                 LEFT JOIN requests r ON f.food_id = r.food_id
                 WHERE f.restaurant_id = $1
                 GROUP BY f.food_id
                 ORDER BY f.created_at DESC`, [userId]
            );

        } else if (role === 'charity') {
            // Charity Dashboard Query (Shows items requested and status)
            data = await pool.query(
                `SELECT 
                    r.*, f.item_name, f.quantity, u.name as restaurant_name 
                 FROM requests r
                 JOIN foods f ON r.food_id = f.food_id
                 JOIN users u ON f.restaurant_id = u.user_id
                 WHERE r.charity_id = $1
                 ORDER BY r.requested_at DESC`, [userId]
            );
        } else {
            return res.status(403).json({ msg: 'Invalid user role for dashboard access.' });
        }
        
        res.json(data.rows);

    } catch (err) {
        // This log is the key. You must check the terminal for the error message here.
        console.error("Dashboard SQL Error (Check u.name in query):", err.message);
        res.status(500).json({ msg: 'Internal server error while fetching dashboard data.' });
    }
});

module.exports = router;