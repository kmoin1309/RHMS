/**
 * This service is used to handle user authentication
 * @module auth.service
 */
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../helper/firebaseConfig";
import { toast } from "react-toastify";
import { createUserService, getUserService, silentCreateUser } from "./user.service";

/**
 * This function logs in a user to the application
 * @param {string} email - The user's email
 * @param {string} password - The user's password
 * @param {number} role - The user's role (1 = patient, 2 = doctor, 3 = admin)
 * @returns {Promise<number>} - The user's role
 */
export const login = async (email, password, role) => {
    const routeTarget = await signInWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;
            let userData = await getUserService({ uid: user.uid, role: role });
            
            // If Firestore lookup failed entirely, fall back to Firebase Auth credential.
            // The user IS authenticated (signIn succeeded), so we build their profile
            // from the auth credential + selected role.
            if (userData == null) {
                console.warn("Firestore user doc not found, using Firebase Auth credential as fallback");
                userData = {
                    uid: user.uid,
                    name: user.displayName || user.email.split("@")[0],
                    email: user.email,
                    role: role,
                };

                // Try to create the missing Firestore doc silently (no error toasts)
                try {
                    await silentCreateUser({ data: userData });
                    console.log("Created missing Firestore doc for user:", user.uid);
                } catch (err) {
                    console.warn("Could not create Firestore doc (non-critical):", err);
                }
            }

            localStorage.setItem("user", JSON.stringify({
                name: userData.name,
                uid: userData.uid,
                email: userData.email,
                role: userData.role
            }));

            return userData.role;

        })
        .catch((error) => {
            const errorMessage = error.message;
            toast.error(errorMessage);
            return 0;
        });

    return routeTarget;

};

/**
 * This function signs up a user to the application
 * @param {{data: {name: string, email: string, password: string, role: number}}} data - The user data
 * @returns {Promise<void>}
 */
export const SignUp = async ({ data }) => {
    await createUserWithEmailAndPassword(auth, data.email, data.password)
        .then(async (userCredential) => {
            const user = userCredential.user;
            // Prepare user data for Firestore (exclude password - it's only in Firebase Auth)
            const firestoreData = {
                name: data.name,
                email: data.email,
                role: data.role,
                uid: user.uid,
                createdAt: data.createdAt || new Date(),
            };
            await createUserService({ data: firestoreData });
            switch (data.role) {
                case 1:
                    window.location.href = "/patient/dashboard";

                    break;
                case 2:
                    window.location.href = "/doctor/dashboard";

                    break;
                case 3:
                    window.location.href = "/admin/dashboard";
                    break;
            }
        })
        .catch((error) => {
            const errorMessage = error.message;
            toast.error(errorMessage);
        });

};

/**
 * This function logs out the user from the application
 * @returns {Promise<void>}
 */
export const logout = async () => {
    signOut(auth).then(() => {
        window.location.href = "/login";
        localStorage.removeItem("user");
    }).catch((error) => {
        const errorMessage = error.message;
        toast.error(errorMessage);
    });
}


