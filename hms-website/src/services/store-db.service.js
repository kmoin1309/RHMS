/**
 * This service is used to store and retrieve data from the Firestore database
 * @module store-db.service
 */
import { addDoc, collection, getDocs, orderBy, query } from "firebase/firestore";
import { fdb } from "../helper/firebaseConfig";
import moment from "moment";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";

/**
 * This function stores data in the Firestore database
 * @param {object} data - The data to be stored in the database
 * @returns {Promise<void>}
 */
export const storeData = async ({ data }) => {
    try {
        // Get the user's UID from local storage
        const userData = localStorage.getItem("user");
        if (userData == null) return;
        const uid = JSON.parse(userData).uid;

        // Create a new document in the Firestore database
        const docRef = await addDoc(
            collection(fdb, `Users/${uid}/Logs`),
            {
                ...data,
                dateTime: moment().utc().format(),
            }
        );

        // Log the document ID to the console
        console.log("Document written with ID: ", docRef.id);

        // Show a success notification
        toast.success("Data Stored Successfully");
    } catch (e) {
        // Log any errors that occur
        console.error("Error adding document: ", e);

        // Show an error notification
        toast.error("Error Something went wrong");
    }
};

/**
 * This hook retrieves data from the Firestore database
 * @returns {object} - An object with two properties: `isLoading` and `getData`
 */
export const useGetData = () => {
    const [isLoading, setIsLoading] = useState(true);

    /**
     * This function retrieves data from the Firestore database
     * @returns {Promise<array>} - An array of data from the Firestore database
     */
    const getData = async () => {
        setIsLoading(true);

        // Get the user's UID from local storage
        const userData = localStorage.getItem("user");
        if (userData == null) return [];
        const uid = JSON.parse(userData).uid;

        // Retrieve all documents from the Firestore database
        const querySnapshot = await getDocs(collection(fdb, `Users/${uid}/Logs`), orderBy("dateTime", "asc"));

        // Create an array to store the retrieved data
        let temp = [];
        querySnapshot.docs.forEach((doc) => {
            temp = [...temp, doc.data()];
        });

        // Sort the data in descending order by date and time
        temp.sort((a, b) => {
            return moment(b.dateTime) - moment(a.dateTime);
        });

        // Set the `isLoading` state to false
        setIsLoading(false);

        // Return the retrieved data
        return temp;
    };

    // Call the `getData` function when the component mounts
    useEffect(() => {
        getData();

    }, []);

    // Return an object with two properties: `isLoading` and `getData`
    return { isLoading, getData };
};

export const getPatientLogs = async (patientId) => {
    try {
        const q = query(collection(fdb, `Users/${patientId}/Logs`), orderBy("dateTime", "desc"));
        const querySnapshot = await getDocs(q);
        const logs = [];
        querySnapshot.forEach((doc) => {
            logs.push(doc.data());
        });
        return logs;
    } catch (e) {
        console.error("Error getting documents: ", e);
        toast.error("Error Something went wrong");
        return [];
    }
}
