import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import { fdb } from "../helper/firebaseConfig";

// This function creates a user in Firestore database
export const createUserService = async ({ data }) => {
    try {
        // Create a reference to the document in Firestore
        const docRef = await setDoc(doc(fdb, `Users/${data.uid}`), data);
        // Log the document ID to the console
        console.log("Document written with ID: ", docRef);
        // Store user data in local storage
        localStorage.setItem("user", JSON.stringify({ 
            name: data.name,
            uid: data.uid,
            email: data.email,
            role: data.role
        }));
        // Show a success notification
        toast.success("User Created Successfully");
    } catch (e) {
        // Log any errors that occur
        console.error("Error adding document: ", e);
        // Show an error notification
        toast.error("Error Something went wrong");
    }
}

// Silent version of createUserService - no toast notifications
// Used during login fallback to avoid confusing error messages
export const silentCreateUser = async ({ data }) => {
    try {
        await setDoc(doc(fdb, `Users/${data.uid}`), data);
        console.log("Silent: User document created for uid:", data.uid);
        localStorage.setItem("user", JSON.stringify({ 
            name: data.name,
            uid: data.uid,
            email: data.email,
            role: data.role
        }));
    } catch (e) {
        console.warn("Silent: Could not create Firestore doc:", e.message);
        // No toast - this is a background operation during login fallback
    }
}

// This function retrieves a user from the backend API (which uses Admin SDK)
// Falls back to direct Firestore read if backend is unavailable
// If both fail but we have a valid auth user, re-creates the Firestore document
export const getUserService = async ({ uid, role }) => {
    // Try backend API first (bypasses Firestore security rules)
    try {
        const res = await fetch(`http://localhost:8080/api/admin/user/${uid}`);
        const result = await res.json();
        if (result.success && result.data) {
            const userData = result.data;
            console.log("User data from API:", userData);
            // Check if the role matches
            if (userData.role !== role) return null;
            return userData;
        }
    } catch (apiError) {
        console.warn("Backend API unavailable, trying direct Firestore:", apiError);
    }

    // Fallback: Direct Firestore read
    try {
        const docRef = doc(fdb, `Users/${uid}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            console.log("Document data:", docSnap.data());
            if (docSnap.data().role !== role) return null;
            return docSnap.data();
        }
    } catch (firestoreError) {
        console.warn("Direct Firestore read failed:", firestoreError.message);
    }

    // Last resort: The user exists in Firebase Auth (login succeeded) but their
    // Firestore document is missing or inaccessible. Re-create it from the
    // current Firebase Auth user so login doesn't fail with "User not found".
    try {
        const { getAuth } = await import("firebase/auth");
        const currentUser = getAuth().currentUser;
        if (currentUser && currentUser.uid === uid) {
            console.warn("Firestore doc missing for authenticated user, re-creating...");
            const userData = {
                uid: currentUser.uid,
                name: currentUser.displayName || currentUser.email.split("@")[0],
                email: currentUser.email,
                role: role,
                createdAt: new Date(),
            };
            // Re-create the Firestore document
            await setDoc(doc(fdb, `Users/${uid}`), userData);
            console.log("Re-created Firestore user document for uid:", uid);
            return userData;
        }
    } catch (recreateError) {
        console.error("Failed to re-create user document:", recreateError.message);
    }

    console.log("No such document!");
    return null;
}

// This function retrieves all patients for a doctor from Firestore database
export const getPatientsForDoctor = async (doctorId) => {
    try {
        const q = query(collection(fdb, "Users"), where("role", "==", 1), where("doctorId", "==", doctorId));
        const querySnapshot = await getDocs(q);
        const patients = [];
        querySnapshot.forEach((doc) => {
            patients.push(doc.data());
        });
        return patients;
    } catch (e) {
        console.error("Error getting documents: ", e);
        toast.error("Error Something went wrong");
        return [];
    }
}
