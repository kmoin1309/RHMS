import { ref, onValue } from "firebase/database";
import { database } from "../helper/firebaseConfig";
import { useEffect, useState } from "react";
import { useDataContext } from "../context/DataContext";

const dbRef = ref(database, 'sensor');

export const useGetDeviceData = () => {
    const { setRealData } = useDataContext();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const unsubscribe = onValue(dbRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Filter for only numeric timestamp keys
                const numericKeys = Object.keys(data).filter(k => /^\d+$/.test(k));
                if (numericKeys.length > 0) {
                    // Sort descending to get the latest timestamp
                    const latestKey = numericKeys.sort((a, b) => Number(b) - Number(a))[0];
                    const sensorData = data[latestKey];
                    
                    if (sensorData && typeof sensorData === 'object') {
                        setRealData(prev => ({
                            ...prev,
                            acetone: sensorData.acetone || 0,
                            activity: sensorData.activity || 0,
                            heartRate: sensorData.heartRate || 0,
                            diastolic: sensorData.diastolic || 0,
                            humidity: sensorData.humidity || 0,
                            spo2: sensorData.spo2 || 0,
                            systolic: sensorData.systolic || 0,
                            temperature: sensorData.temperature || 0,
                            weather: sensorData.weather || 0,
                        }));
                    }
                }
            }
            setIsLoading(false);
        });

        return () => unsubscribe();

    }, []);

    return { isLoading }
}
