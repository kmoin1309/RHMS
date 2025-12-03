const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { db, isFirebaseConnected } = require('../config/firebase');

// Mock Data for Fallback
let mockAppointments = [
  { 
    _id: '1', 
    patientId: '1', 
    patientName: 'John Doe',
    doctorId: '1', 
    doctorName: 'Dr. Sarah Wilson',
    date: new Date().toISOString(), 
    status: 'Pending',
    notes: 'High blood sugar',
    meetLink: null
  }
];

// Get all appointments (for admin/doctor) or filtered by user
router.get('/', async (req, res) => {
  try {
    const { userId, role } = req.query;
    
    if (isFirebaseConnected && db) {
      let query = db.collection('appointments');
      if (role === 'patient') query = query.where('patientId', '==', userId);
      if (role === 'doctor') query = query.where('doctorId', '==', userId);
      
      const snapshot = await query.get();
      const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json({ success: true, data: appointments });
    }

    // Fallback to Mongoose or Mock
    try {
        let query = {};
        if (role === 'patient') query.patientId = userId;
        if (role === 'doctor') query.doctorId = userId;
        
        const appointments = await Appointment.find(query)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name specialization');
            
        if (appointments.length > 0) {
            return res.json({ success: true, data: appointments });
        }
    } catch (err) {
        console.warn('Mongoose fetch failed, using mock:', err.message);
    }

    res.json({ success: true, data: mockAppointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Book an appointment
router.post('/book', async (req, res) => {
  try {
    const { patientId, doctorId, date, notes } = req.body;
    
    const newAppointment = {
      patientId,
      doctorId,
      date: new Date(date),
      notes,
      status: 'Pending',
      createdAt: new Date()
    };

    if (isFirebaseConnected && db) {
      // Fetch names for convenience
      const pDoc = await db.collection('users').doc(patientId).get();
      const dDoc = await db.collection('users').doc(doctorId).get(); // or 'doctors' collection
      
      const appointmentData = {
        ...newAppointment,
        patientName: pDoc.exists ? pDoc.data().name : 'Unknown Patient',
        doctorName: dDoc.exists ? dDoc.data().name : 'Unknown Doctor'
      };

      const docRef = await db.collection('appointments').add(appointmentData);
      return res.json({ success: true, message: 'Appointment booked', id: docRef.id });
    }

    // Mongoose
    try {
        const appt = await Appointment.create(newAppointment);
        return res.json({ success: true, message: 'Appointment booked', data: appt });
    } catch (err) {
        console.warn('Mongoose create failed, using mock:', err.message);
    }

    // Mock
    const mockId = Date.now().toString();
    mockAppointments.push({ _id: mockId, ...newAppointment, patientName: 'Test User', doctorName: 'Dr. Test' });
    res.json({ success: true, message: 'Appointment booked (Mock)', id: mockId });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update status (Accept/Reject/Complete)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, meetLink } = req.body;

    if (isFirebaseConnected && db) {
      await db.collection('appointments').doc(id).update({ status, meetLink });
      return res.json({ success: true, message: `Appointment ${status}` });
    }

    // Mongoose
    try {
        await Appointment.findByIdAndUpdate(id, { status, meetLink });
        return res.json({ success: true, message: `Appointment ${status}` });
    } catch (err) {
        console.warn('Mongoose update failed, using mock');
    }

    // Mock
    const idx = mockAppointments.findIndex(a => a._id === id);
    if (idx !== -1) {
      mockAppointments[idx].status = status;
      if (meetLink) mockAppointments[idx].meetLink = meetLink;
      return res.json({ success: true, message: `Appointment ${status} (Mock)` });
    }
    
    res.status(404).json({ success: false, message: 'Appointment not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add Prescription
router.post('/:id/prescription', async (req, res) => {
  try {
    const { id } = req.params;
    const { medications, instructions } = req.body;
    
    const prescription = {
      medications,
      instructions,
      date: new Date()
    };

    if (isFirebaseConnected && db) {
      await db.collection('appointments').doc(id).update({ prescription, status: 'Completed' });
      return res.json({ success: true, message: 'Prescription added' });
    }

    // Mongoose
    try {
        await Appointment.findByIdAndUpdate(id, { prescription, status: 'Completed' });
        return res.json({ success: true, message: 'Prescription added' });
    } catch (err) {
        console.warn('Mongoose update failed, using mock');
    }

    // Mock
    const idx = mockAppointments.findIndex(a => a._id === id);
    if (idx !== -1) {
      mockAppointments[idx].prescription = prescription;
      mockAppointments[idx].status = 'Completed';
      return res.json({ success: true, message: 'Prescription added (Mock)' });
    }

    res.status(404).json({ success: false, message: 'Appointment not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
