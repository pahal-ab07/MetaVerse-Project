const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');

// Send friend request
router.post('/friend-request/:userId', auth, async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.userId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (targetUser.friendRequests.includes(req.user.id)) {
            return res.status(400).json({ message: 'Friend request already sent' });
        }

        targetUser.friendRequests.push(req.user.id);
        await targetUser.save();

        res.json({ message: 'Friend request sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Accept friend request
router.post('/accept-friend/:userId', auth, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const targetUser = await User.findById(req.params.userId);

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!currentUser.friendRequests.includes(req.params.userId)) {
            return res.status(400).json({ message: 'No friend request from this user' });
        }

        // Remove from friend requests
        currentUser.friendRequests = currentUser.friendRequests.filter(
            id => id.toString() !== req.params.userId
        );

        // Add to friends list for both users
        currentUser.friends.push(req.params.userId);
        targetUser.friends.push(req.user.id);

        await currentUser.save();
        await targetUser.save();

        res.json({ message: 'Friend request accepted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Follow user
router.post('/follow/:userId', auth, async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.userId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const currentUser = await User.findById(req.user.id);
        if (currentUser.following.includes(req.params.userId)) {
            return res.status(400).json({ message: 'Already following this user' });
        }

        currentUser.following.push(req.params.userId);
        targetUser.followers.push(req.user.id);

        await currentUser.save();
        await targetUser.save();

        res.json({ message: 'Successfully followed user' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user's social profile
router.get('/profile/:userId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('-password')
            .populate('friends', 'username avatar')
            .populate('followers', 'username avatar')
            .populate('following', 'username avatar');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router; 