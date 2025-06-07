const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Create new user
router.post('/register', async (req, res) => {
    try {
        const { address, username } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ address }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                message: 'User with this address or username already exists' 
            });
        }

        const user = new User({
            address,
            username
        });

        await user.save();
        res.status(201).json(user);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ 
            message: error.message || 'Registration failed' 
        });
    }
});

// Get user by address
router.get('/:address', async (req, res) => {
    try {
        const user = await User.findOne({ address: req.params.address });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update token balance
router.patch('/:address/balance', async (req, res) => {
    try {
        const { balance } = req.body;
        const user = await User.findOneAndUpdate(
            { address: req.params.address },
            { tokenBalance: balance },
            { new: true }
        );
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;