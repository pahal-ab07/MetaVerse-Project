const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['wearable', 'consumable', 'collectible', 'tool', 'building', 'decoration'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  model: {
    url: {
      type: String,
      required: true
    },
    format: {
      type: String,
      enum: ['glb', 'gltf', 'fbx', 'obj'],
      required: true
    },
    scale: {
      type: Number,
      default: 1
    }
  },
  thumbnail: {
    type: String,
    required: true
  },
  attributes: [{
    name: String,
    value: mongoose.Schema.Types.Mixed,
    description: String
  }],
  stats: {
    durability: {
      type: Number,
      default: 100
    },
    power: {
      type: Number,
      default: 0
    },
    defense: {
      type: Number,
      default: 0
    }
  },
  effects: [{
    type: {
      type: String,
      enum: ['buff', 'debuff', 'heal', 'damage', 'status'],
      required: true
    },
    value: Number,
    duration: Number,
    description: String
  }],
  requirements: {
    level: {
      type: Number,
      default: 1
    },
    class: [String],
    attributes: [{
      name: String,
      value: Number
    }]
  },
  creator: {
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
      enum: ['MATIC', 'ETH', 'IN_GAME_CURRENCY'],
      default: 'IN_GAME_CURRENCY'
    }
  },
  isNFT: {
    type: Boolean,
    default: false
  },
  tokenId: {
    type: String,
    sparse: true
  },
  contractAddress: {
    type: String,
    sparse: true
  },
  status: {
    type: String,
    enum: ['available', 'limited', 'sold_out'],
    default: 'available'
  },
  stock: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for faster queries
assetSchema.index({ type: 1, category: 1 });
assetSchema.index({ rarity: 1 });
assetSchema.index({ creator: 1 });
assetSchema.index({ 'requirements.level': 1 });
assetSchema.index({ isNFT: 1, tokenId: 1, contractAddress: 1 }, { sparse: true });

// Method to check if asset is available
assetSchema.methods.isAvailable = function() {
  if (this.stock === -1) return true;
  return this.stock > 0;
};

// Method to update stock
assetSchema.methods.updateStock = function(quantity) {
  if (this.stock === -1) return;
  this.stock = Math.max(0, this.stock - quantity);
  if (this.stock === 0) {
    this.status = 'sold_out';
  }
};

// Method to get asset details
assetSchema.methods.getDetails = function() {
  const asset = this.toObject();
  delete asset.metadata;
  return asset;
};

const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset; 