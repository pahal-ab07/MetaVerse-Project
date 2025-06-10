const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['NFT_PURCHASE', 'LAND_PURCHASE', 'TOKEN_TRANSFER', 'MARKETPLACE_FEE'],
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'PENDING'
    },
    asset: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'assetType'
    },
    assetType: {
        type: String,
        enum: ['NFT', 'Land']
    },
    blockchainTxHash: {
        type: String,
        sparse: true
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes for faster queries
transactionSchema.index({ from: 1, createdAt: -1 });
transactionSchema.index({ to: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ blockchainTxHash: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Transaction', transactionSchema);