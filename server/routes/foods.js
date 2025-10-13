// server/routes/foods.js
const router = require('express').Router();
const pool = require('../db');
const { verifyToken, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload'); // Multer config

// --- POST /api/foods (Atomic Endpoint) ---
router.post('/foods', verifyToken, checkRole('restaurant'), (req, res) => {
    // 1. Handle file upload (Multer is the atomic action here)
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ msg: err.message });
        if (!req.file) return res.status(400).json({ msg: 'Please include a food image.' });

        try {
            const { item_name, quantity } = req.body;
            const restaurant_id = req.user.id;
            const image_path = `/uploads/${req.file.filename}`; // Path for client access

            // 2. Insert food data into DB
            const newFood = await pool.query(
                "INSERT INTO foods (restaurant_id, item_name, quantity, image_path) VALUES ($1, $2, $3, $4) RETURNING *",
                [restaurant_id, item_name, quantity, image_path]
            );

            res.status(201).json({ 
                msg: 'Food successfully posted for redistribution.', 
                food: newFood.rows[0] 
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    });
});

// --- GET /api/foods (Atomic Endpoint) ---
router.get('/foods', async (req, res) => {
    try {
        // Fetch all available food, join to get restaurant details (basic location)
        const allFoods = await pool.query(
            `SELECT f.*, u.name as restaurant_name, u.location_lat, u.location_lng 
             FROM foods f 
             JOIN users u ON f.restaurant_id = u.user_id 
             WHERE f.is_available = TRUE AND u.role = 'restaurant' 
             ORDER BY f.created_at DESC`
        );
        
        res.json(allFoods.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// --- PUT /api/foods/:id (Atomic Endpoint) ---
router.put('/foods/:id', verifyToken, checkRole('restaurant'), async (req, res) => {
    try {
        const foodId = req.params.id;
        const { is_available } = req.body;

        // Check ownership (optional, but good practice)
        const updateFood = await pool.query(
            'UPDATE foods SET is_available = $1 WHERE food_id = $2 AND restaurant_id = $3 RETURNING *',
            [is_available, foodId, req.user.id]
        );

        if (updateFood.rows.length === 0) return res.status(404).json({ msg: 'Food item not found or you do not own it.' });
        
        // This atomic action updates the availability status
        res.json({ msg: 'Food status updated.', food: updateFood.rows[0] });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;