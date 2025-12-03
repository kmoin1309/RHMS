import { ref, onValue } from "firebase/database";
import { database } from "../helper/firebaseConfig";
import { useEffect, useState } from "react";
import { useDataContext } from "../context/DataContext";

const dbRef = ref(database);
/**
 * This hook is used to get the device data from the Realtime Database
 * It uses the `onValue` function from the Firebase Realtime Database SDK to
 * listen for changes to the data in the database.
 * When the data changes, the `setRealData` function from the `useDataContext` hook
 * is called with the new data.
 * The `isLoading` state is used to indicate whether the data is being loaded or not.
 * @returns {isLoading: boolean} - A boolean indicating whether the data is being loaded or not
 */
export const useGetDeviceData = () => {
    const { setRealData } = useDataContext();
    const [isLoading, setIsLoading] = useState(true);

    /**
     * This useEffect hook is used to set up the listener for the Realtime Database
     * It is called once when the component is mounted.
     * It sets up the listener for the data in the Realtime Database and
     * calls the `setRealData` function with the new data when the data changes.
     */
    useEffect(() => {
        setIsLoading(true);
        (async () => {
            // Set up the listener for the Realtime Database
            onValue(dbRef, (snapshot) => {
                const data = snapshot.val();
                const sensorData = data.sensor;

                // Call the setRealData function with the new data
                setRealData(prev => {
                    return {
                        ...prev,
                        acetone: sensorData.acetone,
                        activity: sensorData.activity,
                        heartRate: sensorData.heartRate,
                        diastolic: sensorData.diastolic,
                        humidity: sensorData.humidity,
                        spo2: sensorData.spo2,
                        systolic: sensorData.systolic,
                        temperature: sensorData.temperature,
                        weather: sensorData.weather,
                    }
                })

            });
            // Set isLoading to false when the data is loaded
            setIsLoading(false);
        })();

    }, []);

    return { isLoading }
}
