const admin = require('firebase-admin');
require('dotenv').config();

let db;
let auth;
let isFirebaseConnected = false;

try {
  // Check if service account is provided via environment variables
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized with environment variable');
    isFirebaseConnected = true;
  } 
  // Check if service account file exists
  else {
    try {
      const serviceAccount = require('../serviceAccountKey.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin initialized with serviceAccountKey.json');
      isFirebaseConnected = true;
    } catch (fileErr) {
      console.warn('Firebase serviceAccountKey.json not found and FIREBASE_SERVICE_ACCOUNT not set.');
      console.warn('Admin features will run in mock mode.');
    }
  }

  if (isFirebaseConnected) {
    db = admin.firestore();
    auth = admin.auth();
  }

} catch (error) {
  console.error('Firebase initialization error:', error);
}

module.exports = { admin, db, auth, isFirebaseConnected };
