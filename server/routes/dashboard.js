const express = require('express');
const router = express.Router();
const database = require('../config/database');
const { authenticate, requireRole } = require('../middlewares/auth');

// Dashboard stats (admin only)
router.get('/stats', authenticate, requireRole('super_admin', 'admin', 'editor'), async (req, res) => {
    try {
        // Get article counts by status
        const articleStats = await database.all(
            'SELECT status, COUNT(*) as count FROM articles GROUP BY status'
        );

        // Get user counts by role
        const userStats = await database.all(
            `SELECT r.name as role, COUNT(*) as count 
       FROM user_roles ur 
       JOIN roles r ON ur.role_id = r.id 
       GROUP BY r.name`
        );

        // Get total views
        const viewStats = await database.get(
            'SELECT SUM(view_count) as total_views FROM articles WHERE status = "published"'
        );

        // Get pending approvals
        const pendingCount = await database.get(
            'SELECT COUNT(*) as count FROM articles WHERE status = "pending"'
        );

        // Get breaking news count
        const breakingCount = await database.get(
            'SELECT COUNT(*) as count FROM articles WHERE is_breaking = 1 AND status = "published"'
        );

        res.json({
            articles: articleStats,
            users: userStats,
            totalViews: viewStats?.total_views || 0,
            pendingApprovals: pendingCount?.count || 0,
            breakingNews: breakingCount?.count || 0,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
