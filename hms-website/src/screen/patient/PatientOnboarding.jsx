import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from "../../context/userContext";
import { useDataContext } from "../../context/DataContext";
import { useGetDeviceData } from "../../services/realtime-db.service";
import Navbar from "../../components/navbar";
import { Activity, Heart, Scale, Thermometer, Stethoscope, Calendar, Clock, ChevronDown, Flame, Zap, AlertTriangle, Droplets } from 'lucide-react';
import { toast } from 'react-toastify';

export default function PatientOnboarding() {
    const navigate = useNavigate();
    const { user } = useUserContext();

    // Real-time sensor data
    const { isLoading: sensorLoading } = useGetDeviceData();
    const { realData } = useDataContext();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [predictionResult, setPredictionResult] = useState(null);

    // Collapsible section states
    const [patientDataOpen, setPatientDataOpen] = useState(true);
    const [vitalsOpen, setVitalsOpen] = useState(true);
    const [historyOpen, setHistoryOpen] = useState(true);

    // Booking State
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');

    const [formData, setFormData] = useState({
        gender: 'Male',
        age: '30',
        height: '170',
        weight: '70',
        glucose: '100',
        // Vitals (will be driven by real-time sensor)
        pulse_rate: '0',
        systolic_bp: '0',
        diastolic_bp: '0',
        acetone: '0',
        spo2: '100',
        activity: '0',
        // History
        hypertensive: 'No',
        family_hypertension: 'No',
        cardiovascular_disease: 'No',
        stroke: 'No',
        family_diabetes: 'No',
        prev_diagnosis: 'No'
    });

    // Compute BMI reactively
    const heightM = parseFloat(formData.height) / 100;
    const bmi = heightM > 0 ? (parseFloat(formData.weight) / (heightM * heightM)).toFixed(1) : '0';

    // Sync real-time sensor data into form vitals
    useEffect(() => {
        if (realData) {
            setFormData(prev => ({
                ...prev,
                pulse_rate: realData.heartRate?.toFixed(2) || '0',
                systolic_bp: realData.systolic?.toFixed(2) || '0',
                diastolic_bp: realData.diastolic?.toFixed(2) || '0',
                acetone: realData.acetone?.toFixed(2) || '0',
                spo2: realData.spo2?.toFixed(2) || '100',
                activity: realData.activity ? '1' : '0',
            }));
        }
    }, [realData]);

    useEffect(() => {
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

    const handleIncrement = (field, stepVal = 1) => {
        setFormData(prev => ({
            ...prev,
            [field]: (parseFloat(prev[field]) + stepVal).toFixed(2)
        }));
    };

    const handleDecrement = (field, stepVal = 1) => {
        setFormData(prev => ({
            ...prev,
            [field]: Math.max(0, parseFloat(prev[field]) - stepVal).toFixed(2)
        }));
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
                body: JSON.stringify({ ...formData, bmi })
            });

            const data = await response.json();
            if (data.success) {
                setPredictionResult(data);
                setStep(2);
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

            // Get patientId from context or localStorage fallback
            let patientId = user?.uid || user?.id;
            if (!patientId) {
                try {
                    const stored = JSON.parse(localStorage.getItem('user'));
                    patientId = stored?.uid || stored?.id;
                } catch (e) {}
            }
            if (!patientId) patientId = 'guest';

            const response = await fetch('http://localhost:8080/api/appointments/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: patientId,
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

    // Collapsible Section Component
    const Section = ({ title, icon, isOpen, toggle, children, accentColor = '#3b82f6' }) => (
        <div style={{
            marginBottom: '16px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
            <button
                type="button"
                onClick={toggle}
                style={{
                    width: '100%',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: '#f9fafb',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#111827',
                    fontSize: '15px',
                    fontWeight: '600',
                    transition: 'background 0.2s',
                    borderBottom: isOpen ? '1px solid #e5e7eb' : 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}
            >
                <ChevronDown
                    size={18}
                    style={{
                        transition: 'transform 0.3s',
                        transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                        color: accentColor
                    }}
                />
                <span style={{ fontSize: '16px' }}>{icon}</span>
                <span>{title}</span>
                {title.includes('Live') && (
                    <span style={{
                        marginLeft: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: '#16a34a',
                        fontWeight: '600',
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#16a34a',
                            display: 'inline-block',
                            animation: 'pulse-dot 1.5s infinite',
                        }} />
                        LIVE
                    </span>
                )}
            </button>
            <div style={{
                maxHeight: isOpen ? '1000px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.4s ease',
            }}>
                <div style={{ padding: '20px' }}>
                    {children}
                </div>
            </div>
        </div>
    );

    // Number Input with +/- buttons
    const NumberField = ({ label, name, value, onChange, step = 1, readOnly = false, liveIndicator = false }) => (
        <div style={{ marginBottom: '12px' }}>
            <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#4b5563',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '8px',
            }}>
                {label}
                {liveIndicator && (
                    <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#16a34a',
                        display: 'inline-block',
                        animation: 'pulse-dot 1.5s infinite',
                    }} />
                )}
            </label>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                background: readOnly ? '#f3f4f6' : '#ffffff',
                borderRadius: '8px',
                border: readOnly ? '1px solid #bbf7d0' : '1px solid #d1d5db',
                overflow: 'hidden',
                boxShadow: readOnly ? 'none' : 'inset 0 1px 2px rgba(0,0,0,0.05)',
            }}>
                <input
                    type="number"
                    name={name}
                    value={value}
                    onChange={onChange}
                    readOnly={readOnly}
                    step={step}
                    style={{
                        flex: 1,
                        padding: '10px 14px',
                        background: 'transparent',
                        border: 'none',
                        color: readOnly ? '#16a34a' : '#111827',
                        fontSize: '15px',
                        fontWeight: '600',
                        outline: 'none',
                        width: '100%',
                    }}
                />
                {!readOnly && (
                    <div style={{ display: 'flex', gap: '2px', padding: '0 6px' }}>
                        <button
                            type="button"
                            onClick={() => handleDecrement(name, step)}
                            style={{
                                width: '28px',
                                height: '28px',
                                background: '#f3f4f6',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                color: '#4b5563',
                                cursor: 'pointer',
                                fontSize: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                            onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
                        >−</button>
                        <button
                            type="button"
                            onClick={() => handleIncrement(name, step)}
                            style={{
                                width: '28px',
                                height: '28px',
                                background: '#f3f4f6',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                color: '#4b5563',
                                cursor: 'pointer',
                                fontSize: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                            onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
                        >+</button>
                    </div>
                )}
            </div>
        </div>
    );

    // Select dropdown
    const SelectField = ({ label, name, value, onChange, options }) => (
        <div style={{ marginBottom: '12px' }}>
            <label style={{
                display: 'block',
                color: '#4b5563',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '8px',
            }}>{label}</label>
            <select
                name={name}
                value={value}
                onChange={onChange}
                style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    color: '#111827',
                    fontSize: '15px',
                    fontWeight: '500',
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'auto',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                }}
            >
                {options.map(opt => (
                    <option key={opt} value={opt} style={{ background: '#ffffff', color: '#111827' }}>{opt}</option>
                ))}
            </select>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#f9fafb', color: '#111827' }}>
            <Navbar />
            <style>{`
                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.5s ease-out; }
            `}</style>

            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>

                {/* Header */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '24px 28px',
                    marginBottom: '24px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <Flame size={28} color="#ef4444" />
                        <h1 style={{
                            fontSize: '26px',
                            fontWeight: '800',
                            color: '#111827',
                            margin: 0,
                        }}>Diabetes Risk Prediction</h1>
                    </div>
                    <p style={{ color: '#4b5563', fontSize: '14px', margin: 0, marginLeft: '40px' }}>
                        AI-Powered Real-time Risk Assessment
                    </p>
                </div>

                {/* Progress Steps */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', gap: '16px', alignItems: 'center' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: step >= 1 ? '#3b82f6' : '#9ca3af'
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `2px solid ${step >= 1 ? '#3b82f6' : '#d1d5db'}`,
                            background: step >= 1 ? '#eff6ff' : '#ffffff',
                            fontWeight: '700',
                            fontSize: '14px',
                        }}>1</div>
                        <span style={{ fontWeight: '600', fontSize: '14px' }}>Health Data</span>
                    </div>
                    <div style={{
                        width: '60px',
                        height: '3px',
                        borderRadius: '2px',
                        background: step >= 2 ? '#3b82f6' : '#e5e7eb',
                        transition: 'background 0.3s',
                    }} />
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: step >= 2 ? '#3b82f6' : '#9ca3af'
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `2px solid ${step >= 2 ? '#3b82f6' : '#d1d5db'}`,
                            background: step >= 2 ? '#eff6ff' : '#ffffff',
                            fontWeight: '700',
                            fontSize: '14px',
                        }}>2</div>
                        <span style={{ fontWeight: '600', fontSize: '14px' }}>Results & Action</span>
                    </div>
                </div>

                {step === 1 && (
                    <form onSubmit={handleSubmit} className="animate-fade-in-up">

                        {/* Patient Data Section */}
                        <Section
                            title="Patient Data"
                            icon="📋"
                            isOpen={patientDataOpen}
                            toggle={() => setPatientDataOpen(!patientDataOpen)}
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <SelectField
                                    label="Gender"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    options={['Male', 'Female']}
                                />
                                <NumberField
                                    label="Weight (kg)"
                                    name="weight"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    step={0.5}
                                />
                                <NumberField
                                    label="Age"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    step={1}
                                />
                                <NumberField
                                    label="Glucose (mg/dL)"
                                    name="glucose"
                                    value={formData.glucose}
                                    onChange={handleChange}
                                    step={1}
                                />
                                <NumberField
                                    label="Height (cm)"
                                    name="height"
                                    value={formData.height}
                                    onChange={handleChange}
                                    step={1}
                                />
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{
                                        display: 'block',
                                        color: '#4b5563',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        marginBottom: '8px',
                                    }}>BMI</label>
                                    <div style={{
                                        padding: '10px 14px',
                                        background: '#f9fafb',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        color: parseFloat(bmi) >= 30 ? '#ef4444' : parseFloat(bmi) >= 25 ? '#f59e0b' : '#16a34a',
                                        fontSize: '15px',
                                        fontWeight: '700',
                                    }}>
                                        {bmi}
                                    </div>
                                </div>
                            </div>
                        </Section>

                        {/* Vitals (Live) Section */}
                        <Section
                            title="❤️ Vitals (Live)"
                            icon=""
                            isOpen={vitalsOpen}
                            toggle={() => setVitalsOpen(!vitalsOpen)}
                            accentColor="#ef4444"
                        >
                            {sensorLoading && (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '12px',
                                    color: '#64748b',
                                    fontSize: '14px',
                                }}>
                                    Connecting to sensors...
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                <NumberField
                                    label="Pulse"
                                    name="pulse_rate"
                                    value={formData.pulse_rate}
                                    onChange={handleChange}
                                    readOnly={true}
                                    liveIndicator={true}
                                />
                                <NumberField
                                    label="Systolic"
                                    name="systolic_bp"
                                    value={formData.systolic_bp}
                                    onChange={handleChange}
                                    readOnly={true}
                                    liveIndicator={true}
                                />
                                <NumberField
                                    label="Diastolic"
                                    name="diastolic_bp"
                                    value={formData.diastolic_bp}
                                    onChange={handleChange}
                                    readOnly={true}
                                    liveIndicator={true}
                                />
                                <NumberField
                                    label="Acetone"
                                    name="acetone"
                                    value={formData.acetone}
                                    onChange={handleChange}
                                    readOnly={true}
                                    liveIndicator={true}
                                />
                                <NumberField
                                    label="SPO2 (%)"
                                    name="spo2"
                                    value={formData.spo2}
                                    onChange={handleChange}
                                    readOnly={true}
                                    liveIndicator={true}
                                />
                                <NumberField
                                    label="Activity"
                                    name="activity"
                                    value={formData.activity}
                                    onChange={handleChange}
                                    readOnly={true}
                                    liveIndicator={true}
                                />
                            </div>
                        </Section>

                        {/* History Section */}
                        <Section
                            title="📁 History"
                            icon=""
                            isOpen={historyOpen}
                            toggle={() => setHistoryOpen(!historyOpen)}
                            accentColor="#8b5cf6"
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                <SelectField
                                    label="Hypertension"
                                    name="hypertensive"
                                    value={formData.hypertensive}
                                    onChange={handleChange}
                                    options={['No', 'Yes']}
                                />
                                <SelectField
                                    label="Heart Condition"
                                    name="cardiovascular_disease"
                                    value={formData.cardiovascular_disease}
                                    onChange={handleChange}
                                    options={['No', 'Yes']}
                                />
                                <SelectField
                                    label="Fam. Diabetes"
                                    name="family_diabetes"
                                    value={formData.family_diabetes}
                                    onChange={handleChange}
                                    options={['No', 'Yes']}
                                />
                                <SelectField
                                    label="Fam. Hypertension"
                                    name="family_hypertension"
                                    value={formData.family_hypertension}
                                    onChange={handleChange}
                                    options={['No', 'Yes']}
                                />
                                <SelectField
                                    label="Stroke"
                                    name="stroke"
                                    value={formData.stroke}
                                    onChange={handleChange}
                                    options={['No', 'Yes']}
                                />
                                <SelectField
                                    label="Prev. Diagnosis"
                                    name="prev_diagnosis"
                                    value={formData.prev_diagnosis}
                                    onChange={handleChange}
                                    options={['No', 'Yes']}
                                />
                            </div>
                        </Section>

                        {/* Analyze Risk Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: loading
                                    ? '#d1d5db'
                                    : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                color: '#ffffff',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.3s',
                                boxShadow: loading ? 'none' : '0 4px 14px rgba(22, 163, 74, 0.3)',
                                marginTop: '8px',
                            }}
                        >
                            <Zap size={20} />
                            {loading ? 'Analyzing...' : 'Analyze Risk'}
                        </button>

                        {/* AI Assistance floating button mapped to Langchain Agent */}
                        <div style={{
                            position: 'fixed',
                            bottom: '24px',
                            right: '24px',
                            zIndex: 50,
                        }}>
                            <button
                                type="button"
                                onClick={() => window.open('http://localhost:5173', '_blank')}
                                style={{
                                    padding: '12px 20px',
                                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                AI Assistance
                            </button>
                        </div>
                    </form>
                )}

                {step === 2 && predictionResult && (
                    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Result Card */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: '16px',
                            padding: '32px',
                            borderLeft: `6px solid ${predictionResult.prediction === 1 ? '#ef4444' : '#16a34a'}`,
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                {predictionResult.prediction === 1 ? (
                                    <AlertTriangle size={32} color="#ef4444" />
                                ) : (
                                    <Heart size={32} color="#16a34a" />
                                )}
                                <h2 style={{
                                    fontSize: '28px',
                                    fontWeight: '800',
                                    color: predictionResult.prediction === 1 ? '#ef4444' : '#16a34a',
                                    margin: 0,
                                }}>
                                    {predictionResult.prediction === 1 ? 'High Risk Detected' : 'Low Risk - Healthy'}
                                </h2>
                            </div>
                            <p style={{ color: '#4b5563', fontSize: '16px', marginBottom: '20px', lineHeight: 1.6 }}>
                                Based on your health metrics, your risk score is <strong style={{ color: '#111827' }}>{predictionResult.riskScore}/100</strong>.
                                {predictionResult.prediction === 1 && " It is highly recommended to consult a specialist immediately."}
                            </p>

                            {/* Source & BMI */}
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                <span style={{
                                    padding: '6px 14px',
                                    background: '#eff6ff',
                                    color: '#2563eb',
                                    borderRadius: '20px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                }}>
                                    Source: {predictionResult.source || 'ML Model'}
                                </span>
                                <span style={{
                                    padding: '6px 14px',
                                    background: '#f3e8ff',
                                    color: '#7c3aed',
                                    borderRadius: '20px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                }}>
                                    BMI: {predictionResult.bmi || bmi}
                                </span>
                            </div>

                            {/* Risk Factors */}
                            {predictionResult.riskFactors && predictionResult.riskFactors.length > 0 && (
                                <div style={{ marginBottom: '20px' }}>
                                    <h3 style={{ color: '#111827', fontWeight: '700', marginBottom: '10px', fontSize: '16px' }}>Key Risk Factors:</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {predictionResult.riskFactors.map((factor, idx) => (
                                            <span key={idx} style={{
                                                background: '#fef2f2',
                                                color: '#ef4444',
                                                padding: '6px 14px',
                                                borderRadius: '20px',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                            }}>
                                                {factor}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            {predictionResult.recommendations && predictionResult.recommendations.length > 0 && (
                                <div>
                                    <h3 style={{ color: '#111827', fontWeight: '700', marginBottom: '10px', fontSize: '16px' }}>Recommendations:</h3>
                                    <ul style={{ color: '#4b5563', fontSize: '14px', lineHeight: 2, paddingLeft: '20px' }}>
                                        {predictionResult.recommendations.map((rec, idx) => (
                                            <li key={idx}>{rec}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Doctor Booking Section (Only if High Risk) */}
                        {predictionResult.prediction === 1 && (
                            <div style={{
                                background: '#ffffff',
                                borderRadius: '16px',
                                padding: '32px',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                            }}>
                                <h3 style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    color: '#111827',
                                    marginBottom: '24px',
                                }}>
                                    <Stethoscope size={22} color="#3b82f6" />
                                    Book a Consultation
                                </h3>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                    <div>
                                        <label style={{ display: 'block', color: '#4b5563', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                                            Select Specialist
                                        </label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                                            {doctors.map(doc => (
                                                <div
                                                    key={doc.id}
                                                    onClick={() => setSelectedDoctor(doc.id)}
                                                    style={{
                                                        padding: '14px 16px',
                                                        borderRadius: '10px',
                                                        border: `2px solid ${selectedDoctor === doc.id ? '#3b82f6' : '#e5e7eb'}`,
                                                        background: selectedDoctor === doc.id ? '#eff6ff' : '#ffffff',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    <div style={{ fontWeight: '700', color: '#111827', fontSize: '14px' }}>{doc.name}</div>
                                                    <div style={{ color: '#4b5563', fontSize: '13px', marginTop: '2px' }}>{doc.specialization}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', color: '#4b5563', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Preferred Date</label>
                                            <input
                                                type="date"
                                                min={new Date().toISOString().split('T')[0]}
                                                value={bookingDate}
                                                onChange={(e) => setBookingDate(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 14px',
                                                    background: '#ffffff',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '10px',
                                                    color: '#111827',
                                                    fontSize: '15px',
                                                    outline: 'none',
                                                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#4b5563', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Preferred Time</label>
                                            <input
                                                type="time"
                                                value={bookingTime}
                                                onChange={(e) => setBookingTime(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 14px',
                                                    background: '#ffffff',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '10px',
                                                    color: '#111827',
                                                    fontSize: '15px',
                                                    outline: 'none',
                                                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/patient/dashboard')}
                                        style={{
                                            padding: '12px 24px',
                                            background: '#ffffff',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '10px',
                                            color: '#4b5563',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                                    >
                                        Skip for Now
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleBookAppointment}
                                        disabled={loading || !selectedDoctor}
                                        style={{
                                            padding: '12px 28px',
                                            background: loading || !selectedDoctor
                                                ? '#d1d5db'
                                                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                            border: 'none',
                                            borderRadius: '10px',
                                            color: '#ffffff',
                                            fontSize: '14px',
                                            fontWeight: '700',
                                            cursor: loading || !selectedDoctor ? 'not-allowed' : 'pointer',
                                            boxShadow: loading || !selectedDoctor ? 'none' : '0 4px 14px rgba(59, 130, 246, 0.3)',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        {loading ? 'Booking...' : 'Confirm Appointment'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Low Risk Action */}
                        {predictionResult.prediction === 0 && (
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <button
                                    type="button"
                                    onClick={() => navigate('/patient/dashboard')}
                                    style={{
                                        padding: '14px 32px',
                                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: '#fff',
                                        fontSize: '16px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)',
                                    }}
                                >
                                    Return to Dashboard
                                </button>
                            </div>
                        )}

                        {/* Back to form */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                                type="button"
                                onClick={() => { setStep(1); setPredictionResult(null); }}
                                style={{
                                    padding: '10px 24px',
                                    background: '#ffffff',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '10px',
                                    color: '#4b5563',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                                onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                            >
                                ← Re-assess with new data
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
