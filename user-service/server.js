const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/matrimony';
mongoose.connect(mongoUri)
  .then(() => {
    console.log('User Service: Connected to MongoDB.');
    seedProfiles();
  })
  .catch(err => console.error('User Service: MongoDB connection error:', err));

// Auto-seeding function
async function seedProfiles() {
  try {
    const count = await User.countDocuments();
    if (count > 0) {
      console.log('User Service: Database already has profiles. Skipping seeding.');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);

    const mockProfiles = [
      {
        email: 'amit@example.com',
        password: defaultPassword,
        name: 'Amit Sharma',
        gender: 'Male',
        age: 28,
        dob: new Date('1998-03-12'),
        religion: 'Hindu',
        motherTongue: 'Hindi',
        location: 'Delhi',
        profession: 'Software Engineer',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=350&h=350&fit=crop',
        bio: 'Tech enthusiast who loves coffee, hiking, and late-night coding. Seeking an open-minded and independent partner.',
        height: "5'10\"",
        education: 'B.Tech in Computer Science'
      },
      {
        email: 'priya@example.com',
        password: defaultPassword,
        name: 'Priya Patel',
        gender: 'Female',
        age: 26,
        dob: new Date('2000-07-22'),
        religion: 'Hindu',
        motherTongue: 'Gujarati',
        location: 'Ahmedabad',
        profession: 'Doctor',
        photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=350&h=350&fit=crop',
        bio: 'Practicing pediatrician. Passionate about reading, classical dance, and traveling. Looking for a family-oriented partner.',
        height: "5'4\"",
        education: 'MBBS, MD'
      },
      {
        email: 'rahul@example.com',
        password: defaultPassword,
        name: 'Rahul Nair',
        gender: 'Male',
        age: 30,
        dob: new Date('1996-11-05'),
        religion: 'Hindu',
        motherTongue: 'Malayalam',
        location: 'Bangalore',
        profession: 'Product Manager',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=350&h=350&fit=crop',
        bio: 'Product manager by day, foodie by night. I love cooking and playing guitar. Looking for a partner who is passionate about life.',
        height: "5'11\"",
        education: 'MBA - IIM'
      },
      {
        email: 'anjali@example.com',
        password: defaultPassword,
        name: 'Anjali Rao',
        gender: 'Female',
        age: 27,
        dob: new Date('1999-04-18'),
        religion: 'Hindu',
        motherTongue: 'Telugu',
        location: 'Hyderabad',
        profession: 'UX Designer',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=350&h=350&fit=crop',
        bio: 'Creative visual designer who loves sketching and exploring museums. Hoping to find someone who values art and conversation.',
        height: "5'6\"",
        education: 'Bachelor of Design'
      },
      {
        email: 'gurpreet@example.com',
        password: defaultPassword,
        name: 'Gurpreet Singh',
        gender: 'Male',
        age: 29,
        dob: new Date('1997-09-30'),
        religion: 'Sikh',
        motherTongue: 'Punjabi',
        location: 'Amritsar',
        profession: 'Businessman',
        photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=350&h=350&fit=crop',
        bio: 'Running a family retail and export business. Outgoing personality, love road trips and fitness. Looking for a warm, caring companion.',
        height: "6'0\"",
        education: 'BBA'
      },
      {
        email: 'simran@example.com',
        password: defaultPassword,
        name: 'Simran Kaur',
        gender: 'Female',
        age: 25,
        dob: new Date('2001-01-14'),
        religion: 'Sikh',
        motherTongue: 'Punjabi',
        location: 'Chandigarh',
        profession: 'Fashion Designer',
        photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=350&h=350&fit=crop',
        bio: 'Independent fashion stylist. Love music festivals and photography. Seeking someone ambitious who can share both laughs and goals.',
        height: "5'7\"",
        education: 'NIFT Graduate'
      },
      {
        email: 'michael@example.com',
        password: defaultPassword,
        name: 'Michael DSouza',
        gender: 'Male',
        age: 29,
        dob: new Date('1997-02-15'),
        religion: 'Christian',
        motherTongue: 'English',
        location: 'Goa',
        profession: 'Architect',
        photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=350&h=350&fit=crop',
        bio: 'Designing eco-homes. Loves playing bass in a local band and surfing. Looking for a partner who is positive and enjoys the sea.',
        height: "5'9\"",
        education: 'B.Arch'
      },
      {
        email: 'sarah@example.com',
        password: defaultPassword,
        name: 'Sarah Fernandes',
        gender: 'Female',
        age: 27,
        dob: new Date('1999-08-08'),
        religion: 'Christian',
        motherTongue: 'English',
        location: 'Mumbai',
        profession: 'HR Manager',
        photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=350&h=350&fit=crop',
        bio: 'Corporate recruiter. Enjoys bakery workshops, movie nights, and weekend getaways. Looking for an empathetic and loyal partner.',
        height: "5'5\"",
        education: 'MA in Human Resource'
      },
      {
        email: 'rizwan@example.com',
        password: defaultPassword,
        name: 'Md. Rizwan',
        gender: 'Male',
        age: 28,
        dob: new Date('1998-05-24'),
        religion: 'Muslim',
        motherTongue: 'Urdu',
        location: 'Lucknow',
        profession: 'Data Analyst',
        photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=350&h=350&fit=crop',
        bio: 'Introvert with a dry sense of humor. Love chess, books, and history. Seeking an intelligent and kind-hearted soul.',
        height: "5'8\"",
        education: 'M.Sc in Statistics'
      },
      {
        email: 'yasmin@example.com',
        password: defaultPassword,
        name: 'Yasmin Ara',
        gender: 'Female',
        age: 26,
        dob: new Date('2000-09-03'),
        religion: 'Muslim',
        motherTongue: 'Bengali',
        location: 'Kolkata',
        profession: 'Teacher',
        photoUrl: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=350&h=350&fit=crop',
        bio: 'High school English teacher. Enthusiastic about classic literature, local street food, and volunteering. Seeking a loving partner.',
        height: "5'3\"",
        education: 'MA in English Literature, B.Ed'
      },
      {
        email: 'rohan@example.com',
        password: defaultPassword,
        name: 'Rohan Mehta',
        gender: 'Male',
        age: 27,
        dob: new Date('1999-01-20'),
        religion: 'Jain',
        motherTongue: 'Gujarati',
        location: 'Mumbai',
        profession: 'Chartered Accountant',
        photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=350&h=350&fit=crop',
        bio: 'Practicing CA. Believe in family values, work-life balance, and simple living. Seeking a partner who is family-centric and kind.',
        height: "5'10\"",
        education: 'Chartered Accountant (CA)'
      },
      {
        email: 'pooja@example.com',
        password: defaultPassword,
        name: 'Pooja Shah',
        gender: 'Female',
        age: 28,
        dob: new Date('1998-10-09'),
        religion: 'Jain',
        motherTongue: 'Marathi',
        location: 'Pune',
        profession: 'Software Developer',
        photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=350&h=350&fit=crop',
        bio: 'Tech professional who loves yoga, gardening, and organic cooking. Hoping to meet a genuine person who values growth and values.',
        height: "5'4\"",
        education: 'M.Tech in IT'
      }
    ];

    await User.insertMany(mockProfiles);
    console.log('User Service: Seeded database successfully with 12 matrimony profiles.');
  } catch (error) {
    console.error('User Service: Seeding profiles failed:', error);
  }
}

// REST Endpoints

// Register
app.post('/api/users/register', async (req, res) => {
  try {
    const { email, password, name, gender, age, dob, religion, motherTongue, location, profession, photoUrl, bio, height, education } = req.body;
    
    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      gender,
      age: parseInt(age),
      dob: new Date(dob),
      religion,
      motherTongue,
      location,
      profession,
      photoUrl: photoUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=350&h=350&fit=crop`, // default profile
      bio: bio || '',
      height: height || "5'5\"",
      education: education || 'Graduate'
    });

    const savedUser = await newUser.save();
    
    // Prepare payload without password
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json({ message: 'Registration successful', user: userResponse });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Login
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ message: 'Login successful', token: 'mock-session-token-' + user._id, user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Profile Details
app.get('/api/users/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Error fetching profile.' });
  }
});

// Update Profile
app.put('/api/users/profile/:id', async (req, res) => {
  try {
    const { name, bio, location, religion, motherTongue, profession, height, education, photoUrl } = req.body;
    
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          bio,
          location,
          religion,
          motherTongue,
          profession,
          height,
          education,
          ...(photoUrl && { photoUrl })
        }
      },
      { new: true }
    ).select('-password');

    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ message: 'Profile updated successfully', user: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Error updating profile.' });
  }
});

// Get All Users (Utility)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users.' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'user-service' });
});

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});
