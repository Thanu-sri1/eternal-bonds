const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Configuration endpoint to supply backend URLs dynamically to the browser client
app.get('/config', (req, res) => {
  res.json({
    userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:5001',
    matchServiceUrl: process.env.MATCH_SERVICE_URL || 'http://localhost:5002',
    connectionServiceUrl: process.env.CONNECTION_SERVICE_URL || 'http://localhost:5003'
  });
});

// Fallback to auth.html if user is not authenticated, let client-side JS handle routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend Service running on port ${PORT}`);
});
