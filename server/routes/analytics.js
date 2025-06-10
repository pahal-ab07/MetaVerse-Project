const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const NFT = require('../models/NFT');
const Land = require('../models/Land');
const Transaction = require('../models/Transaction');

// Get user activity statistics
router.get('/user-activity', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        // Get NFT statistics
        const nftStats = await NFT.aggregate([
            { $match: { owner: user._id } },
            {
                $group: {
                    _id: null,
                    totalNFTs: { $sum: 1 },
                    totalValue: { $sum: '$price' }
                }
            }
        ]);

        // Get land statistics
        const landStats = await Land.aggregate([
            { $match: { owner: user._id } },
            {
                $group: {
                    _id: null,
                    totalLands: { $sum: 1 },
                    totalArea: { $sum: '$area' }
                }
            }
        ]);

        // Get transaction statistics
        const transactionStats = await Transaction.aggregate([
            {
                $match: {
                    $or: [
                        { from: user._id },
                        { to: user._id }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    totalTransactions: { $sum: 1 },
                    totalVolume: { $sum: '$amount' }
                }
            }
        ]);

        res.json({
            nftStats: nftStats[0] || { totalNFTs: 0, totalValue: 0 },
            landStats: landStats[0] || { totalLands: 0, totalArea: 0 },
            transactionStats: transactionStats[0] || { totalTransactions: 0, totalVolume: 0 }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get platform-wide statistics (admin only)
router.get('/platform-stats', auth, async (req, res) => {
    try {
        // Check if user is admin
        const user = await User.findById(req.user.id);
        if (!user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get total users
        const totalUsers = await User.countDocuments();

        // Get total NFTs and their value
        const nftStats = await NFT.aggregate([
            {
                $group: {
                    _id: null,
                    totalNFTs: { $sum: 1 },
                    totalValue: { $sum: '$price' }
                }
            }
        ]);

        // Get total lands and their area
        const landStats = await Land.aggregate([
            {
                $group: {
                    _id: null,
                    totalLands: { $sum: 1 },
                    totalArea: { $sum: '$area' }
                }
            }
        ]);

        // Get transaction statistics
        const transactionStats = await Transaction.aggregate([
            {
                $group: {
                    _id: null,
                    totalTransactions: { $sum: 1 },
                    totalVolume: { $sum: '$amount' }
                }
            }
        ]);

        // Get user growth over time
        const userGrowth = await User.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.json({
            totalUsers,
            nftStats: nftStats[0] || { totalNFTs: 0, totalValue: 0 },
            landStats: landStats[0] || { totalLands: 0, totalArea: 0 },
            transactionStats: transactionStats[0] || { totalTransactions: 0, totalVolume: 0 },
            userGrowth
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get transaction history with filters
router.get('/transactions', auth, async (req, res) => {
    try {
        const { type, startDate, endDate, limit = 50, skip = 0 } = req.query;
        
        const query = {
            $or: [
                { from: req.user.id },
                { to: req.user.id }
            ]
        };

        if (type) {
            query.type = type;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const transactions = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .populate('from', 'username')
            .populate('to', 'username');

        const total = await Transaction.countDocuments(query);

        res.json({
            transactions,
            total,
            hasMore: total > (parseInt(skip) + parseInt(limit))
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router; 