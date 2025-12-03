const express = require('express');
const router = express.Router();
const { db, isFirebaseConnected } = require('../config/firebase');
const { Parser } = require('json2csv');

// In-memory storage for mock mode
let mockDataset = [
  { 
    id: '1', 
    name: 'Test Patient 1', 
    gender: 'Male',
    age: 50,
    height: 175,
    weight: 85,
    glucose: 148, 
    bmi: 33.6, 
    pulseRate: 72,
    acetone: 0.1,
    systolicBP: 130,
    diastolicBP: 85,
    spo2: 98,
    temperature: 36.6,
    activity: 5,
    pregnancies: 0, 
    hypertensive: 'Yes',
    familyHypertension: 'Yes',
    cardiovascularDisease: 'No',
    stroke: 'No',
    familyDiabetes: 'Yes',
    diabetic: 'No',
    outcome: 1, 
    createdAt: new Date().toISOString() 
  }
];

// Add new data record
router.post('/add', async (req, res) => {
  try {
    const data = req.body;
    const record = {
      ...data,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConnected && db) {
      await db.collection('diabetes_dataset').add(record);
      res.json({ success: true, message: 'Record added to Firebase' });
    } else {
      mockDataset.push({ id: Date.now().toString(), ...record });
      res.json({ success: true, message: 'Record added to mock storage' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all records
router.get('/all', async (req, res) => {
  try {
    if (isFirebaseConnected && db) {
      const snapshot = await db.collection('diabetes_dataset').orderBy('createdAt', 'desc').get();
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, data });
    } else {
      res.json({ success: true, data: mockDataset });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export to CSV
router.get('/export', async (req, res) => {
  try {
    let data = [];
    if (isFirebaseConnected && db) {
      const snapshot = await db.collection('diabetes_dataset').get();
      data = snapshot.docs.map(doc => doc.data());
    } else {
      data = mockDataset;
    }

    if (data.length === 0) {
      return res.status(404).send('No data to export');
    }

    // Fields to export
    const fields = [
      'name', 'gender', 'age', 'height', 'weight', 'bmi',
      'glucose', 'pulseRate', 'acetone', 'systolicBP', 'diastolicBP', 'spo2', 'temperature', 'activity',
      'pregnancies', 'hypertensive', 'familyHypertension', 'cardiovascularDisease', 'stroke', 'familyDiabetes', 'diabetic',
      'outcome', 'createdAt'
    ];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=diabetes_dataset.csv');
    res.send(csv);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).send('Failed to export data');
  }
});

module.exports = router;
