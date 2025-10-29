const express = require('express');
const { getUsers, getUserById, updateUser, deleteUser } = require('../controllers/user.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', requireAuth, updateUser);     // JWT-protected
router.delete('/:id', requireAuth, deleteUser);  // JWT-protected

router.get('/me', requireAuth, (req, res) => {
    const user = { ...req.user }; // convert Mongoose doc to plain object
    res.json(user);
});


module.exports = router;
