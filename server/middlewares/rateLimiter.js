const rateLimit = require('express-rate-limit');
const securityConfig = require('../config/security');
const logger = require('../utils/logger');

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: securityConfig.rateLimit.windowMs,
    max: securityConfig.rateLimit.maxRequests,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many requests, please try again later',
        });
    },
});

// Strict rate limiter for login attempts
const loginLimiter = rateLimit({
    windowMs: securityConfig.loginRateLimit.windowMs,
    max: securityConfig.loginRateLimit.maxAttempts,
    skipSuccessfulRequests: true,
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Login rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many login attempts, please try again in 15 minutes',
        });
    },
});

// Strict rate limiter for registration
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many registration attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Registration rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many registration attempts, please try again in 1 hour',
        });
    },
});

// Moderate rate limiter for content creation
const createLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: 'Too many creation requests, please slow down',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    apiLimiter,
    loginLimiter,
    registerLimiter,
    createLimiter,
};
