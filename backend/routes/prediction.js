const express = require('express');
const router = express.Router();
const axios = require('axios');

// Proxy endpoint to Flask prediction service
router.post('/predict', async (req, res) => {
  try {
    console.log('Received prediction request:', req.body);
    
    // Forward request to Flask app running on port 5000
    const response = await axios.post('http://localhost:5000/predict', req.body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Flask response:', response.data);
    res.json(response.data);

  } catch (error) {
    console.error('Prediction error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        success: false, 
        message: 'Prediction service is not running. Please start the Flask app on port 5000.' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: error.message || 'Prediction failed' 
    });
  }
});

module.exports = router;
