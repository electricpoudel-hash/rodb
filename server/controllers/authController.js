const AuthService = require('../services/authService');
const logger = require('../utils/logger');

class AuthController {
    // Login
    static async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password are required' });
            }

            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('user-agent');

            const result = await AuthService.login(username, password, ipAddress, userAgent);

            res.json(result);
        } catch (error) {
            logger.error('Login controller error:', error);
            res.status(401).json({ error: error.message });
        }
    }

    // Logout
    static async logout(req, res) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (token) {
                await AuthService.logout(token);
            }

            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            logger.error('Logout controller error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Register
    static async register(req, res) {
        try {
            const { username, email, password, full_name } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({ error: 'Username, email, and password are required' });
            }

            const user = await AuthService.register({ username, email, password, full_name });

            res.status(201).json({
                message: 'Registration successful',
                user
            });
        } catch (error) {
            logger.error('Registration controller error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Refresh token
    static async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({ error: 'Refresh token is required' });
            }

            const result = await AuthService.refreshToken(refreshToken);

            res.json(result);
        } catch (error) {
            logger.error('Token refresh controller error:', error);
            res.status(401).json({ error: error.message });
        }
    }

    // Get current user
    static async me(req, res) {
        try {
            res.json({ user: req.user });
        } catch (error) {
            logger.error('Me controller error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Change password
    static async changePassword(req, res) {
        try {
            const { oldPassword, newPassword } = req.body;

            if (!oldPassword || !newPassword) {
                return res.status(400).json({ error: 'Old password and new password are required' });
            }

            await AuthService.changePassword(req.user.id, oldPassword, newPassword);

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            logger.error('Change password controller error:', error);
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = AuthController;
