const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { authenticate } = require('../middlewares/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Get all media
router.get('/', authenticate, async (req, res) => {
    res.json({ media: [] });
});

// Upload image with high quality processing
router.post('/upload', authenticate, async (req, res) => {
    try {
        const { base64Data, filename } = req.body;

        if (!base64Data || !filename) {
            return res.status(400).json({ error: 'base64Data and filename are required' });
        }

        // Remove data URL prefix if present
        const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');

        // Generate unique filename - always save as .jpg for consistency
        const timestamp = Date.now();
        const baseName = path.basename(filename, path.extname(filename)).replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFilename = `${timestamp}-${baseName}.jpg`;
        const filePath = path.join(uploadsDir, uniqueFilename);

        // Convert base64 to buffer
        const buffer = Buffer.from(base64, 'base64');

        // Process image with Sharp for compression only - no resizing to preserve aspect ratio
        try {
            await sharp(buffer)
                .jpeg({
                    quality: 92,
                    progressive: true,
                    mozjpeg: true
                })
                .toFile(filePath);
        } catch (sharpError) {
            console.error('Sharp processing error:', sharpError);
            // Fallback: save original image if Sharp fails
            fs.writeFileSync(filePath, buffer);
        }

        // Return URL
        const imageUrl = `/uploads/${uniqueFilename}`;
        res.json({ url: imageUrl, filename: uniqueFilename });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
