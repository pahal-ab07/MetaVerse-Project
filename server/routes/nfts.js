const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const NFT = require('../models/NFT');
const { auth, adminAuth } = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all NFTs
router.get('/', async (req, res) => {
  try {
    const { category, rarity, status, creator, owner } = req.query;
    const query = {};

    if (category) query.category = category;
    if (rarity) query.rarity = rarity;
    if (status) query.status = status;
    if (creator) query.creator = creator;
    if (owner) query.owner = owner;

    const nfts = await NFT.find(query)
      .populate('creator', 'username avatar')
      .populate('owner', 'username avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      nfts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching NFTs',
      error: error.message
    });
  }
});

// Get NFT by ID
router.get('/:id', async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id)
      .populate('creator', 'username avatar')
      .populate('owner', 'username avatar');

    if (!nft) {
      return res.status(404).json({
        success: false,
        message: 'NFT not found'
      });
    }

    res.json({
      success: true,
      nft
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching NFT',
      error: error.message
    });
  }
});

// Create new NFT
router.post('/', auth, upload.single('image'), [
  body('name').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('category').isIn(['avatar', 'land', 'item', 'wearable', 'other']),
  body('price.amount').isNumeric(),
  body('price.currency').isIn(['MATIC', 'ETH'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload_stream({
      folder: 'nfts',
      resource_type: 'auto'
    }, async (error, result) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Error uploading image',
          error: error.message
        });
      }

      const nft = new NFT({
        ...req.body,
        creator: req.user._id,
        owner: req.user._id,
        image: result.secure_url
      });

      await nft.save();

      res.status(201).json({
        success: true,
        nft
      });
    }).end(req.file.buffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating NFT',
      error: error.message
    });
  }
});

// Update NFT
router.patch('/:id', auth, [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim().notEmpty(),
  body('price.amount').optional().isNumeric(),
  body('price.currency').optional().isIn(['MATIC', 'ETH']),
  body('status').optional().isIn(['minted', 'listed', 'sold', 'transferred'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const nft = await NFT.findById(req.params.id);
    if (!nft) {
      return res.status(404).json({
        success: false,
        message: 'NFT not found'
      });
    }

    // Check ownership
    if (nft.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this NFT'
      });
    }

    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'description', 'price', 'status'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid updates'
      });
    }

    updates.forEach(update => nft[update] = req.body[update]);
    await nft.save();

    res.json({
      success: true,
      nft
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating NFT',
      error: error.message
    });
  }
});

// Delete NFT
router.delete('/:id', auth, async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id);
    if (!nft) {
      return res.status(404).json({
        success: false,
        message: 'NFT not found'
      });
    }

    // Check ownership
    if (nft.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this NFT'
      });
    }

    await nft.remove();

    res.json({
      success: true,
      message: 'NFT deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting NFT',
      error: error.message
    });
  }
});

// Get user's NFTs
router.get('/user/:userId', async (req, res) => {
  try {
    const nfts = await NFT.find({ owner: req.params.userId })
      .populate('creator', 'username avatar')
      .populate('owner', 'username avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      nfts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user NFTs',
      error: error.message
    });
  }
});

// Get NFT history
router.get('/:id/history', async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id);
    if (!nft) {
      return res.status(404).json({
        success: false,
        message: 'NFT not found'
      });
    }

    res.json({
      success: true,
      history: nft.history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching NFT history',
      error: error.message
    });
  }
});

module.exports = router; 