const express = require('express');
const router = express.Router();
const database = require('../config/database');
const { authenticate, requirePermission } = require('../middlewares/auth');
const logger = require('../utils/logger');

// Get all categories (public)
router.get('/', async (req, res) => {
    try {
        const categories = await database.all(
            'SELECT * FROM categories WHERE is_enabled = 1 ORDER BY display_order ASC'
        );
        res.json({ categories });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single category
router.get('/:id', async (req, res) => {
    try {
        const category = await database.get(
            'SELECT * FROM categories WHERE id = ?',
            [req.params.id]
        );

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ category });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create category (admin)
router.post('/', authenticate, requirePermission('category.manage'), async (req, res) => {
    try {
        const { name, slug, description, parent_id, image_url, seo_title, seo_description } = req.body;

        if (!name || !slug) {
            return res.status(400).json({ error: 'Name and slug are required' });
        }

        const result = await database.run(
            `INSERT INTO categories (name, slug, description, parent_id, image_url, seo_title, seo_description, is_enabled, display_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM categories))`,
            [name, slug, description || null, parent_id || null, image_url || null, seo_title || name, seo_description || description]
        );

        logger.audit('category_create', req.user.id, { category_id: result.lastID, name });

        res.status(201).json({
            id: result.lastID,
            message: 'Category created successfully'
        });
    } catch (error) {
        logger.error('Create category error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Update category (admin)
router.put('/:id', authenticate, requirePermission('category.manage'), async (req, res) => {
    try {
        const { name, slug, description, parent_id, image_url, seo_title, seo_description, is_enabled, display_order } = req.body;

        const updates = [];
        const values = [];

        if (name !== undefined) { updates.push('name = ?'); values.push(name); }
        if (slug !== undefined) { updates.push('slug = ?'); values.push(slug); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (parent_id !== undefined) { updates.push('parent_id = ?'); values.push(parent_id); }
        if (image_url !== undefined) { updates.push('image_url = ?'); values.push(image_url); }
        if (seo_title !== undefined) { updates.push('seo_title = ?'); values.push(seo_title); }
        if (seo_description !== undefined) { updates.push('seo_description = ?'); values.push(seo_description); }
        if (is_enabled !== undefined) { updates.push('is_enabled = ?'); values.push(is_enabled ? 1 : 0); }
        if (display_order !== undefined) { updates.push('display_order = ?'); values.push(display_order); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(req.params.id);

        await database.run(
            `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        logger.audit('category_update', req.user.id, { category_id: req.params.id });

        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        logger.error('Update category error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Delete category (admin)
router.delete('/:id', authenticate, requirePermission('category.manage'), async (req, res) => {
    try {
        // Check if category has articles
        const articlesCount = await database.get(
            'SELECT COUNT(*) as count FROM articles WHERE category_id = ?',
            [req.params.id]
        );

        if (articlesCount.count > 0) {
            return res.status(400).json({
                error: `Cannot delete category with ${articlesCount.count} articles. Please reassign or delete articles first.`
            });
        }

        await database.run('DELETE FROM categories WHERE id = ?', [req.params.id]);

        logger.audit('category_delete', req.user.id, { category_id: req.params.id });

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        logger.error('Delete category error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
