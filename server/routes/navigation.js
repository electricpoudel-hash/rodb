const express = require('express');
const router = express.Router();
const database = require('../config/database');
const { authenticate, requirePermission } = require('../middlewares/auth');
const logger = require('../utils/logger');

// Get all navigation items (public)
router.get('/', async (req, res) => {
    try {
        const items = await database.all(
            'SELECT * FROM navigation_items WHERE is_enabled = 1 ORDER BY display_order ASC'
        );
        res.json({ items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get all items (including disabled)
router.get('/all', authenticate, requirePermission('settings.manage'), async (req, res) => {
    try {
        const items = await database.all('SELECT * FROM navigation_items ORDER BY display_order ASC');
        res.json({ items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Create item
router.post('/', authenticate, requirePermission('settings.manage'), async (req, res) => {
    try {
        const { label, url, parent_id, display_order } = req.body;
        const result = await database.run(
            'INSERT INTO navigation_items (label, url, parent_id, display_order) VALUES (?, ?, ?, ?)',
            [label, url, parent_id || null, display_order || 0]
        );
        logger.audit('nav_create', req.user.id, { id: result.lastID, label });
        res.status(201).json({ id: result.lastID, message: 'Navigation item created' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Update item
router.put('/:id', authenticate, requirePermission('settings.manage'), async (req, res) => {
    try {
        const { label, url, parent_id, display_order, is_enabled } = req.body;
        await database.run(
            'UPDATE navigation_items SET label = ?, url = ?, parent_id = ?, display_order = ?, is_enabled = ? WHERE id = ?',
            [label, url, parent_id || null, display_order, is_enabled ? 1 : 0, req.params.id]
        );
        logger.audit('nav_update', req.user.id, { id: req.params.id, label });
        res.json({ message: 'Navigation item updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Delete item
router.delete('/:id', authenticate, requirePermission('settings.manage'), async (req, res) => {
    try {
        await database.run('DELETE FROM navigation_items WHERE id = ?', [req.params.id]);
        logger.audit('nav_delete', req.user.id, { id: req.params.id });
        res.json({ message: 'Navigation item deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
