const express = require('express');
const router = express.Router();
const database = require('../config/database');
const { authenticate, requireRole } = require('../middlewares/auth');
const logger = require('../utils/logger');

// Get all settings (admin)
router.get('/', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
    try {
        const settings = await database.all('SELECT * FROM settings');
        res.json({ settings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get public settings
router.get('/public', async (req, res) => {
    try {
        const settings = await database.all(
            `SELECT key, value, type FROM settings 
       WHERE key IN ('org_name', 'org_short_name', 'org_email', 'site_title', 'site_description', 'ticker_enabled', 'ticker_text', 'nav_items', 'trending_articles', 'hot_news', 'about_content', 'contact_content', 'about_info', 'contact_info')`
        );
        res.json({ settings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update single setting
router.put('/:key', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        // Check if setting exists
        const existing = await database.get('SELECT * FROM settings WHERE key = ?', [key]);

        if (existing) {
            // Update existing setting
            await database.run(
                'UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ? WHERE key = ?',
                [value, req.user.id, key]
            );
        } else {
            // Create new setting
            await database.run(
                'INSERT INTO settings (key, value, updated_by) VALUES (?, ?, ?)',
                [key, value, req.user.id]
            );
        }

        logger.audit('setting_update', req.user.id, { key, value });

        res.json({ message: 'Setting updated successfully' });
    } catch (error) {
        console.error('Update setting error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
