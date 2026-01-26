const express = require('express');
const router = express.Router();
const Article = require('../models/Article');

// Search articles
router.get('/', async (req, res) => {
    try {
        const { q, category, limit = 20 } = req.query;

        const articles = await Article.findAll({
            search: q,
            category_id: category,
            limit: parseInt(limit),
            status: 'published',
        });

        res.json({ results: articles, query: q });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
