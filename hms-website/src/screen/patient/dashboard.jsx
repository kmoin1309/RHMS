import React from 'react';
import Monitor from "../../components/Monitor";
import Navbar from "../../components/navbar";
import { useGetDeviceData } from "../../services/realtime-db.service";
import TimeLogRecords from "./calculation/components/TimeLogRecords";
import VisualMonitor from "./calculation/components/VisualMonitor";

/**
 * The patient dashboard component
 * @returns {React.ReactElement} The patient dashboard component.
 */
export default function PatientDashboard() {
  /**
   * The state of the device data loading. If true, the data is being loaded.
   * If false, the data has finished loading.
   */
  const { isLoading } = useGetDeviceData();
  const [showPredictions, setShowPredictions] = React.useState(false);

  return (
    <div className="relative min-h-screen">
      {/* Renders the navbar component */}
      <Navbar />

      {/* If the device data is being loaded, render a loading spinner */}
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          {/* A loading spinner component */}
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <>
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 px-4 mt-6">
            <div
              onClick={() => window.location.href = '/patient/appointments'}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-100 flex items-center space-x-4"
            >
              <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-800">Appointments</h3>
                <p className="text-gray-500 text-sm">Manage your doctor visits</p>
              </div>
            </div>

            <div
              onClick={() => window.location.href = '/patient/onboarding'}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-100 flex items-center space-x-4"
            >
              <div className="p-3 bg-green-100 rounded-full text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-800">Health Assessment</h3>
                <p className="text-gray-500 text-sm">Check your health status</p>
              </div>
            </div>
          </div>

          {/* If the device data is not being loaded, render the monitor component */}
          <Monitor />
          {/* Renders the time log records component */}
          <TimeLogRecords />
          {/* Renders the visual monitor component */}
          <VisualMonitor />
        </>
      )}

      {/* Floating Action Button for Predictions */}
      <div className="fixed bottom-8 right-8 z-50">
        <div className={`flex flex-col-reverse items-end gap-2 mb-4 transition-all duration-300 ${showPredictions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <a
            href="http://localhost:8502"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors font-medium border border-gray-200 whitespace-nowrap"
          >
            Diabetes Prediction
          </a>
          <button className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors font-medium border border-gray-200 whitespace-nowrap">
            Disease 2 Prediction
          </button>
          <button className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors font-medium border border-gray-200 whitespace-nowrap">
            Disease 3 Prediction
          </button>
        </div>
        <button
          onClick={() => setShowPredictions(!showPredictions)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 ${showPredictions ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
