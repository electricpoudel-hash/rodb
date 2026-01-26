module.exports = {
    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    // Password Policy
    password: {
        minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
        requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
        requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true',
        requireNumber: process.env.PASSWORD_REQUIRE_NUMBER === 'true',
        requireSpecial: process.env.PASSWORD_REQUIRE_SPECIAL === 'true',
        saltRounds: 10,
    },

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    },

    // Login Rate Limiting
    loginRateLimit: {
        windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
        maxAttempts: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS) || 5,
        lockoutDuration: 900000, // 15 minutes
    },

    // Session Configuration
    session: {
        timeout: parseInt(process.env.SESSION_TIMEOUT) || 3600000, // 1 hour
    },

    // CORS Configuration
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
    },

    // Helmet Security Headers
    helmet: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                frameSrc: ["'self'", 'https://www.youtube.com', 'https://www.tiktok.com'],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
    },
};
