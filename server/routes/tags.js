const express = require('express');
const router = express.Router();
const database = require('../config/database');
const { authenticate } = require('../middlewares/auth');

// Get all tags
router.get('/', async (req, res) => {
    try {
        const tags = await database.all('SELECT * FROM tags ORDER BY usage_count DESC LIMIT 100');
        res.json({ tags });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create tag
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, slug } = req.body;
        const result = await database.run(
            'INSERT INTO tags (name, slug) VALUES (?, ?)',
            [name, slug]
        );
        res.status(201).json({ id: result.lastID, message: 'Tag created' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
