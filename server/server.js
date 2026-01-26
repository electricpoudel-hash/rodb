require('dotenv').config();
const app = require('./app');
const database = require('./config/database');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/navigation', require('./routes/navigation'));
app.use('/api/ads', require('./routes/ads'));
app.use('/api', require('./routes/health'));

let server;

async function startServer() {
    try {
        // Initialize database
        await database.initialize();
        logger.info('Database initialized');

        // Start server
        server = app.listen(PORT, HOST, () => {
            logger.info(`Server running at http://${HOST}:${PORT}`);
            logger.info(`Admin panel: http://${HOST}:${PORT}/admin (Press Ctrl+Alt+A)`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });

        // Graceful shutdown
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

async function gracefulShutdown() {
    logger.info('Received shutdown signal, closing server gracefully...');

    if (server) {
        server.close(async () => {
            logger.info('HTTP server closed');

            try {
                await database.close();
                logger.info('Database connection closed');
                process.exit(0);
            } catch (error) {
                logger.error('Error closing database:', error);
                process.exit(1);
            }
        });
    }
}

// Start the server
startServer();
