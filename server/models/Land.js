const mongoose = require('mongoose');

const landSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  coordinates: {
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    },
    z: {
      type: Number,
      required: true
    }
  },
  size: {
    width: {
      type: Number,
      required: true
    },
    length: {
      type: Number,
      required: true
    }
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
  status: {
    type: String,
    enum: ['available', 'owned', 'listed', 'rented'],
    default: 'available'
  },
  type: {
    type: String,
    enum: ['residential', 'commercial', 'recreational', 'industrial'],
    required: true
  },
  features: [{
    name: String,
    description: String,
    value: mongoose.Schema.Types.Mixed
  }],
  buildings: [{
    name: String,
    type: String,
    coordinates: {
      x: Number,
      y: Number,
      z: Number
    },
    model: String,
    properties: Object
  }],
  decorations: [{
    name: String,
    type: String,
    coordinates: {
      x: Number,
      y: Number,
      z: Number
    },
    model: String,
    properties: Object
  }],
  history: [{
    action: {
      type: String,
      enum: ['purchase', 'sale', 'rent', 'build', 'decorate'],
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
    transactionHash: String,
    details: Object
  }],
  neighbors: [{
    land: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Land'
    },
    direction: {
      type: String,
      enum: ['north', 'south', 'east', 'west']
    }
  }],
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for faster queries
landSchema.index({ tokenId: 1, contractAddress: 1 }, { unique: true });
landSchema.index({ owner: 1 });
landSchema.index({ status: 1 });
landSchema.index({ type: 1 });
landSchema.index({ 'coordinates.x': 1, 'coordinates.y': 1, 'coordinates.z': 1 });

// Method to add to history
landSchema.methods.addToHistory = function(action, from, to, price, transactionHash, details = {}) {
  this.history.push({
    action,
    from,
    to,
    price,
    transactionHash,
    details,
    timestamp: new Date()
  });
};

// Method to update status
landSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
};

// Method to add building
landSchema.methods.addBuilding = function(building) {
  this.buildings.push(building);
};

// Method to add decoration
landSchema.methods.addDecoration = function(decoration) {
  this.decorations.push(decoration);
};

const Land = mongoose.model('Land', landSchema);

module.exports = Land; 