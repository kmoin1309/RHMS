import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, User, MessageCircle, CheckCircle, Pill, FileText, Download } from 'lucide-react';
import { useUserContext } from "../../context/userContext";
import Navbar from "../../components/navbar";
import { jsPDF } from "jspdf";

export default function AppointmentManagement() {
  const { user } = useUserContext();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      // Get userId from context or directly from localStorage as fallback
      let userId = user?.uid || user?.id;
      if (!userId) {
        try {
          const stored = JSON.parse(localStorage.getItem('user'));
          userId = stored?.uid || stored?.id;
        } catch (e) {}
      }
      if (!userId) {
        userId = 'guest';
      }
      console.log('Fetching appointments for userId:', userId);
      const res = await fetch(`http://localhost:8080/api/appointments?userId=${userId}&role=patient`);
      const data = await res.json();
      console.log('Appointments response:', data);
      if (data.success) {
        setAppointments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPrescription = (appt) => {
    if (!appt.prescription) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(41, 128, 185);
    doc.text("Medical Prescription", 105, 20, null, null, "center");

    // Doctor Info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Doctor: ${appt.doctorName || 'Dr. Specialist'}`, 20, 40);
    doc.text(`Date: ${new Date(appt.prescription.date).toLocaleDateString()}`, 150, 40);

    // Patient Info
    doc.text(`Patient: ${user.name}`, 20, 50);

    // Line
    doc.setLineWidth(0.5);
    doc.line(20, 55, 190, 55);

    // Medications
    doc.setFontSize(14);
    doc.text("Medications:", 20, 70);

    let yPos = 80;
    appt.prescription.medications.forEach((med, index) => {
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${med.name} - ${med.dosage}`, 25, yPos);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`   ${med.frequency} for ${med.duration}`, 25, yPos + 5);
      yPos += 15;
      doc.setTextColor(0, 0, 0);
    });

    // Instructions
    if (appt.prescription.instructions) {
      yPos += 10;
      doc.setFontSize(14);
      doc.text("Instructions:", 20, yPos);
      doc.setFontSize(12);
      doc.text(appt.prescription.instructions, 25, yPos + 10, { maxWidth: 170 });
    }

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("This is a digitally generated prescription.", 105, 280, null, null, "center");

    doc.save(`Prescription_${appt.date.split('T')[0]}.pdf`);
  };

  const filteredAppointments = appointments.filter(appt => {
    if (activeTab === 'upcoming') return ['Scheduled', 'Pending', 'Confirmed', 'Accepted'].includes(appt.status);
    return ['Completed', 'Cancelled', 'Rejected'].includes(appt.status);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              History
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No appointments found</h3>
            <p className="text-gray-500 mt-1">You don't have any {activeTab} appointments.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appt) => (
              <div key={appt.id || appt._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  {/* Left: Info */}
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{appt.doctorName || 'Dr. Specialist'}</h3>
                      <div className="flex items-center text-gray-500 text-sm mt-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(appt.date).toLocaleDateString()}
                        <Clock className="w-4 h-4 ml-3 mr-1" />
                        {new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium 
                          ${appt.status === 'Confirmed' || appt.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                            appt.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                              appt.status === 'Completed' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'}`}>
                          {appt.status}
                        </span>
                        <span className="text-xs text-gray-400">• {appt.type || 'General Checkup'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2 min-w-[140px]">
                    {(appt.status === 'Confirmed' || appt.status === 'Accepted') && appt.meetLink && (
                      <a
                        href={appt.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Join Meet
                      </a>
                    )}

                    {appt.status === 'Completed' && appt.prescription && (
                      <button
                        onClick={() => downloadPrescription(appt)}
                        className="flex items-center justify-center px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Prescription
                      </button>
                    )}

                    {appt.status === 'Pending' && (
                      <div className="text-center text-sm text-gray-500 italic py-2">
                        Waiting for approval
                      </div>
                    )}
                  </div>
                </div>

                {/* Prescription Preview (if completed) */}
                {appt.status === 'Completed' && appt.prescription && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-gray-500" />
                      Prescription Details
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-3">
                        {appt.prescription.medications.map((med, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <Pill className="w-4 h-4 text-blue-500 mt-1" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{med.name} - {med.dosage}</p>
                              <p className="text-xs text-gray-500">{med.frequency} • {med.duration}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {appt.prescription.instructions && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Instructions</p>
                          <p className="text-sm text-gray-700">{appt.prescription.instructions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
