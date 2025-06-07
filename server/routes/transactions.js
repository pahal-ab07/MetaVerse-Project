const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// Get all transactions for a user
router.get('/:address', async (req, res) => {
    try {
        const transactions = await Transaction.find({
            $or: [
                { from: req.params.address },
                { to: req.params.address }
            ]
        }).sort({ timestamp: -1 });
        
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new transaction
router.post('/', async (req, res) => {
    try {
        const { from, to, amount, type } = req.body;
        
        const transaction = new Transaction({
            from,
            to,
            amount,
            type
        });

        await transaction.save();
        res.status(201).json(transaction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;