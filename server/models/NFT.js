const mongoose = require('mongoose');

const nftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  tokenId: {
    type: String,
    required: true,
    unique: true
  },
  contractAddress: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  price: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      enum: ['MATIC', 'ETH'],
      default: 'MATIC'
    }
  },
  attributes: [{
    trait_type: String,
    value: String
  }],
  category: {
    type: String,
    enum: ['avatar', 'land', 'item', 'wearable', 'other'],
    required: true
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  status: {
    type: String,
    enum: ['minted', 'listed', 'sold', 'transferred'],
    default: 'minted'
  },
  history: [{
    action: {
      type: String,
      enum: ['mint', 'list', 'sale', 'transfer'],
      required: true
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    price: {
      amount: Number,
      currency: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    transactionHash: String
  }],
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Index for faster queries
nftSchema.index({ tokenId: 1, contractAddress: 1 }, { unique: true });
nftSchema.index({ owner: 1 });
nftSchema.index({ creator: 1 });
nftSchema.index({ category: 1 });
nftSchema.index({ rarity: 1 });
nftSchema.index({ status: 1 });

// Method to add to history
nftSchema.methods.addToHistory = function(action, from, to, price, transactionHash) {
  this.history.push({
    action,
    from,
    to,
    price,
    transactionHash,
    timestamp: new Date()
  });
};

// Method to update status
nftSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
};

const NFT = mongoose.model('NFT', nftSchema);

module.exports = NFT; 