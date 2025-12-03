const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const appointmentRoutes = require('./routes/appointments');
const chatRoutes = require('./routes/chat');
const doctorRoutes = require('./routes/doctors');
const adminRoutes = require('./routes/admin');
const datasetRoutes = require('./routes/dataset');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
// const { authenticate } = require('./middleware/auth'); // Keep if needed

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:3000'
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dataset', datasetRoutes);

// 🤖 ML-POWERED Prediction Endpoint
app.post('/predict', async (req, res) => {
  try {
    console.log('📊 Prediction request received');
    
    try {
      const flaskRes = await axios.post('http://localhost:5001/predict', req.body, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('🤖 ML Model used');
      const { prediction, bmi, } = flaskRes.data;
      const { age, glucose, systolic_bp, diastolic_bp, hypertensive, family_diabetes, cardiovascular_disease, stroke, acetone } = req.body;
      
      const riskFactors = [];
      if (parseInt(age) > 45) riskFactors.push('Age > 45');
      if (parseFloat(bmi) >= 30) riskFactors.push('BMI ≥ 30');
      else if (parseFloat(bmi) >= 25) riskFactors.push('BMI ≥ 25');
      if (parseInt(systolic_bp) >= 140 || parseInt(diastolic_bp) >= 90) riskFactors.push('High blood pressure');
      if (parseInt(glucose) >= 126) riskFactors.push('High glucose');
      else if (parseInt(glucose) >= 100) riskFactors.push('Elevated glucose');
      if (parseFloat(acetone) > 0.5) riskFactors.push('Elevated acetone');
      if (hypertensive === 'Yes') riskFactors.push('Hypertension');
      if (family_diabetes === 'Yes') riskFactors.push('Family diabetes');
      if (cardiovascular_disease === 'Yes') riskFactors.push('Cardiovascular disease');
      if (stroke === 'Yes') riskFactors.push('Stroke history');

      return res.json({
        success: true,
        prediction,
        riskScore: prediction === 1 ? 75 : 25,
        riskLevel: prediction === 1 ? 'high' : 'low',
        riskFactors,
        bmi: bmi.toString(),
        source: 'ML Model',
        recommendations: prediction === 1 ? [
          'Schedule consultation immediately',
          'Monitor blood glucose regularly',
          'Maintain healthy diet and exercise',
          'Follow up with endocrinologist'
        ] : [
          'Continue healthy lifestyle',
          'Regular check-ups recommended'
        ]
      });

    } catch (flaskError) {
      console.warn('⚠️ Flask unavailable, using fallback');
      
      const { age, height, weight, systolic_bp, diastolic_bp, glucose, acetone, hypertensive, family_diabetes, cardiovascular_disease, stroke } = req.body;
      const heightM = parseFloat(height) / 100;
      const bmi = parseFloat(weight) / (heightM * heightM);

      let riskScore = 0;
      const riskFactors = [];

      if (parseInt(age) > 45) { riskScore += 20; riskFactors.push('Age > 45'); }
      if (bmi >= 30) { riskScore += 25; riskFactors.push('BMI ≥ 30'); }
      if (parseInt(systolic_bp) >= 140 || parseInt(diastolic_bp) >= 90) { riskScore += 20; riskFactors.push('High BP'); }
      if (parseInt(glucose) >= 126) { riskScore += 30; riskFactors.push('High glucose'); }
      if (parseFloat(acetone) > 0.5) { riskScore += 25; riskFactors.push('High acetone'); }
      if (hypertensive === 'Yes') { riskScore += 15; riskFactors.push('Hypertension'); }
      if (family_diabetes === 'Yes') { riskScore += 20; riskFactors.push('Family diabetes'); }
      if (cardiovascular_disease === 'Yes') { riskScore += 15; riskFactors.push('CVD'); }
      if (stroke === 'Yes') { riskScore += 15; riskFactors.push('Stroke'); }

      const prediction = riskScore >= 50 ? 1 : 0;

      return res.json({
        success: true,
        prediction,
        riskScore: Math.min(riskScore, 100),
        riskLevel: riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
        riskFactors,
        bmi: bmi.toFixed(1),
        source: 'Fallback',
        recommendations: riskScore >= 50 ? [
          'Schedule consultation',
          'Monitor glucose levels',
          'Maintain healthy lifestyle'
        ] : [
          'Continue healthy lifestyle',
          'Regular check-ups'
        ]
      });
    }

  } catch (error) {
    console.error('❌ Prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Prediction failed',
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Prediction: http://localhost:${PORT}/predict`);
  console.log(`🤖 Flask ML: http://localhost:5001/predict`);
});

module.exports = app;