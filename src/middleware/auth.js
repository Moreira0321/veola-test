const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { jwtSecret } = require("../config");

async function getUserFromToken(token) {
    if (!token) return null;
    try {
        // Remove 'Bearer ' prefix if present
        const cleanToken = token.replace(/^Bearer\s+/i, '');
        const decoded = jwt.verify(cleanToken, jwtSecret);
        const user = await User.findById(decoded.id);
        return user || null;
    } catch (err) {
        return null;
    }
}

// Express middleware to protect REST routes
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userDoc = await User.findById(decoded.id);
        if (!userDoc) return res.status(401).json({ message: 'Unauthorized' });

        // Convert to plain object and remove sensitive fields
        const user = userDoc.toObject();
        delete user.passwordHash;

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Unauthorized' });
    }
};

module.exports = {
    getUserFromToken,
    requireAuth
};
