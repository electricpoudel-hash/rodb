const database = require('../config/database');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

class User {
    // Create new user
    static async create(userData) {
        const { username, email, password, full_name, bio } = userData;

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        const result = await database.run(
            `INSERT INTO users (username, email, password_hash, full_name, bio, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
            [username, email, password_hash, full_name || null, bio || null, 1]
        );

        return await this.findById(result.lastID);
    }

    // Find user by ID
    static async findById(id) {
        const user = await database.get(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );

        if (user) {
            delete user.password_hash;
        }

        return user;
    }

    // Find user by username
    static async findByUsername(username) {
        return await database.get(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
    }

    // Find user by email
    static async findByEmail(email) {
        return await database.get(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
    }

    // Verify password
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Get user with roles
    static async findByIdWithRoles(id) {
        const user = await this.findById(id);
        if (!user) return null;

        const roles = await database.all(
            `SELECT r.* FROM roles r
       INNER JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = ?`,
            [id]
        );

        user.roles = roles;
        return user;
    }

    // Get user permissions
    static async getUserPermissions(userId) {
        const permissions = await database.all(
            `SELECT DISTINCT p.* FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = ?`,
            [userId]
        );

        return permissions;
    }

    // Check if user has permission
    static async hasPermission(userId, permissionName) {
        const permission = await database.get(
            `SELECT p.* FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = ? AND p.name = ?`,
            [userId, permissionName]
        );

        return !!permission;
    }

    // Update user
    static async update(id, updates) {
        const allowedFields = ['full_name', 'bio', 'avatar_url', 'email'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(id);
        await database.run(
            `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        );

        return await this.findById(id);
    }

    // Update password
    static async updatePassword(id, newPassword) {
        const password_hash = await bcrypt.hash(newPassword, 10);
        await database.run(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [password_hash, id]
        );
    }

    // Record failed login attempt
    static async recordFailedLogin(userId) {
        await database.run(
            `UPDATE users 
       SET failed_login_attempts = failed_login_attempts + 1,
           last_failed_login = CURRENT_TIMESTAMP
       WHERE id = ?`,
            [userId]
        );

        const user = await database.get('SELECT failed_login_attempts FROM users WHERE id = ?', [userId]);

        // Lock account after 5 failed attempts
        if (user.failed_login_attempts >= 5) {
            const lockoutDuration = 15 * 60 * 1000; // 15 minutes
            const lockedUntil = new Date(Date.now() + lockoutDuration);

            await database.run(
                'UPDATE users SET locked_until = ? WHERE id = ?',
                [lockedUntil.toISOString(), userId]
            );

            logger.warn(`User ${userId} locked due to failed login attempts`);
        }
    }

    // Reset failed login attempts
    static async resetFailedLogins(userId) {
        await database.run(
            'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
            [userId]
        );
    }

    // Check if account is locked
    static async isLocked(userId) {
        const user = await database.get(
            'SELECT locked_until FROM users WHERE id = ?',
            [userId]
        );

        if (!user || !user.locked_until) return false;

        const lockedUntil = new Date(user.locked_until);
        if (lockedUntil > new Date()) {
            return true;
        }

        // Unlock if time has passed
        await this.resetFailedLogins(userId);
        return false;
    }

    // List all users (admin)
    static async findAll(filters = {}) {
        let query = 'SELECT id, username, email, full_name, is_active, is_suspended, created_at FROM users WHERE 1=1';
        const params = [];

        if (filters.is_active !== undefined) {
            query += ' AND is_active = ?';
            params.push(filters.is_active);
        }

        if (filters.is_suspended !== undefined) {
            query += ' AND is_suspended = ?';
            params.push(filters.is_suspended);
        }

        query += ' ORDER BY created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(filters.limit);
        }

        return await database.all(query, params);
    }

    // Suspend user
    static async suspend(id) {
        await database.run(
            'UPDATE users SET is_suspended = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );
    }

    // Activate user
    static async activate(id) {
        await database.run(
            'UPDATE users SET is_suspended = 0, is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );
    }

    // Delete user
    static async delete(id) {
        await database.run('DELETE FROM users WHERE id = ?', [id]);
    }

    // Assign role to user
    static async assignRole(userId, roleId, assignedBy) {
        await database.run(
            'INSERT OR IGNORE INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)',
            [userId, roleId, assignedBy]
        );
    }

    // Remove role from user
    static async removeRole(userId, roleId) {
        await database.run(
            'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?',
            [userId, roleId]
        );
    }
}

module.exports = User;
