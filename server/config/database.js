const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class Database {
    constructor() {
        this.db = null;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/rodb.db');
            const dbDir = path.dirname(dbPath);

            // Ensure data directory exists
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // Create database connection
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    logger.error('Database connection error:', err);
                    reject(err);
                } else {
                    logger.info(`Database connected: ${dbPath}`);

                    // Enable WAL mode for better concurrency
                    this.db.run('PRAGMA journal_mode = WAL;', (err) => {
                        if (err) {
                            logger.error('Failed to enable WAL mode:', err);
                        } else {
                            logger.info('WAL mode enabled');
                        }
                    });

                    // Enable foreign keys
                    this.db.run('PRAGMA foreign_keys = ON;', (err) => {
                        if (err) {
                            logger.error('Failed to enable foreign keys:', err);
                        } else {
                            logger.info('Foreign keys enabled');
                        }
                    });

                    resolve();
                }
            });
        });
    }

    // Helper method to run queries
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    logger.error('Database run error:', { sql, params, error: err.message });
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Helper method to get single row
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    logger.error('Database get error:', { sql, params, error: err.message });
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Helper method to get all rows
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    logger.error('Database all error:', { sql, params, error: err.message });
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Helper method for transactions
    async transaction(callback) {
        try {
            await this.run('BEGIN TRANSACTION');
            const result = await callback();
            await this.run('COMMIT');
            return result;
        } catch (error) {
            await this.run('ROLLBACK');
            throw error;
        }
    }

    // Close database connection
    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        logger.error('Database close error:', err);
                        reject(err);
                    } else {
                        logger.info('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

// Export singleton instance
const database = new Database();
module.exports = database;
