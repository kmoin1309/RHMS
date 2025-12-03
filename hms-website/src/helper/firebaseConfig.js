import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth";

/**
 * This file contains the configuration for the Firebase project
 * smart-care-f0ae2. The configuration is used to initialize the Firebase
 * app and access various Firebase services such as Realtime Database and
 * Cloud Firestore.
 *
 * The configuration is stored in the `firebaseConfig` object. The object
 * contains the configuration for the Firebase app, including the API key,
 * authentication domain, database URL, project ID, storage bucket, and
 * messaging sender ID.
 *
 * The `initializeApp` function is used to initialize the Firebase app.
 * The `getAuth` function is used to get a reference to the Firebase
 * Authentication service. The `getDatabase` function is used to get a
 * reference to the Realtime Database service. The `getFirestore` function
 * is used to get a reference to the Cloud Firestore service.
 */
const firebaseConfig = {
    apiKey: "AIzaSyDo4Q1lmUIHYWMTmkk07KAUOo_4L0GbgFQ",
    authDomain: "smart-care-f0ae2.firebaseapp.com",
    databaseURL: "https://smart-care-f0ae2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "smart-care-f0ae2",
    storageBucket: "smart-care-f0ae2.firebasestorage.app",
    messagingSenderId: "389190238567",
    appId: "1:389190238567:web:0d7c0f593e2469a20eefc2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

export const fdb = getFirestore(app)
