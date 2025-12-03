// export const BASE_URL = "http://127.0.0.1:8000";
export const BASE_URL = "https://hms-prediction.onrender.com";

export function getStatusMessage(statusCode) {
    let message = "";
    switch (statusCode) {
        case "1":
            message = "The Patient is Diabetic";
            break;
        case "0":
            message = "Patient don't have diabetes";
            break;
        default:
            message = "Unknown Status";
    }
    return message;
}

