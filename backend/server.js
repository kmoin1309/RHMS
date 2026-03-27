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

// ─────────────────────────────────────────────
// WCRS Constants (from PRD / literature-backed)
// ─────────────────────────────────────────────
const WCRS = {
  ALPHA: 0.35,        // BP weight (UKPDS/Framingham)
  BETA:  0.40,        // BMI/Weight weight (WHO obesity-diabetes)
  GAMMA: 0.25,        // Heredity weight (ADA familial risk)
  DELTA: 0.30,        // Activity max risk reduction (ADA/WHO)
  MAP_NORMAL: 93.3,   // mmHg (120/80 baseline)
  MET_THRESHOLD: 600  // MET-min/week threshold
};

/**
 * Compute WCRS (Weighted Composite Risk Scoring)
 * R_final(%) = [R_ML_output × (1 + ΔR_BP + ΔR_Weight + ΔR_Heredity)] × Activity_Modifier
 */
function computeWCRS(data, mlPrediction) {
  // ML Baseline: high=85%, low=15%
  const rBaseline = mlPrediction === 1 ? 85.0 : 15.0;

  // Formula 1 — BP Risk Delta (MAP)
  const sbp = parseFloat(data.systolic_bp || 120);
  const dbp = parseFloat(data.diastolic_bp || 80);
  const mapVal = (sbp + 2 * dbp) / 3.0;
  const deltaRBp = WCRS.ALPHA * (mapVal - WCRS.MAP_NORMAL) / WCRS.MAP_NORMAL;
  const deltaRBpPct = ((sbp - 120) / 120.0) * 35.0;

  // Formula 2 — Weight / BMI Risk Delta
  const heightCm = parseFloat(data.height || 170);
  const weightKg = parseFloat(data.weight || 70);
  const heightM = heightCm / 100.0;
  const bmi = heightM > 0 ? weightKg / (heightM * heightM) : 25.0;
  let deltaRWeight = WCRS.BETA * (bmi - 25.0) / 25.0;
  let deltaRWeightPct = ((bmi - 25.0) / 25.0) * 40.0;
  if (bmi < 18.5) {
    deltaRWeightPct = Math.max(deltaRWeightPct, -5.0);
    deltaRWeight = Math.max(deltaRWeight, -0.05);
  }

  // Formula 3 — Heredity Risk Delta
  let hScore = 0;
  const heredityDetail = {};
  const bothParents = data.heredity_both_parents === true || data.heredity_both_parents === 'true';
  const father = data.heredity_father === true || data.heredity_father === 'true';
  const mother = data.heredity_mother === true || data.heredity_mother === 'true';
  const sibling = data.heredity_sibling === true || data.heredity_sibling === 'true';
  const grandparent = data.heredity_grandparent === true || data.heredity_grandparent === 'true';
  const familyDiabetes = data.family_diabetes;

  if (bothParents || (father && mother)) {
    hScore = 1.0;
    heredityDetail.both_parents = 1.0;
  } else {
    if (father) { hScore += 0.5; heredityDetail.father = 0.5; }
    if (mother) { hScore += 0.5; heredityDetail.mother = 0.5; }
    if (sibling) { hScore += 0.3; heredityDetail.sibling = 0.3; }
    if (grandparent) { hScore += 0.15; heredityDetail.grandparent = 0.15; }
  }
  if (hScore === 0 && familyDiabetes === 'Yes') {
    hScore = 0.5;
    heredityDetail.family_diabetes_flag = 0.5;
  }
  hScore = Math.min(hScore, 1.0);
  const deltaRHeredity = hScore * WCRS.GAMMA;
  const deltaRHeredityPct = hScore * 25.0;

  // Formula 4 — Activity Modifier (multiplicative)
  const metValue = parseFloat(data.met_value || 4.0);
  const activityMinutes = parseFloat(data.activity_minutes || 0);
  const activityDays = parseFloat(data.activity_days || 0);
  let metWeekly = metValue * activityMinutes * activityDays;

  if (metWeekly === 0) {
    const actLevel = data.activity || '0';
    if (actLevel === 'High' || actLevel === '2') metWeekly = 1200;
    else if (actLevel === 'Moderate' || actLevel === '1') metWeekly = 600;
    else metWeekly = 200;
  }

  let activityModifier = 1.0 - (WCRS.DELTA * (metWeekly - WCRS.MET_THRESHOLD) / WCRS.MET_THRESHOLD);
  activityModifier = Math.max(0.5, Math.min(1.2, activityModifier));

  // Composite Final
  const rTotal = rBaseline * (1 + deltaRBp + deltaRWeight + deltaRHeredity) * activityModifier;
  const rFinal = Math.max(0, Math.min(100, rTotal));

  return {
    wcrs_score: Math.round(rFinal * 10) / 10,
    r_baseline: Math.round(rBaseline * 10) / 10,
    formulas: {
      bp: {
        label: 'Blood Pressure (MAP)',
        map_value: Math.round(mapVal * 10) / 10,
        map_normal: WCRS.MAP_NORMAL,
        alpha: WCRS.ALPHA,
        delta_r: Math.round(deltaRBp * 10000) / 10000,
        delta_r_pct: Math.round(deltaRBpPct * 10) / 10,
        sbp, dbp,
        formula: `ΔR_BP = α × (MAP − MAP_normal) / MAP_normal = ${WCRS.ALPHA} × (${Math.round(mapVal*10)/10} − ${WCRS.MAP_NORMAL}) / ${WCRS.MAP_NORMAL} = ${Math.round(deltaRBp*10000)/10000}`,
        impact: deltaRBp > 0 ? 'positive' : deltaRBp < 0 ? 'negative' : 'neutral'
      },
      weight: {
        label: 'Weight / BMI',
        bmi: Math.round(bmi * 10) / 10,
        bmi_normal: 25.0,
        beta: WCRS.BETA,
        delta_r: Math.round(deltaRWeight * 10000) / 10000,
        delta_r_pct: Math.round(deltaRWeightPct * 10) / 10,
        formula: `ΔR_Weight = β × (BMI − 25) / 25 = ${WCRS.BETA} × (${Math.round(bmi*10)/10} − 25) / 25 = ${Math.round(deltaRWeight*10000)/10000}`,
        impact: deltaRWeight > 0 ? 'positive' : deltaRWeight < 0 ? 'negative' : 'neutral'
      },
      heredity: {
        label: 'Heredity',
        h_score: Math.round(hScore * 100) / 100,
        gamma: WCRS.GAMMA,
        delta_r: Math.round(deltaRHeredity * 10000) / 10000,
        delta_r_pct: Math.round(deltaRHeredityPct * 10) / 10,
        detail: heredityDetail,
        formula: `ΔR_Heredity = H_score × γ = ${Math.round(hScore*100)/100} × ${WCRS.GAMMA} = ${Math.round(deltaRHeredity*10000)/10000}`,
        impact: deltaRHeredity > 0 ? 'positive' : 'neutral'
      },
      activity: {
        label: 'Physical Activity',
        met_weekly: Math.round(metWeekly),
        met_threshold: WCRS.MET_THRESHOLD,
        delta_val: WCRS.DELTA,
        modifier: Math.round(activityModifier * 1000) / 1000,
        formula: `Activity_Modifier = 1 − [δ × (MET_weekly − 600) / 600] = 1 − [${WCRS.DELTA} × (${Math.round(metWeekly)} − 600) / 600] = ${Math.round(activityModifier*1000)/1000}`,
        impact: activityModifier > 1.0 ? 'positive' : activityModifier < 1.0 ? 'negative' : 'neutral'
      }
    },
    composite_formula: `R_final = R_baseline × (1 + ΔR_BP + ΔR_Weight + ΔR_Heredity) × Activity_Modifier = ${Math.round(rBaseline*10)/10} × (1 + ${Math.round(deltaRBp*10000)/10000} + ${Math.round(deltaRWeight*10000)/10000} + ${Math.round(deltaRHeredity*10000)/10000}) × ${Math.round(activityModifier*1000)/1000} = ${Math.round(rFinal*10)/10}%`,
    parameter_impacts: [
      { name: 'ML Baseline', value: Math.round(rBaseline * 10) / 10, type: 'baseline' },
      { name: 'Blood Pressure', value: Math.round(deltaRBpPct * 10) / 10, type: 'delta', direction: deltaRBpPct > 0 ? 'risk' : 'protective' },
      { name: 'BMI / Weight', value: Math.round(deltaRWeightPct * 10) / 10, type: 'delta', direction: deltaRWeightPct > 0 ? 'risk' : 'protective' },
      { name: 'Heredity', value: Math.round(deltaRHeredityPct * 10) / 10, type: 'delta', direction: deltaRHeredityPct > 0 ? 'risk' : 'neutral' },
      { name: 'Physical Activity', value: Math.round((1 - activityModifier) * 1000) / 10, type: 'modifier', direction: activityModifier < 1.0 ? 'protective' : 'risk' },
    ]
  };
}

// 🤖 ML-POWERED Prediction Endpoint with WCRS
app.post('/predict', async (req, res) => {
  try {
    console.log('📊 Prediction request received');
    
    try {
      const flaskRes = await axios.post('http://localhost:5001/predict', req.body, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('🤖 ML Model used');
      const { prediction, bmi, wcrs: flaskWcrs, probabilities } = flaskRes.data;
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

      // Use WCRS from Flask if available, otherwise compute locally
      const wcrs = flaskWcrs || computeWCRS(req.body, prediction);

      return res.json({
        success: true,
        prediction,
        riskScore: wcrs.wcrs_score,
        riskLevel: wcrs.wcrs_score >= 60 ? 'high' : wcrs.wcrs_score >= 35 ? 'medium' : 'low',
        riskFactors,
        bmi: bmi.toString(),
        source: 'ML Model + WCRS',
        probabilities,
        wcrs,
        recommendations: prediction === 1 ? [
          'Schedule consultation immediately',
          'Monitor blood glucose regularly',
          'Maintain healthy diet and exercise',
          'Follow up with endocrinologist',
          `Your WCRS composite score is ${wcrs.wcrs_score}% — activity can reduce this by up to 30%`
        ] : [
          'Continue healthy lifestyle',
          'Regular check-ups recommended',
          `Your WCRS composite score is ${wcrs.wcrs_score}% — maintain current activity levels`
        ]
      });

    } catch (flaskError) {
      console.warn('⚠️ Flask unavailable, using fallback with WCRS');
      
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

      // Compute WCRS for fallback too
      const wcrs = computeWCRS(req.body, prediction);

      return res.json({
        success: true,
        prediction,
        riskScore: wcrs.wcrs_score,
        riskLevel: wcrs.wcrs_score >= 60 ? 'high' : wcrs.wcrs_score >= 35 ? 'medium' : 'low',
        riskFactors,
        bmi: bmi.toFixed(1),
        source: 'Fallback + WCRS',
        wcrs,
        recommendations: riskScore >= 50 ? [
          'Schedule consultation',
          'Monitor glucose levels',
          'Maintain healthy lifestyle',
          `Your WCRS composite score is ${wcrs.wcrs_score}%`
        ] : [
          'Continue healthy lifestyle',
          'Regular check-ups',
          `Your WCRS composite score is ${wcrs.wcrs_score}%`
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