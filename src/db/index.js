const mongoose = require('mongoose');
const { mongoUri } = require('../config');
const log = require('../utils/logger');

async function connect() {
    await mongoose.connect(mongoUri);
    log.success('✅ MongoDB connected');
}

module.exports = { connect };
