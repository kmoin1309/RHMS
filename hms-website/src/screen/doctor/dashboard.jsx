import React, { useState, useEffect } from "react";
import Navbar from "../../components/navbar";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Video,
  Users,
  Activity,
  Bell,
  Search,
  ChevronRight,
  Plus,
  FileText,
  Pill,
  Download,
  Send
} from "lucide-react";
import { useUserContext } from "../../context/userContext";
import { toast } from 'react-toastify';
import { jsPDF } from "jspdf";
import moment from "moment";

const STATS = [
  {
    label: "Pending Requests",
    value: "0",
    icon: Clock,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    label: "Today's Appointments",
    value: "0",
    icon: Calendar,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    label: "Total Patients",
    value: "0",
    icon: Users,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
];

export default function DoctorDashboard() {
  const { user } = useUserContext();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(STATS);

  // Prescription Modal State
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
    instructions: ''
  });

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/appointments?userId=${user?.uid || 'doctor1'}&role=doctor`);
      const data = await res.json();
      if (data.success) {
        setAppointments(data.data);
        updateStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (appts) => {
    const pending = appts.filter(a => a.status === 'Pending').length;
    const today = appts.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length;

    setStats([
      { ...STATS[0], value: pending.toString() },
      { ...STATS[1], value: today.toString() },
      { ...STATS[2], value: appts.length.toString() },
    ]);
  };

  const handleAppointmentAction = async (apptId, action) => {
    try {
      const meetLink = action === 'accept' ? `https://meet.google.com/${Math.random().toString(36).substr(2, 9)}` : null;
      const status = action === 'accept' ? 'Confirmed' : 'Rejected';

      const res = await fetch(`http://localhost:8080/api/appointments/${apptId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, meetLink })
      });

      if (res.ok) {
        toast.success(`Appointment ${action === 'accept' ? 'accepted' : 'rejected'}`);
        fetchAppointments();
      }
    } catch (error) {
      console.error('Action failed:', error);
      toast.error('Failed to update appointment');
    }
  };

  const openPrescriptionModal = (appt) => {
    setSelectedAppointment(appt);
    setShowPrescriptionModal(true);
    // Load existing prescription if any
    if (appt.prescription) {
      setPrescriptionForm({
        medications: appt.prescription.medications,
        instructions: appt.prescription.instructions
      });
    }
  };

  const addMedication = () => {
    setPrescriptionForm({
      ...prescriptionForm,
      medications: [...prescriptionForm.medications, { name: '', dosage: '', frequency: '', duration: '' }]
    });
  };

  const updateMedication = (index, field, value) => {
    const newMeds = [...prescriptionForm.medications];
    newMeds[index][field] = value;
    setPrescriptionForm({ ...prescriptionForm, medications: newMeds });
  };

  const removeMedication = (index) => {
    const newMeds = prescriptionForm.medications.filter((_, i) => i !== index);
    setPrescriptionForm({ ...prescriptionForm, medications: newMeds });
  };

  const submitPrescription = async () => {
    if (!selectedAppointment) return;

    try {
      const res = await fetch(`http://localhost:8080/api/appointments/${selectedAppointment.id || selectedAppointment._id}/prescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prescriptionForm)
      });

      if (res.ok) {
        toast.success('Prescription added successfully');
        setShowPrescriptionModal(false);
        setPrescriptionForm({
          medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
          instructions: ''
        });
        fetchAppointments();
      }
    } catch (error) {
      console.error('Failed to submit prescription:', error);
      toast.error('Failed to submit prescription');
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
    doc.text(`Doctor: ${user?.name || 'Dr. Specialist'}`, 20, 40);
    doc.text(`Date: ${new Date(appt.prescription.date).toLocaleDateString()}`, 150, 40);

    // Patient Info
    doc.text(`Patient: ${appt.patientName || 'Patient'}`, 20, 50);

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
      const splitInstructions = doc.splitTextToSize(appt.prescription.instructions, 170);
      doc.text(splitInstructions, 25, yPos + 10);
    }

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("This is a digitally generated prescription.", 105, 280, null, null, "center");

    doc.save(`Prescription_${appt.patientName}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const StatCard = ({ stat }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">
            {stat.value}
          </h3>
        </div>
        <div className={`p-3 rounded-lg ${stat.bg}`}>
          <stat.icon className={`w-6 h-6 ${stat.color}`} />
        </div>
      </div>
    </div>
  );

  const AppointmentCard = ({ appt }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-4 transition-all hover:border-blue-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${appt.status === "Confirmed"
                ? "bg-green-100 text-green-600"
                : appt.status === "Pending"
                  ? "bg-orange-100 text-orange-600"
                  : appt.status === "Completed"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-red-100 text-red-600"
              }`}
          >
            {(appt.patientName || 'P').charAt(0)}
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">{appt.patientName || 'Patient'}</h4>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <Clock className="w-4 h-4" />
              <span>{moment(appt.date).format('MMM DD, YYYY • h:mm A')}</span>
            </div>
            {appt.notes && (
              <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded border border-gray-100 inline-block">
                📝 {appt.notes}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {appt.status === "Pending" && (
            <>
              <button
                onClick={() => handleAppointmentAction(appt.id || appt._id, "accept")}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <CheckCircle className="w-4 h-4" /> Accept
              </button>
              <button
                onClick={() => handleAppointmentAction(appt.id || appt._id, "reject")}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </>
          )}

          {appt.status === "Confirmed" && (
            <>
              <a
                href={appt.meetLink}
                target="_blank"
                rel="noreferrer"
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Video className="w-4 h-4" /> Join Meet
              </a>
              <button
                onClick={() => openPrescriptionModal(appt)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
              >
                <Pill className="w-4 h-4" /> Prescribe
              </button>
            </>
          )}

          {appt.status === "Completed" && appt.prescription && (
            <button
              onClick={() => downloadPrescription(appt)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" /> Download
            </button>
          )}

          {appt.status === "Rejected" && (
            <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm">
              Rejected
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const PrescriptionModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-blue-600" />
            Write Prescription
          </h2>
          <p className="text-gray-500 mt-1">Patient: {selectedAppointment?.patientName}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Medications */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Medications</h3>
              <button
                onClick={addMedication}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" /> Add Medicine
              </button>
            </div>

            <div className="space-y-4">
              {prescriptionForm.medications.map((med, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                        placeholder="e.g., Metformin"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        placeholder="e.g., 500mg"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        placeholder="e.g., Twice daily"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        placeholder="e.g., 30 days"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-end">
                      {prescriptionForm.medications.length > 1 && (
                        <button
                          onClick={() => removeMedication(index)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Instructions</label>
            <textarea
              value={prescriptionForm.instructions}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
              placeholder="Special instructions, dietary advice, precautions..."
              rows={4}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-2xl flex justify-end gap-4">
          <button
            onClick={() => {
              setShowPrescriptionModal(false);
              setPrescriptionForm({
                medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
                instructions: ''
              });
            }}
            className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={submitPrescription}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Submit Prescription
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      {showPrescriptionModal && <PrescriptionModal />}
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Doctor Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Welcome back, Dr. {user ? user.name : "..."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 border border-gray-200">
                <Bell className="w-5 h-5 text-gray-600" />
                {stats[0].value !== '0' && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <StatCard key={idx} stat={stat} />
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              <nav className="flex lg:flex-col p-2">
                {[
                  { id: "dashboard", label: "Overview", icon: Activity },
                  { id: "appointments", label: "Appointments", icon: Calendar },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex-1 lg:flex-none flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {activeTab === "dashboard" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-800">
                        Today's Schedule
                      </h2>
                      <button
                        onClick={() => setActiveTab("appointments")}
                        className="text-blue-600 text-sm font-medium hover:underline flex items-center"
                      >
                        View all <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    {appointments.slice(0, 3).map((appt) => (
                      <AppointmentCard key={appt.id || appt._id} appt={appt} />
                    ))}
                    {appointments.length === 0 && (
                      <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                        <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">No appointments yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "appointments" && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Calendar className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            You have{" "}
                            <span className="font-bold">
                              {
                                appointments.filter((a) => a.status === "Pending")
                                  .length
                              }{" "}
                              pending
                            </span>{" "}
                            requests waiting for approval.
                          </p>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-700 mb-4">
                      Pending Requests
                    </h3>
                    {appointments.filter((a) => a.status === "Pending").length ===
                      0 ? (
                      <p className="text-gray-500 italic">No pending requests.</p>
                    ) : (
                      appointments
                        .filter((a) => a.status === "Pending")
                        .map((appt) => (
                          <AppointmentCard key={appt.id || appt._id} appt={appt} />
                        ))
                    )}

                    <h3 className="text-lg font-semibold text-gray-700 mb-4 mt-8">
                      Upcoming Appointments
                    </h3>
                    {appointments
                      .filter((a) => a.status === "Confirmed")
                      .map((appt) => (
                        <AppointmentCard key={appt.id || appt._id} appt={appt} />
                      ))}

                    <h3 className="text-lg font-semibold text-gray-700 mb-4 mt-8">
                      Completed
                    </h3>
                    {appointments
                      .filter((a) => a.status === "Completed")
                      .map((appt) => (
                        <AppointmentCard key={appt.id || appt._id} appt={appt} />
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
