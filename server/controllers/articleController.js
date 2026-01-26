const Article = require('../models/Article');
const logger = require('../utils/logger');

class ArticleController {
    // Get all articles (public)
    static async getAll(req, res) {
        try {
            const { category, author, status, search, limit, offset, featured, breaking } = req.query;

            const filters = {
                category_id: category,
                author_id: author,
                status: status,
                search: search,
                limit: parseInt(limit) || 20,
                offset: parseInt(offset) || 0,
                is_featured: featured === 'true' ? true : undefined,
                is_breaking: breaking === 'true' ? true : undefined,
                includeUnpublished: req.user ? true : false,
                checkSchedule: true // Enable schedule check
            };

            const articles = await Article.findAll(filters);
            res.json({ articles });
        } catch (error) {
            logger.error('Get articles error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Get single article
    static async getOne(req, res) {
        try {
            const { id } = req.params;
            const article = await Article.findById(id, !!req.user);

            if (!article) {
                return res.status(404).json({ error: 'Article not found' });
            }

            // Increment view count for published articles
            if (article.status === 'published') {
                await Article.incrementViews(id);
            }

            res.json({ article });
        } catch (error) {
            logger.error('Get article error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Get article by slug
    static async getBySlug(req, res) {
        try {
            const { slug } = req.params;
            const article = await Article.findBySlug(slug, !!req.user);

            if (!article) {
                return res.status(404).json({ error: 'Article not found' });
            }

            if (article.status === 'published') {
                await Article.incrementViews(article.id);
            }

            res.json({ article });
        } catch (error) {
            logger.error('Get article by slug error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Create article
    static async create(req, res) {
        try {
            const articleData = {
                ...req.body,
                author_id: req.user.id,
            };

            const article = await Article.create(articleData);

            // Add tags if provided
            if (req.body.tags && req.body.tags.length > 0) {
                await Article.addTags(article.id, req.body.tags);
            }

            logger.audit('article_create', req.user.id, { article_id: article.id });
            res.status(201).json({ article });
        } catch (error) {
            logger.error('Create article error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Update article
    static async update(req, res) {
        try {
            const { id } = req.params;
            const article = await Article.update(id, req.body, req.user.id);

            logger.audit('article_update', req.user.id, { article_id: id });
            res.json({ article });
        } catch (error) {
            logger.error('Update article error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Delete article
    static async delete(req, res) {
        try {
            const { id } = req.params;
            await Article.delete(id);

            logger.audit('article_delete', req.user.id, { article_id: id });
            res.json({ message: 'Article deleted successfully' });
        } catch (error) {
            logger.error('Delete article error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Change article status
    static async changeStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            await Article.changeStatus(id, status, req.user.id);

            logger.audit('article_status_change', req.user.id, { article_id: id, status });
            res.json({ message: 'Article status updated successfully' });
        } catch (error) {
            logger.error('Change article status error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Get article versions
    static async getVersions(req, res) {
        try {
            const { id } = req.params;
            const versions = await Article.getVersions(id);
            res.json({ versions });
        } catch (error) {
            logger.error('Get versions error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = ArticleController;
