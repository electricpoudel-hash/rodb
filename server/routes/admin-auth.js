const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const securityConfig = require('../config/security');
const logger = require('../utils/logger');
const { loginLimiter } = require('../middlewares/rateLimiter');

// Admin credentials (stored as environment variables)
const ADMIN_ID = process.env.ADMIN_ID || 'fujitshuu@45';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'bIJEji3#@!5gg';
const ADMIN_SECRET = process.env.ADMIN_SECRET || securityConfig.jwt.secret;

// Verify admin token middleware
const verifyAdminToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, ADMIN_SECRET);
        if (decoded.type !== 'admin' || !decoded.isAdmin) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.adminId = decoded.adminId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Admin login endpoint
router.post('/login', loginLimiter, (req, res) => {
    try {
        const { id, password } = req.body;

        if (!id || !password) {
            return res.status(400).json({ error: 'ID and password are required' });
        }

        // Verify credentials
        if (id !== ADMIN_ID || password !== ADMIN_PASSWORD) {
            logger.warn(`Failed admin login attempt: ${id}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate admin token
        const token = jwt.sign(
            {
                adminId: id,
                type: 'admin',
                isAdmin: true,
                iat: Math.floor(Date.now() / 1000)
            },
            ADMIN_SECRET,
            { expiresIn: '24h' }
        );

        logger.audit('admin_login', null, {
            ip: req.ip,
            userAgent: req.get('user-agent')
        });

        res.json({
            success: true,
            token,
            admin: {
                id: ADMIN_ID,
                role: 'admin'
            }
        });
    } catch (error) {
        logger.error('Admin login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Verify admin token
router.get('/verify', verifyAdminToken, (req, res) => {
    res.json({
        success: true,
        admin: {
            id: req.adminId,
            role: 'admin'
        }
    });
});

// Admin logout
router.post('/logout', verifyAdminToken, (req, res) => {
    logger.audit('admin_logout', null, {
        ip: req.ip,
        adminId: req.adminId
    });
    res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = { router, verifyAdminToken };
