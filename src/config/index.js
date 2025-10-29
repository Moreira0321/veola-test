const dotenv = require('dotenv');
dotenv.config();
module.exports = {
    port: process.env.PORT || 4000,
    mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/prd-backend',
    jwtSecret: process.env.JWT_SECRET || 'change_this_secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
};
