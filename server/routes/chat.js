const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Message = require('../models/Message');

// Get chat history between two users
router.get('/history/:userId', auth, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user.id, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.user.id }
            ]
        })
        .sort({ createdAt: 1 })
        .populate('sender', 'username avatar')
        .populate('receiver', 'username avatar');

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all active chats for current user
router.get('/active', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const activeChats = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: user._id },
                        { receiver: user._id }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$sender', user._id] },
                            '$receiver',
                            '$sender'
                        ]
                    },
                    lastMessage: { $first: '$$ROOT' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    _id: 1,
                    lastMessage: 1,
                    'user.username': 1,
                    'user.avatar': 1
                }
            }
        ]);

        res.json(activeChats);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Mark messages as read
router.put('/read/:userId', auth, async (req, res) => {
    try {
        await Message.updateMany(
            {
                sender: req.params.userId,
                receiver: req.user.id,
                read: false
            },
            {
                $set: { read: true }
            }
        );

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router; 