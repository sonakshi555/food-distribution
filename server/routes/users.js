// server/routes/users.js
const router = require('express').Router();
const pool = require('../db');
const { verifyToken, checkRole } = require('../middleware/auth');

// --- POST /api/requests (1. Charity places a request) ---
router.post('/requests', verifyToken, checkRole('charity'), async (req, res) => {
    try {
        const { food_id } = req.body; 
        const charity_id = req.user.id;

        const newRequest = await pool.query(
            'INSERT INTO requests (food_id, charity_id, status) VALUES ($1, $2, $3) RETURNING *',
            [food_id, charity_id, 'pending']
        );

        res.status(201).json({ msg: 'Food request created successfully.', request: newRequest.rows[0] });

    } catch (err) {
        console.error("Request POST Error:", err.message);
        if (err.code === '23503') return res.status(404).json({ msg: 'Invalid food item or user ID.' });
        res.status(500).send('Server error');
    }
});

// --- PUT /api/requests/:id (2. Restaurant updates status to accepted/rejected) ---
router.put('/requests/:id', verifyToken, checkRole('restaurant'), async (req, res) => {
    try {
        const requestId = req.params.id;
        const { status } = req.body; 

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

// --- PUT /api/requests/:id/complete (3. Finalizes pickup and marks food unavailable) ---
router.put('/requests/:id/complete', verifyToken, checkRole('restaurant'), async (req, res) => {
    const requestId = req.params.id;
    const userId = req.user.id;
    
    try {
        // 1. Mark the request as 'completed'
        const result = await pool.query(
            `UPDATE requests SET status = 'completed' 
             WHERE request_id = $1 AND food_id IN 
             (SELECT food_id FROM foods WHERE restaurant_id = $2) 
             RETURNING food_id`,
            [requestId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: "Request not found or unauthorized." });
        }

        const foodId = result.rows[0].food_id;

        // 2. Mark the related food item as unavailable (is_available = FALSE)
        await pool.query(
            `UPDATE foods SET is_available = FALSE WHERE food_id = $1`,
            [foodId]
        );

        res.json({ msg: "Pickup confirmed and food marked unavailable." });
    } catch (err) {
        console.error("Completion Error:", err.message);
        res.status(500).json({ msg: "Server error during finalization." });
    }
});

// --- POST /api/feedback (4. Saves charity/restaurant feedback) ---
router.post('/feedback', verifyToken, async (req, res) => {
    const { requestId, rating, comment } = req.body;
    const submittedBy = req.user.id;

    try {
        await pool.query(
            `INSERT INTO feedback (request_id, rating, comment, submitted_by)
             VALUES ($1, $2, $3, $4)`,
            [requestId, rating, comment, submittedBy]
        );
        res.status(201).json({ msg: "Feedback submitted successfully." });
    } catch (err) {
        console.error("Feedback Error:", err.message);
        res.status(500).json({ msg: "Error saving feedback (or feedback already submitted)." });
    }
});


// ----------------------------------------------------------------------------------
// --- GET /api/dashboard (5. Role-aware data fetching: Restaurant/Charity) ---
// ----------------------------------------------------------------------------------
router.get('/dashboard', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        let data;

        // Block Admin access to this route, forcing them to use the monitor endpoint
        if (role === 'admin') {
             return res.status(403).json({ msg: 'Admin must use the monitor endpoint.' });
        }

        if (role === 'restaurant') {
            // RESTAURANT VIEW
            data = await pool.query(
                `SELECT 
                    f.food_id, f.item_name, f.quantity, f.is_available, f.created_at,
                    
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'request_id', r.request_id, 'status', r.status, 'charity_id', r.charity_id,
                                'charity_address', c.address_text, 'rating', fbk.rating, 'comment', fbk.comment
                            )
                        ) FILTER (WHERE r.request_id IS NOT NULL), 
                        '[]'::json
                    ) as requests
                    
                 FROM foods f
                 LEFT JOIN requests r ON f.food_id = r.food_id
                 LEFT JOIN users c ON r.charity_id = c.user_id      
                 LEFT JOIN feedback fbk ON r.request_id = fbk.request_id 
                 WHERE f.restaurant_id = $1
                 GROUP BY f.food_id
                 ORDER BY f.created_at DESC`, [userId]
            );

        } else if (role === 'charity') {
            // CHARITY VIEW
            data = await pool.query(
                `SELECT 
                    r.*, f.item_name, f.quantity, 
                    u.name as restaurant_name,
                    u.location_lat, u.location_lng, 
                    fbk.rating, fbk.comment
                 FROM requests r
                 JOIN foods f ON r.food_id = f.food_id
                 JOIN users u ON f.restaurant_id = u.user_id
                 LEFT JOIN feedback fbk ON r.request_id = fbk.request_id 
                 WHERE r.charity_id = $1
                 ORDER BY r.requested_at DESC`, [userId]
            );
        } else {
            return res.status(403).json({ msg: 'Invalid user role for dashboard access.' });
        }
        
        res.json(data.rows);

    } catch (err) {
        console.error("Dashboard SQL Error:", err.message);
        res.status(500).json({ msg: 'Internal server error while fetching dashboard data.' });
    }
});


// ----------------------------------------------------------------------------------
// --- GET /api/admin/monitor (6. Admin Monitoring Endpoint) ---
// ----------------------------------------------------------------------------------
router.get('/admin/monitor', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        // Query 1: Get All Users
        const allUsers = await pool.query(
            `SELECT user_id, name, email, role, phone_number, address_text FROM users 
             ORDER BY role, user_id`
        );

        // Query 2: Get All Food Items with Status and Aggregate Requests/Feedback
        const allFoodDetails = await pool.query(
            `SELECT 
                f.food_id, f.item_name, f.quantity, f.is_available, f.created_at,
                u.name as restaurant_name, u.email as restaurant_email,
                
                COALESCE(
                    json_agg(
                        json_build_object(
                            'request_id', r.request_id, 'status', r.status, 'charity_id', r.charity_id,
                            'charity_address', c.address_text, 'rating', fbk.rating, 'comment', fbk.comment
                        )
                    ) FILTER (WHERE r.request_id IS NOT NULL), 
                    '[]'::json
                ) as requests_history
             FROM foods f
             JOIN users u ON f.restaurant_id = u.user_id
             LEFT JOIN requests r ON f.food_id = r.food_id
             LEFT JOIN users c ON r.charity_id = c.user_id 
             LEFT JOIN feedback fbk ON r.request_id = fbk.request_id
             GROUP BY f.food_id, u.name, u.email, f.item_name, f.quantity, f.is_available, f.created_at
             ORDER BY f.food_id DESC`
        );

        res.json({
            users: allUsers.rows,
            foodItems: allFoodDetails.rows
        });

    } catch (err) {
        console.error("Admin Monitoring Error:", err.message);
        res.status(500).json({ msg: 'Internal server error during monitoring fetch.' });
    }
});


// --- DELETE /api/admin/user/:userId (Admin Control Endpoint) ---
router.delete('/admin/user/:userId', verifyToken, checkRole('admin'), async (req, res) => {
    const { userId } = req.params;
    
    try {
        const userId = req.params.userId;

        // CRITICAL STEP: Identify ALL food IDs posted by this user
        const postedFoodIdsResult = await pool.query(
            'SELECT food_id FROM foods WHERE restaurant_id = $1',
            [userId]
        );
        const postedFoodIds = postedFoodIdsResult.rows.map(row => row.food_id);

        // 1. Delete all Feedback records related to the user, whether submitted by them OR related to food they posted.
        if (postedFoodIds.length > 0) {
             await pool.query(`DELETE FROM feedback WHERE request_id IN (SELECT request_id FROM requests WHERE food_id = ANY($1))`, [postedFoodIds]);
        }
        await pool.query('DELETE FROM feedback WHERE submitted_by = $1', [userId]);

        // 2. Delete all Requests (Orders) linked to this user, either as a Charity or linked to their posted food.
        if (postedFoodIds.length > 0) {
            await pool.query(`DELETE FROM requests WHERE food_id = ANY($1)`, [postedFoodIds]);
        }
        await pool.query('DELETE FROM requests WHERE charity_id = $1', [userId]);

        // 3. Delete all food items posted by this user (Restaurant data).
        await pool.query('DELETE FROM foods WHERE restaurant_id = $1', [userId]);
        
        // 4. Finally, delete the user record itself.
        const result = await pool.query(
            'DELETE FROM users WHERE user_id = $1 RETURNING user_id',
            [userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ msg: "User not found." });
        }

        res.json({ msg: `User ID ${userId} removed successfully.` });

    } catch (err) {
        console.error("Admin Delete FATAL Error:", err.message);
        if (err.code === '23503') {
             return res.status(400).json({ msg: "Cannot delete user. Final foreign key dependencies still exist." });
        }
        res.status(500).json({ msg: 'Server error during user removal.' });
    }
});


module.exports = router;