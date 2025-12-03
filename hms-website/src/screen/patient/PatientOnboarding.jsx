import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from "../../context/userContext";
import Navbar from "../../components/navbar";
import { Activity, Heart, Scale, Thermometer, Stethoscope, Calendar, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

export default function PatientOnboarding() {
    const navigate = useNavigate();
    const { user } = useUserContext();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [predictionResult, setPredictionResult] = useState(null);

    // Booking State
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');

    const [formData, setFormData] = useState({
        gender: 'Male',
        age: '',
        height: '',
        weight: '',
        pulse_rate: '',
        systolic_bp: '',
        diastolic_bp: '',
        glucose: '',
        acetone: '',
        hypertensive: 'No',
        family_hypertension: 'No',
        cardiovascular_disease: 'No',
        stroke: 'No',
        family_diabetes: 'No'
    });

    useEffect(() => {
        // Fetch doctors on mount (or when needed)
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/admin/doctors');
            const data = await res.json();
            if (data.success) setDoctors(data.data);
        } catch (error) {
            console.error('Failed to fetch doctors:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8080/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                setPredictionResult(data);
                setStep(2); // Move to result step
            } else {
                toast.error(data.message || 'Prediction failed');
            }
        } catch (error) {
            console.error('Prediction error:', error);
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleBookAppointment = async () => {
        if (!selectedDoctor || !bookingDate || !bookingTime) {
            toast.error('Please select a doctor, date, and time');
            return;
        }

        try {
            setLoading(true);
            const dateTime = new Date(`${bookingDate}T${bookingTime}`);

            const response = await fetch('http://localhost:8080/api/appointments/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: user?.uid || 'guest', // Fallback for demo
                    doctorId: selectedDoctor,
                    date: dateTime.toISOString(),
                    notes: 'High Diabetes Risk Detected during Onboarding'
                })
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Appointment booked successfully!');
                navigate('/patient/appointments');
            } else {
                toast.error('Failed to book appointment');
            }
        } catch (error) {
            console.error('Booking error:', error);
            toast.error('Booking failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Progress Steps */}
                <div className="flex justify-center mb-8">
                    <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>1</div>
                        <span className="ml-2 font-medium">Health Data</span>
                    </div>
                    <div className={`w-16 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                    <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>2</div>
                        <span className="ml-2 font-medium">Results & Action</span>
                    </div>
                </div>

                {step === 1 && (
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                            <Activity className="w-6 h-6 mr-2 text-blue-600" />
                            Health Assessment
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Form fields (simplified for brevity, keeping key inputs) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                                    <input type="number" name="age" value={formData.age} onChange={handleChange} required className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-3 border rounded-xl">
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                                    <input type="number" name="height" value={formData.height} onChange={handleChange} required className="w-full p-3 border rounded-xl" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                                    <input type="number" name="weight" value={formData.weight} onChange={handleChange} required className="w-full p-3 border rounded-xl" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Glucose Level</label>
                                    <input type="number" name="glucose" value={formData.glucose} onChange={handleChange} required className="w-full p-3 border rounded-xl" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure (Systolic)</label>
                                    <input type="number" name="systolic_bp" value={formData.systolic_bp} onChange={handleChange} required className="w-full p-3 border rounded-xl" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure (Diastolic)</label>
                                    <input type="number" name="diastolic_bp" value={formData.diastolic_bp} onChange={handleChange} required className="w-full p-3 border rounded-xl" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Acetone</label>
                                    <input type="number" step="0.1" name="acetone" value={formData.acetone} onChange={handleChange} required className="w-full p-3 border rounded-xl" />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 disabled:opacity-50"
                                >
                                    {loading ? 'Analyzing...' : 'Analyze Health Risk'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {step === 2 && predictionResult && (
                    <div className="space-y-6">
                        {/* Result Card */}
                        <div className={`bg-white rounded-2xl shadow-lg p-8 border-l-8 ${predictionResult.prediction === 1 ? 'border-red-500' : 'border-green-500'}`}>
                            <h2 className={`text-3xl font-bold mb-4 ${predictionResult.prediction === 1 ? 'text-red-600' : 'text-green-600'}`}>
                                {predictionResult.prediction === 1 ? 'High Risk Detected' : 'Low Risk - Healthy'}
                            </h2>
                            <p className="text-gray-600 text-lg mb-6">
                                Based on your health metrics, your risk score is <strong>{predictionResult.riskScore}/100</strong>.
                                {predictionResult.prediction === 1 && " It is highly recommended to consult a specialist immediately."}
                            </p>

                            {/* Risk Factors */}
                            {predictionResult.riskFactors.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-semibold text-gray-900 mb-2">Key Risk Factors:</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {predictionResult.riskFactors.map((factor, idx) => (
                                            <span key={idx} className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                                                {factor}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Doctor Booking Section (Only if High Risk) */}
                        {predictionResult.prediction === 1 && (
                            <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in-up">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                    <Stethoscope className="w-6 h-6 mr-2 text-blue-600" />
                                    Book a Consultation
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Specialist</label>
                                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                            {doctors.map(doc => (
                                                <div
                                                    key={doc.id}
                                                    onClick={() => setSelectedDoctor(doc.id)}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedDoctor === doc.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                                                >
                                                    <div className="font-bold text-gray-900">{doc.name}</div>
                                                    <div className="text-sm text-gray-500">{doc.specialization}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                                <input
                                                    type="date"
                                                    min={new Date().toISOString().split('T')[0]}
                                                    value={bookingDate}
                                                    onChange={(e) => setBookingDate(e.target.value)}
                                                    className="w-full pl-10 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                                <input
                                                    type="time"
                                                    value={bookingTime}
                                                    onChange={(e) => setBookingTime(e.target.value)}
                                                    className="w-full pl-10 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4">
                                    <button
                                        onClick={() => navigate('/patient/dashboard')}
                                        className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl"
                                    >
                                        Skip for Now
                                    </button>
                                    <button
                                        onClick={handleBookAppointment}
                                        disabled={loading || !selectedDoctor}
                                        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
                                    >
                                        {loading ? 'Booking...' : 'Confirm Appointment'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Low Risk Action */}
                        {predictionResult.prediction === 0 && (
                            <div className="flex justify-center">
                                <button
                                    onClick={() => navigate('/patient/dashboard')}
                                    className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 shadow-lg"
                                >
                                    Return to Dashboard
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
