const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/matrimony';
mongoose.connect(mongoUri)
  .then(() => console.log('Match Service: Connected to MongoDB.'))
  .catch(err => console.error('Match Service: MongoDB connection error:', err));

// Recommendations Endpoint
app.get('/api/matches/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find the current user to match preferences
    const currentUser = await User.findById(userId);
    let query = {};
    
    if (currentUser) {
      // Recommend opposite gender
      const targetGender = currentUser.gender === 'Male' ? 'Female' : 'Male';
      query = { 
        gender: targetGender,
        _id: { $ne: currentUser._id } // exclude self
      };
    } else {
      // Fallback if userId is invalid/mock
      query = {};
    }

    // Limit to 6 recommendations for premium UI dashboard
    const matches = await User.find(query).limit(6).select('-password');
    res.json(matches);
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Error fetching recommendations.' });
  }
});

// Search Endpoint
app.get('/api/matches/search', async (req, res) => {
  try {
    const { gender, religion, location, profession, ageMin, ageMax, currentUserId } = req.query;
    
    const query = {};
    
    if (gender) {
      query.gender = gender;
    }
    
    if (religion && religion !== 'All') {
      query.religion = religion;
    }
    
    if (location && location.trim() !== '') {
      query.location = { $regex: location.trim(), $options: 'i' };
    }

    if (profession && profession.trim() !== '') {
      query.profession = { $regex: profession.trim(), $options: 'i' };
    }

    if (ageMin || ageMax) {
      query.age = {};
      if (ageMin) query.age.$gte = parseInt(ageMin);
      if (ageMax) query.age.$lte = parseInt(ageMax);
    }

    // Exclude current user if provided
    if (currentUserId) {
      query._id = { $ne: currentUserId };
    }

    const results = await User.find(query).select('-password');
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Error processing search query.' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'match-service' });
});

app.listen(PORT, () => {
  console.log(`Match Service running on port ${PORT}`);
});
