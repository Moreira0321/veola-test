const User = require('../models/user.model');

// Get all users
const getUsers = async (req, res) => {
    const users = await User.find();
    res.json(users);
};

// Get user by ID
const getUserById = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
};

// Update user (JWT-protected)
const updateUser = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
        const user = await User.findByIdAndUpdate(id, updates, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const safeUser = user.toObject();
        delete safeUser.passwordHash; // remove sensitive info
        res.json(safeUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};


// Delete user (JWT-protected)
const deleteUser = async (req, res) => {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
};

module.exports = { getUsers, getUserById, updateUser, deleteUser };
