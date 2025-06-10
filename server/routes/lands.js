const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Land = require('../models/Land');
const { auth, adminAuth } = require('../middleware/auth');

// Get all lands
router.get('/', async (req, res) => {
  try {
    const { type, status, owner } = req.query;
    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (owner) query.owner = owner;

    const lands = await Land.find(query)
      .populate('owner', 'username avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      lands
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching lands',
      error: error.message
    });
  }
});

// Get land by ID
router.get('/:id', async (req, res) => {
  try {
    const land = await Land.findById(req.params.id)
      .populate('owner', 'username avatar')
      .populate('neighbors.land', 'name coordinates');

    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land not found'
      });
    }

    res.json({
      success: true,
      land
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching land',
      error: error.message
    });
  }
});

// Create new land
router.post('/', auth, [
  body('name').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('coordinates.x').isNumeric(),
  body('coordinates.y').isNumeric(),
  body('coordinates.z').isNumeric(),
  body('size.width').isNumeric(),
  body('size.length').isNumeric(),
  body('type').isIn(['residential', 'commercial', 'recreational', 'industrial']),
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

    // Check if coordinates are already taken
    const existingLand = await Land.findOne({
      'coordinates.x': req.body.coordinates.x,
      'coordinates.y': req.body.coordinates.y,
      'coordinates.z': req.body.coordinates.z
    });

    if (existingLand) {
      return res.status(400).json({
        success: false,
        message: 'Land already exists at these coordinates'
      });
    }

    const land = new Land({
      ...req.body,
      owner: req.user._id
    });

    await land.save();

    res.status(201).json({
      success: true,
      land
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating land',
      error: error.message
    });
  }
});

// Update land
router.patch('/:id', auth, [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim().notEmpty(),
  body('price.amount').optional().isNumeric(),
  body('price.currency').optional().isIn(['MATIC', 'ETH']),
  body('status').optional().isIn(['available', 'owned', 'listed', 'rented'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const land = await Land.findById(req.params.id);
    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land not found'
      });
    }

    // Check ownership
    if (land.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this land'
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

    updates.forEach(update => land[update] = req.body[update]);
    await land.save();

    res.json({
      success: true,
      land
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating land',
      error: error.message
    });
  }
});

// Add building to land
router.post('/:id/buildings', auth, [
  body('name').trim().notEmpty(),
  body('type').trim().notEmpty(),
  body('coordinates.x').isNumeric(),
  body('coordinates.y').isNumeric(),
  body('coordinates.z').isNumeric(),
  body('model').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const land = await Land.findById(req.params.id);
    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land not found'
      });
    }

    // Check ownership
    if (land.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add buildings to this land'
      });
    }

    land.addBuilding(req.body);
    await land.save();

    res.json({
      success: true,
      land
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding building',
      error: error.message
    });
  }
});

// Add decoration to land
router.post('/:id/decorations', auth, [
  body('name').trim().notEmpty(),
  body('type').trim().notEmpty(),
  body('coordinates.x').isNumeric(),
  body('coordinates.y').isNumeric(),
  body('coordinates.z').isNumeric(),
  body('model').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const land = await Land.findById(req.params.id);
    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land not found'
      });
    }

    // Check ownership
    if (land.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add decorations to this land'
      });
    }

    land.addDecoration(req.body);
    await land.save();

    res.json({
      success: true,
      land
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding decoration',
      error: error.message
    });
  }
});

// Get land history
router.get('/:id/history', async (req, res) => {
  try {
    const land = await Land.findById(req.params.id);
    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land not found'
      });
    }

    res.json({
      success: true,
      history: land.history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching land history',
      error: error.message
    });
  }
});

// Get user's lands
router.get('/user/:userId', async (req, res) => {
  try {
    const lands = await Land.find({ owner: req.params.userId })
      .populate('owner', 'username avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      lands
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user lands',
      error: error.message
    });
  }
});

module.exports = router; 