const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Connection = require('./models/Connection');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/matrimony';
mongoose.connect(mongoUri)
  .then(() => console.log('Connection Service: Connected to MongoDB.'))
  .catch(err => console.error('Connection Service: MongoDB connection error:', err));

// Send Connection Request
app.post('/api/connections/request', async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'Sender ID and Receiver ID are required.' });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'You cannot send a connection request to yourself.' });
    }

    // Check if connection already exists in either direction
    const existing = await Connection.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    });

    if (existing) {
      return res.status(400).json({ 
        error: 'A connection request already exists between these users.', 
        status: existing.status 
      });
    }

    const newConnection = new Connection({
      senderId,
      receiverId,
      status: 'pending'
    });

    await newConnection.save();
    res.status(201).json({ message: 'Connection request sent successfully.', connection: newConnection });
  } catch (error) {
    console.error('Request connection error:', error);
    res.status(500).json({ error: 'Error sending connection request.' });
  }
});

// Respond to Connection Request
app.post('/api/connections/respond', async (req, res) => {
  try {
    const { connectionId, status } = req.body; // status should be 'accepted' or 'declined'

    if (!connectionId || !['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Invalid connectionId or status.' });
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection request not found.' });
    }

    connection.status = status;
    await connection.save();

    res.json({ message: `Connection request ${status} successfully.`, connection });
  } catch (error) {
    console.error('Respond connection error:', error);
    res.status(500).json({ error: 'Error responding to connection request.' });
  }
});

// Get Connections for a User
app.get('/api/connections/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid User ID.' });
    }

    const objectId = new mongoose.Types.ObjectId(userId);

    // Find all connections involving this user
    const connections = await Connection.find({
      $or: [
        { senderId: objectId },
        { receiverId: objectId }
      ]
    }).populate('senderId', '-password')
      .populate('receiverId', '-password');

    const receivedPending = [];
    const sentPending = [];
    const accepted = [];

    connections.forEach(conn => {
      if (conn.status === 'pending') {
        if (conn.receiverId._id.toString() === userId) {
          receivedPending.push({
            connectionId: conn._id,
            user: conn.senderId,
            createdAt: conn.createdAt
          });
        } else {
          sentPending.push({
            connectionId: conn._id,
            user: conn.receiverId,
            createdAt: conn.createdAt
          });
        }
      } else if (conn.status === 'accepted') {
        // Find the OTHER user
        const otherUser = conn.senderId._id.toString() === userId ? conn.receiverId : conn.senderId;
        accepted.push({
          connectionId: conn._id,
          user: otherUser,
          createdAt: conn.createdAt
        });
      }
    });

    res.json({
      receivedPending,
      sentPending,
      accepted
    });
  } catch (error) {
    console.error('Get user connections error:', error);
    res.status(500).json({ error: 'Error retrieving connections.' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'connection-service' });
});

app.listen(PORT, () => {
  console.log(`Connection Service running on port ${PORT}`);
});
