const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Asset = require('../models/Asset');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Get all assets
router.get('/', auth, async (req, res) => {
    try {
        const assets = await Asset.find({ owner: req.user.id })
            .sort({ createdAt: -1 });
        res.json(assets);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get asset by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const asset = await Asset.findOne({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        res.json(asset);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Upload new asset
router.post('/', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload_stream({
            resource_type: 'auto',
            folder: 'metaverse-assets'
        }, async (error, result) => {
            if (error) {
                return res.status(500).json({ message: 'Upload failed', error: error.message });
            }

            // Create asset record
            const asset = new Asset({
                name: req.body.name || req.file.originalname,
                type: req.body.type || 'file',
                url: result.secure_url,
                publicId: result.public_id,
                owner: req.user.id,
                metadata: {
                    format: result.format,
                    size: result.bytes,
                    ...req.body.metadata
                }
            });

            await asset.save();
            res.status(201).json(asset);
        }).end(req.file.buffer);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update asset
router.patch('/:id', auth, async (req, res) => {
    try {
        const asset = await Asset.findOne({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // Update allowed fields
        const allowedUpdates = ['name', 'metadata'];
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                asset[key] = req.body[key];
            }
        });

        await asset.save();
        res.json(asset);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete asset
router.delete('/:id', auth, async (req, res) => {
    try {
        const asset = await Asset.findOne({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // Delete from Cloudinary
        if (asset.publicId) {
            await cloudinary.uploader.destroy(asset.publicId);
        }

        await asset.remove();
        res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router; 