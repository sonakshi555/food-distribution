// server/db.js
const { Pool } = require('pg');
// Assuming environment variables are loaded in server.js

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: 5432, 
});

// --- NEW CRITICAL SECTION ---
pool.connect()
    .then(client => {
        console.log("SUCCESS: PostgreSQL is connected and reachable! 🎉");
        client.release(); // Release the client back to the pool
    })
    .catch(err => {
        console.error("FATAL ERROR: Failed to connect to PostgreSQL.");
        console.error("Reason:", err.message);
        console.error("Check 1: Is your 'DB_PASSWORD' correct in .env?");
        console.error("Check 2: Is the PostgreSQL service running?");
        process.exit(1); // Exit with error code
    });
// --- END NEW CRITICAL SECTION ---

module.exports = pool;