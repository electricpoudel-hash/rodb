const express = require('express');
const router = express.Router();
const database = require('../config/database');
const { authenticate, requirePermission } = require('../middlewares/auth');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Admin: Get all ads (must be before /:id route)
router.get('/all', authenticate, requirePermission('ads.manage'), async (req, res) => {
    try {
        const ads = await database.all('SELECT * FROM advertisements ORDER BY created_at DESC');
        res.json({ ads });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all active ads (public)
router.get('/', async (req, res) => {
    try {
        const today = new Date().toISOString();
        const ads = await database.all(
            `SELECT * FROM advertisements 
       WHERE is_active = 1 
       AND (start_date IS NULL OR start_date <= ?)
       AND (end_date IS NULL OR end_date >= ?)`,
            [today, today]
        );
        res.json({ ads }); // Simplified logic, real-world would group by placement
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload ad image/video
router.post('/upload', authenticate, requirePermission('ads.manage'), async (req, res) => {
    try {
        const { base64Data, filename } = req.body;

        if (!base64Data || !filename) {
            return res.status(400).json({ error: 'base64Data and filename are required' });
        }

        // Remove data URL prefix if present
        const base64 = base64Data.replace(/^data:[^;]+;base64,/, '');

        // Generate unique filename - preserve extension
        const timestamp = Date.now();
        const ext = path.extname(filename);
        const baseName = path.basename(filename, ext).replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFilename = `${timestamp}-${baseName}${ext}`;
        const filePath = path.join(uploadsDir, uniqueFilename);

        // Convert base64 to buffer and save
        const buffer = Buffer.from(base64, 'base64');
        fs.writeFileSync(filePath, buffer);

        // Return URL
        const imageUrl = `/uploads/${uniqueFilename}`;
        res.json({ image_url: imageUrl, filename: uniqueFilename });
    } catch (error) {
        console.error('Ad upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Track impression (public)
router.post('/:id/impression', async (req, res) => {
    try {
        await database.run('UPDATE advertisements SET impression_count = impression_count + 1 WHERE id = ?', [req.params.id]);
        res.sendStatus(200);
    } catch (e) {
        res.sendStatus(500);
    }
});

// Track click (public)
router.post('/:id/click', async (req, res) => {
    try {
        await database.run('UPDATE advertisements SET click_count = click_count + 1 WHERE id = ?', [req.params.id]);
        res.sendStatus(200);
    } catch (e) {
        res.sendStatus(500);
    }
});

// Admin: Create ad
router.post('/', authenticate, requirePermission('ads.manage'), async (req, res) => {
    try {
        const { name, image_url, link_url, placement, width, height, start_date, end_date, ad_type } = req.body;
        const type = ad_type || (image_url ? 'image' : 'html');
        const result = await database.run(
            `INSERT INTO advertisements (name, ad_type, image_url, link_url, placement, width, height, start_date, end_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, type, image_url, link_url, placement, width, height, start_date || null, end_date || null]
        );
        logger.audit('ad_create', req.user.id, { id: result.lastID, name });
        res.status(201).json({ id: result.lastID, message: 'Ad created' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Update ad
router.put('/:id', authenticate, requirePermission('ads.manage'), async (req, res) => {
    try {
        const { name, image_url, link_url, placement, width, height, is_active, start_date, end_date, ad_type } = req.body;
        const type = ad_type || (image_url ? 'image' : 'html');
        await database.run(
            `UPDATE advertisements SET 
       name = ?, ad_type = ?, image_url = ?, link_url = ?, placement = ?, 
       width = ?, height = ?, is_active = ?, start_date = ?, end_date = ? 
       WHERE id = ?`,
            [name, type, image_url, link_url, placement, width, height, is_active ? 1 : 0, start_date, end_date, req.params.id]
        );
        logger.audit('ad_update', req.user.id, { id: req.params.id, name });
        res.json({ message: 'Ad updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Delete ad
router.delete('/:id', authenticate, requirePermission('ads.manage'), async (req, res) => {
    try {
        await database.run('DELETE FROM advertisements WHERE id = ?', [req.params.id]);
        logger.audit('ad_delete', req.user.id, { id: req.params.id });
        res.json({ message: 'Ad deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
