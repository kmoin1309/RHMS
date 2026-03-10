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

// This function retrieves a user from the backend API (which uses Admin SDK)
// Falls back to direct Firestore read if backend is unavailable
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
