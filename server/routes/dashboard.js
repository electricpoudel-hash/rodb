const express = require('express');
const router = express.Router();
const database = require('../config/database');
const { authenticate, requireRole } = require('../middlewares/auth');

// Dashboard stats (admin only)
router.get('/stats', authenticate, requireRole('super_admin', 'admin', 'editor'), async (req, res) => {
    try {
        // Get article counts by status with error handling
        let articleStats = [];
        try {
            articleStats = await database.all(
                'SELECT status, COUNT(*) as count FROM articles GROUP BY status'
            );
        } catch (error) {
            console.error('Error fetching article stats:', error);
            articleStats = [];
        }

        // Get user counts by role with error handling
        let userStats = [];
        try {
            userStats = await database.all(
                `SELECT r.name as role, COUNT(*) as count 
           FROM user_roles ur 
           JOIN roles r ON ur.role_id = r.id 
           GROUP BY r.name`
            );
        } catch (error) {
            console.error('Error fetching user stats:', error);
            userStats = [];
        }

        // Get total views with error handling
        let viewStats = { total_views: 0 };
        try {
            const result = await database.get(
                'SELECT SUM(view_count) as total_views FROM articles WHERE status = "published"'
            );
            viewStats = result || { total_views: 0 };
        } catch (error) {
            console.error('Error fetching view stats:', error);
        }

        // Get pending approvals with error handling
        let pendingCount = { count: 0 };
        try {
            const result = await database.get(
                'SELECT COUNT(*) as count FROM articles WHERE status = "pending"'
            );
            pendingCount = result || { count: 0 };
        } catch (error) {
            console.error('Error fetching pending count:', error);
        }

        // Get breaking news count with error handling
        let breakingCount = { count: 0 };
        try {
            const result = await database.get(
                'SELECT COUNT(*) as count FROM articles WHERE is_breaking = 1 AND status = "published"'
            );
            breakingCount = result || { count: 0 };
        } catch (error) {
            console.error('Error fetching breaking count:', error);
        }

        res.json({
            articles: articleStats,
            users: userStats,
            totalViews: viewStats?.total_views || 0,
            pendingApprovals: pendingCount?.count || 0,
            breakingNews: breakingCount?.count || 0,
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        // Return default values instead of error to prevent frontend from breaking
        res.json({
            articles: [],
            users: [],
            totalViews: 0,
            pendingApprovals: 0,
            breakingNews: 0,
        });
    }
});

module.exports = router;
