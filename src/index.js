const http = require('http');
const app = require('./app');
const { connect } = require('./db');
const { port } = require('./config');
const log = require('./utils/logger');

async function start() {
    try {
        await connect();
        // Ensure Apollo middleware is mounted before starting the HTTP server
        const server = http.createServer(app);
        server.listen(port, () => {
            log.info(`🚀 Server listening on http://localhost:${port}/graphql`);
        });
    } catch (err) {
        log.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}

start();
