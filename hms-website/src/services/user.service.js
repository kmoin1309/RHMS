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

// This function retrieves a user from Firestore database
export const getUserService = async ({ uid, role }) => {
    // Create a reference to the document in Firestore
    const docRef = doc(fdb, `Users/${uid}`);
    // Get the document snapshot
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        // Log the document data to the console
        console.log("Document data:", docSnap.data());
        
        // Check if the role matches, return null if it doesn't
        if (docSnap.data().role !== role) return null;
        // Return the document data
        return docSnap.data();
    }
    // Log a message if no document is found
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
