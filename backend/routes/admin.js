const express = require('express');
const router = express.Router();
const { db, auth, isFirebaseConnected } = require('../config/firebase');

// Mock Data for Fallback
const mockPatients = [
  { id: '1', name: 'John Doe (Mock)', email: 'john@example.com', status: 'Active', lastVisit: '2023-10-25' },
  { id: '2', name: 'Jane Smith (Mock)', email: 'jane@example.com', status: 'Active', lastVisit: '2023-10-20' },
];
const mockDoctors = [
  { id: '1', name: 'Dr. Sarah Wilson (Mock)', email: 'sarah@hospital.com', specialization: 'Cardiology', status: 'Active', patients: 12 },
];

// Helper to get users from Firestore
const getUsersFromFirestore = async (role) => {
  if (!isFirebaseConnected || !db) return role === 'patient' ? mockPatients : mockDoctors;
  
  try {
    const snapshot = await db.collection('users').where('role', '==', role).get();
    if (snapshot.empty) return [];
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Ensure fields exist
      name: doc.data().name || 'Unknown',
      email: doc.data().email || 'No Email',
      status: doc.data().status || 'Active',
      lastVisit: doc.data().lastVisit ? new Date(doc.data().lastVisit.toDate()).toISOString().split('T')[0] : 'N/A'
    }));
  } catch (error) {
    console.error(`Error fetching ${role}s:`, error);
    return role === 'patient' ? mockPatients : mockDoctors;
  }
};

// Get Dashboard Stats
router.get('/stats', async (req, res) => {
  try {
    if (!isFirebaseConnected) {
      return res.json({
        success: true,
        data: {
          totalPatients: mockPatients.length,
          totalDoctors: mockDoctors.length,
          activeAppointments: 5,
          revenue: 2500
        }
      });
    }

    // Fetch counts
    const patientsSnapshot = await db.collection('users').where('role', '==', 'patient').count().get();
    const doctorsSnapshot = await db.collection('users').where('role', '==', 'doctor').count().get();
    const appointmentsSnapshot = await db.collection('appointments').where('status', '==', 'Scheduled').count().get();

    res.json({
      success: true,
      data: {
        totalPatients: patientsSnapshot.data().count,
        totalDoctors: doctorsSnapshot.data().count,
        activeAppointments: appointmentsSnapshot.data().count,
        revenue: 0 // Calculate real revenue if needed
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get All Users from Firebase Auth
router.get('/users', async (req, res) => {
  try {
    if (!isFirebaseConnected || !auth) {
      return res.json({ 
        success: true, 
        data: [...mockPatients, ...mockDoctors],
        source: 'mock'
      });
    }

    const listUsersResult = await auth.listUsers(1000); // Get up to 1000 users
    
    const users = listUsersResult.users.map(user => ({
      uid: user.uid,
      email: user.email || 'No Email',
      displayName: user.displayName || 'Unknown User',
      photoURL: user.photoURL || null,
      emailVerified: user.emailVerified,
      disabled: user.disabled,
      createdAt: user.metadata.creationTime,
      lastSignIn: user.metadata.lastSignInTime,
      role: user.customClaims?.role || 'patient', // Get role from custom claims
      phoneNumber: user.phoneNumber || null,
      providerData: user.providerData
    }));

    res.json({ 
      success: true, 
      data: users,
      count: users.length,
      source: 'firebase-auth'
    });
  } catch (error) {
    console.error('Error fetching users from Firebase Auth:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a specific user by UID from Firestore Users collection
router.get('/user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (!isFirebaseConnected || !db) {
      return res.json({ success: false, message: 'Firebase not connected' });
    }

    const docSnap = await db.collection('Users').doc(uid).get();
    if (docSnap.exists) {
      return res.json({ success: true, data: docSnap.data() });
    }
    
    return res.json({ success: false, message: 'User not found' });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get All Patients from Firebase Auth
router.get('/patients', async (req, res) => {
  try {
    if (!isFirebaseConnected || !auth) {
      return res.json({ success: true, data: mockPatients, source: 'mock' });
    }

    // Fetch all users and filter patients
    const listUsersResult = await auth.listUsers(1000);
    
    const patients = listUsersResult.users
      .filter(user => {
        const role = user.customClaims?.role || 'patient';
        return role === 'patient';
      })
      .map(user => ({
        id: user.uid,
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Unknown',
        email: user.email || 'No Email',
        phoneNumber: user.phoneNumber || 'N/A',
        emailVerified: user.emailVerified,
        status: user.disabled ? 'Inactive' : 'Active',
        photoURL: user.photoURL || null,
        lastVisit: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toISOString().split('T')[0] : 'Never',
        createdAt: new Date(user.metadata.creationTime).toISOString().split('T')[0],
        role: 'patient'
      }));

    res.json({ 
      success: true, 
      data: patients,
      count: patients.length,
      source: 'firebase-auth'
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get All Doctors from Firebase Auth
router.get('/doctors', async (req, res) => {
  try {
    if (!isFirebaseConnected || !db) {
      return res.json({ success: true, data: mockDoctors, source: 'mock' });
    }

    const doctorMap = new Map();

    // 1. Check Users collection for role=2 (doctor)
    try {
      const usersSnap = await db.collection('Users').where('role', '==', 2).get();
      usersSnap.docs.forEach(doc => {
        const data = doc.data();
        const uid = data.uid || doc.id;
        doctorMap.set(uid, {
          id: uid,
          uid: uid,
          name: data.name || 'Unknown Doctor',
          email: data.email || 'No Email',
          specialization: data.specialization || 'General Medicine',
          status: data.status || 'Active',
          patients: data.patients || 0,
          source: 'Users'
        });
      });
    } catch (err) {
      console.warn('Could not fetch from Users collection:', err.message);
    }

    // 2. Also check doctors collection and merge
    try {
      const docSnapshot = await db.collection('doctors').get();
      docSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const uid = data.uid || doc.id;
        if (!doctorMap.has(uid)) {
          doctorMap.set(uid, {
            id: uid,
            uid: uid,
            name: data.name || 'Unknown Doctor',
            email: data.email || 'No Email',
            specialization: data.specialization || 'General Medicine',
            status: data.status || 'Active',
            patients: data.patients || 0,
            source: 'doctors'
          });
        } else {
          // Merge specialization from doctors collection if missing in Users
          const existing = doctorMap.get(uid);
          if (!existing.specialization || existing.specialization === 'General Medicine') {
            existing.specialization = data.specialization || existing.specialization;
          }
          doctorMap.set(uid, existing);
        }
      });
    } catch (err) {
      console.warn('Could not fetch from doctors collection:', err.message);
    }

    const doctors = Array.from(doctorMap.values());

    res.json({ 
      success: true, 
      data: doctors,
      count: doctors.length,
      source: 'firebase'
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update User Status (Enable/Disable in Firebase Auth)
router.put('/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // "Active" or "Inactive"
  
  if (!isFirebaseConnected || !auth) {
    return res.json({ success: true, message: `(Mock) User status updated to ${status}` });
  }

  try {
    const disabled = status === 'Inactive';
    await auth.updateUser(id, { disabled });
    
    res.json({ 
      success: true, 
      message: `User ${disabled ? 'disabled' : 'enabled'} successfully` 
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Set User Role (Custom Claims)
router.put('/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role, specialization } = req.body; // role: 'patient', 'doctor', 'admin'
  
  if (!isFirebaseConnected || !auth) {
    return res.json({ success: true, message: `(Mock) User role updated to ${role}` });
  }

  try {
    const customClaims = { role };
    if (specialization && role === 'doctor') {
      customClaims.specialization = specialization;
    }
    
    await auth.setCustomUserClaims(id, customClaims);
    
    res.json({ 
      success: true, 
      message: `User role set to ${role}`,
      claims: customClaims
    });
  } catch (error) {
    console.error('Error setting user role:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete User from Firebase Auth
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  
  if (!isFirebaseConnected || !auth) {
    return res.json({ success: true, message: `(Mock) User deleted` });
  }

  try {
    await auth.deleteUser(id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Seed Data Endpoint (for testing Firebase)
router.post('/seed', async (req, res) => {
  if (!isFirebaseConnected) {
    return res.status(400).json({ success: false, message: 'Firebase not connected' });
  }

  try {
    const batch = db.batch();

    // Add mock patients
    const pRef1 = db.collection('users').doc();
    batch.set(pRef1, { name: 'John Doe', email: 'john@example.com', role: 'patient', status: 'Active', createdAt: new Date() });

    const pRef2 = db.collection('users').doc();
    batch.set(pRef2, { name: 'Jane Smith', email: 'jane@example.com', role: 'patient', status: 'Active', createdAt: new Date() });

    // Add mock doctor
    const dRef = db.collection('users').doc();
    batch.set(dRef, { name: 'Dr. Sarah', email: 'sarah@hospital.com', role: 'doctor', specialization: 'Cardiology', status: 'Active', createdAt: new Date() });

    await batch.commit();

    res.json({ success: true, message: 'Firebase seeded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
