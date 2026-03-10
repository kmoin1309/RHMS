import { DataProvider } from "./context/DataContext";
import { ToastContainer } from "react-toastify";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CalculationPage from "./screen/patient/calculation/CalculationPage";
import LoginPage from "./screen/Auth/Login";
import SignUpPage from "./screen/Auth/Signup";
import { UserProvider } from "./context/userContext";
import DoctorDashboard from "./screen/doctor/dashboard";
import AdminDashboard from "./screen/admin/dashboard";
import PatientDashboard from "./screen/patient/dashboard";
import AppointmentManagement from "./screen/patient/AppointmentManagement";
import PatientOnboarding from "./screen/patient/PatientOnboarding";
// import NotFound from "./NotFound";

// This is the main application component
function App() {
  return (
    // This is the root element of the application
    <>
      {/* This is the context provider for the data */}
      <DataProvider>
        {/* This is the context provider for the user */}
        <UserProvider>
          {/* This is the router for the application */}
          <BrowserRouter>
            {/* This is the routes for the application */}
            <Routes>
              {/* This route is for the patient dashboard */}
              <Route path="/patient/dashboard" element={<PatientDashboard />} />
              <Route path="/patient/appointments" element={<AppointmentManagement />} />
              <Route path="/patient/onboarding" element={<PatientOnboarding />} />
              {/* This route is for the calculation page */}
              <Route
                path="/patient/calculation/:test"
                element={<CalculationPage />}
              />
              {/* This route is for the doctor dashboard */}
              <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
              {/* This route is for the admin dashboard */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              {/* This route is for the login page */}
              <Route path="*" element={<LoginPage />} />
              {/* This route is for the signup page */}
              <Route path="/signup" element={<SignUpPage />} />
              {/* This route is for the not found page */}
              {/* <Route path="*" element={<NotFound />} /> */}
            </Routes>
          </BrowserRouter>
          {/* This is the toast container for the application */}
          <ToastContainer />
        </UserProvider>
      </DataProvider>
    </>
  );
}

export default App;

