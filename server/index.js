require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const { auth } = require('./middleware/auth');
const Message = require('./models/Message');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const nftRoutes = require('./routes/nfts');
const landRoutes = require('./routes/lands');
const socialRoutes = require('./routes/social');
const chatRoutes = require('./routes/chat');
const assetRoutes = require('./routes/assets');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(compression());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/metaverse', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/nfts', auth, nftRoutes);
app.use('/api/lands', auth, landRoutes);
app.use('/api/social', auth, socialRoutes);
app.use('/api/chat', auth, chatRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/analytics', auth, analyticsRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  // Authenticate socket connection
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        socket.disconnect();
        return;
      }

      socket.userId = user._id;
      socket.user = user;
      
      // Join user's personal room
      socket.join(user._id.toString());
      
      // Emit online status
      io.emit('user-status', {
        userId: user._id,
        isOnline: true
      });
    } catch (error) {
      socket.disconnect();
    }
  });

  // Handle private messages
  socket.on('private-message', async (data) => {
    try {
      if (!socket.userId) {
        throw new Error('Not authenticated');
      }

      const { to, content, type = 'text', metadata = {} } = data;
      
      // Save message to database
      const message = new Message({
        sender: socket.userId,
        receiver: to,
        content,
        type,
        metadata
      });
      await message.save();

      // Emit to receiver's room
      io.to(to).emit('new-message', {
        ...message.toJSON(),
        sender: socket.user
      });
    } catch (error) {
      console.error('Error handling private message:', error);
    }
  });

  // Handle typing status
  socket.on('typing', (data) => {
    if (!socket.userId) return;
    
    const { to, isTyping } = data;
    io.to(to).emit('user-typing', {
      userId: socket.userId,
      isTyping
    });
  });

  // Handle online status
  socket.on('set-online', (isOnline) => {
    if (!socket.userId) return;
    
    io.emit('user-status', {
      userId: socket.userId,
      isOnline
    });
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      console.log('Client disconnected:', socket.userId);
      io.emit('user-status', {
        userId: socket.userId,
        isOnline: false
      });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
