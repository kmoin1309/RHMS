import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { fdb } from "../helper/firebaseConfig";
import { toast } from "react-toastify";
import moment from "moment";

export const sendNotification = async (recipientId, message) => {
    try {
        await addDoc(collection(fdb, `Users/${recipientId}/Notifications`), {
            message,
            read: false,
            timestamp: moment().utc().format(),
        });
        toast.success("Notification sent successfully");
    } catch (e) {
        console.error("Error sending notification: ", e);
        toast.error("Error sending notification");
    }
};

export const getNotifications = (userId, callback) => {
    const q = query(collection(fdb, `Users/${userId}/Notifications`), orderBy("timestamp", "desc"));
    return onSnapshot(q, (querySnapshot) => {
        const notifications = [];
        querySnapshot.forEach((doc) => {
            notifications.push({ id: doc.id, ...doc.data() });
        });
        callback(notifications);
    });
};
