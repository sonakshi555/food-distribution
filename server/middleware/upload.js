// server/middleware/upload.js
const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb){
        // Format filename: food-ID-timestamp.ext
        cb(null, 'food-' + Date.now() + path.extname(file.originalname));
    }
});

// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // 1MB limit
    fileFilter: function(req, file, cb){
        if(file.mimetype.startsWith('image/')){
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed.'), false); // Ensure error handling for non-images
        }
    }
}).single('food_image'); // The field name in the client form must be 'food_image'

module.exports = upload;