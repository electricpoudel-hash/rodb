const express = require('express');
const router = express.Router();
const ArticleController = require('../controllers/articleController');
const { authenticate, optionalAuth, requirePermission } = require('../middlewares/auth');
const { createLimiter } = require('../middlewares/rateLimiter');

// Public routes
router.get('/', optionalAuth, ArticleController.getAll);
router.get('/:id', optionalAuth, ArticleController.getOne);
router.get('/slug/:slug', optionalAuth, ArticleController.getBySlug);

// Protected routes
router.post('/', authenticate, requirePermission('article.create'), createLimiter, ArticleController.create);
router.put('/:id', authenticate, requirePermission('article.update'), ArticleController.update);
router.delete('/:id', authenticate, requirePermission('article.delete'), ArticleController.delete);
router.post('/:id/status', authenticate, requirePermission('article.approve'), ArticleController.changeStatus);
router.get('/:id/versions', authenticate, requirePermission('article.read'), ArticleController.getVersions);

module.exports = router;
