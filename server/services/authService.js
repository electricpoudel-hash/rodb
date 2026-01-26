const jwt = require('jsonwebtoken');
const User = require('../models/User');
const database = require('../config/database');
const securityConfig = require('../config/security');
const logger = require('../utils/logger');

class AuthService {
    // Login
    static async login(username, password, ipAddress, userAgent) {
        try {
            // Find user
            const user = await User.findByUsername(username);

            if (!user) {
                logger.warn(`Login attempt with non-existent username: ${username}`);
                throw new Error('Invalid credentials');
            }

            // Check if account is locked
            if (await User.isLocked(user.id)) {
                throw new Error('Account is temporarily locked due to multiple failed login attempts');
            }

            // Check if account is suspended
            if (user.is_suspended) {
                throw new Error('Account is suspended');
            }

            if (!user.is_active) {
                throw new Error('Account is not active');
            }

            // Verify password
            const isValid = await User.verifyPassword(password, user.password_hash);

            if (!isValid) {
                await User.recordFailedLogin(user.id);
                throw new Error('Invalid credentials');
            }

            // Reset failed login attempts
            await User.resetFailedLogins(user.id);

            // Get user with roles and permissions
            const userWithRoles = await User.findByIdWithRoles(user.id);
            const permissions = await User.getUserPermissions(user.id);

            // Generate tokens
            const accessToken = this.generateAccessToken(user.id);
            const refreshToken = this.generateRefreshToken(user.id);

            // Store session
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            await database.run(
                `INSERT INTO sessions (user_id, token, refresh_token, ip_address, user_agent, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
                [user.id, accessToken, refreshToken, ipAddress, userAgent, expiresAt.toISOString()]
            );

            // Log successful login
            logger.audit('login', user.id, { ip: ipAddress, userAgent });

            return {
                user: {
                    ...userWithRoles,
                    permissions: permissions.map(p => p.name),
                },
                accessToken,
                refreshToken,
            };
        } catch (error) {
            logger.error('Login error:', error);
            throw error;
        }
    }

    // Logout
    static async logout(token) {
        try {
            await database.run('DELETE FROM sessions WHERE token = ?', [token]);
            logger.info('User logged out');
        } catch (error) {
            logger.error('Logout error:', error);
            throw error;
        }
    }

    // Refresh token
    static async refreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, securityConfig.jwt.refreshSecret);

            const session = await database.get(
                'SELECT * FROM sessions WHERE refresh_token = ? AND user_id = ?',
                [refreshToken, decoded.userId]
            );

            if (!session) {
                throw new Error('Invalid refresh token');
            }

            // Check if session expired
            if (new Date(session.expires_at) < new Date()) {
                await database.run('DELETE FROM sessions WHERE id = ?', [session.id]);
                throw new Error('Session expired');
            }

            // Generate new access token
            const newAccessToken = this.generateAccessToken(decoded.userId);

            // Update session
            await database.run(
                'UPDATE sessions SET token = ? WHERE id = ?',
                [newAccessToken, session.id]
            );

            return { accessToken: newAccessToken };
        } catch (error) {
            logger.error('Token refresh error:', error);
            throw error;
        }
    }

    // Generate access token
    static generateAccessToken(userId) {
        return jwt.sign(
            { userId, type: 'access' },
            securityConfig.jwt.secret,
            { expiresIn: securityConfig.jwt.expiresIn }
        );
    }

    // Generate refresh token
    static generateRefreshToken(userId) {
        return jwt.sign(
            { userId, type: 'refresh' },
            securityConfig.jwt.refreshSecret,
            { expiresIn: securityConfig.jwt.refreshExpiresIn }
        );
    }

    // Verify token
    static async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, securityConfig.jwt.secret);

            // Check if session exists
            const session = await database.get(
                'SELECT * FROM sessions WHERE token = ? AND user_id = ?',
                [token, decoded.userId]
            );

            if (!session) {
                throw new Error('Session not found');
            }

            // Check if session expired
            if (new Date(session.expires_at) < new Date()) {
                await database.run('DELETE FROM sessions WHERE id = ?', [session.id]);
                throw new Error('Session expired');
            }

            return decoded;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    // Register new user
    static async register(userData) {
        try {
            const { username, email, password, full_name } = userData;

            // Check if username exists
            const existingUsername = await User.findByUsername(username);
            if (existingUsername) {
                throw new Error('Username already exists');
            }

            // Check if email exists
            const existingEmail = await User.findByEmail(email);
            if (existingEmail) {
                throw new Error('Email already exists');
            }

            // Validate password
            this.validatePassword(password);

            // Create user
            const user = await User.create({ username, email, password, full_name });

            // Assign default role (registered_user)
            const defaultRole = await database.get('SELECT id FROM roles WHERE name = ?', ['registered_user']);
            if (defaultRole) {
                await User.assignRole(user.id, defaultRole.id, null);
            }

            logger.audit('register', user.id, { username, email });

            return user;
        } catch (error) {
            logger.error('Registration error:', error);
            throw error;
        }
    }

    // Validate password against policy
    static validatePassword(password) {
        const { minLength, requireUppercase, requireLowercase, requireNumber, requireSpecial } = securityConfig.password;

        if (password.length < minLength) {
            throw new Error(`Password must be at least ${minLength} characters long`);
        }

        if (requireUppercase && !/[A-Z]/.test(password)) {
            throw new Error('Password must contain at least one uppercase letter');
        }

        if (requireLowercase && !/[a-z]/.test(password)) {
            throw new Error('Password must contain at least one lowercase letter');
        }

        if (requireNumber && !/[0-9]/.test(password)) {
            throw new Error('Password must contain at least one number');
        }

        if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            throw new Error('Password must contain at least one special character');
        }

        return true;
    }

    // Change password
    static async changePassword(userId, oldPassword, newPassword) {
        try {
            const user = await database.get('SELECT * FROM users WHERE id = ?', [userId]);

            if (!user) {
                throw new Error('User not found');
            }

            // Verify old password
            const isValid = await User.verifyPassword(oldPassword, user.password_hash);
            if (!isValid) {
                throw new Error('Current password is incorrect');
            }

            // Validate new password
            this.validatePassword(newPassword);

            // Update password
            await User.updatePassword(userId, newPassword);

            // Invalidate all sessions
            await database.run('DELETE FROM sessions WHERE user_id = ?', [userId]);

            logger.audit('password_change', userId, {});

            return true;
        } catch (error) {
            logger.error('Password change error:', error);
            throw error;
        }
    }
}

module.exports = AuthService;
