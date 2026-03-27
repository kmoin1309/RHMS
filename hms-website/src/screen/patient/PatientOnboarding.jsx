import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from "../../context/userContext";
import { useDataContext } from "../../context/DataContext";
import { useGetDeviceData } from "../../services/realtime-db.service";
import Navbar from "../../components/navbar";
import WCRSDashboard from "../../components/WCRSDashboard";

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
    const [heredityOpen, setHeredityOpen] = useState(true);
    const [activityOpen, setActivityOpen] = useState(true);

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
        temperature: '36.5',
        // History
        hypertensive: 'No',
        family_hypertension: 'No',
        cardiovascular_disease: 'No',
        stroke: 'No',
        family_diabetes: 'No',
        prev_diagnosis: 'No',
        // Heredity (WCRS Section D)
        heredity_both_parents: false,
        heredity_father: false,
        heredity_mother: false,
        heredity_sibling: false,
        heredity_grandparent: false,
        // Activity MET (WCRS Section E)
        met_value: '4',
        activity_minutes: '30',
        activity_days: '3'
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
                temperature: realData.temperature?.toFixed(2) || '36.5',
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
                                <NumberField
                                    label="Temperature (°C)"
                                    name="temperature"
                                    value={formData.temperature}
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

                        {/* Heredity Section (WCRS Section D) */}
                        <Section
                            title="🧬 Family Heredity (Diabetes)"
                            icon=""
                            isOpen={heredityOpen}
                            toggle={() => setHeredityOpen(!heredityOpen)}
                            accentColor="#f59e0b"
                        >
                            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
                                Select all family members with diabetes history. Each selection contributes to your heredity risk score (H_score), capped at 1.0.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                                {[
                                    { key: 'heredity_both_parents', label: 'Both Parents', score: '1.0', icon: '👨‍👩‍👦' },
                                    { key: 'heredity_father', label: 'Father', score: '0.5', icon: '👨' },
                                    { key: 'heredity_mother', label: 'Mother', score: '0.5', icon: '👩' },
                                    { key: 'heredity_sibling', label: 'Sibling', score: '0.3', icon: '🧑‍🤝‍🧑' },
                                    { key: 'heredity_grandparent', label: 'Grandparent', score: '0.15', icon: '👴' },
                                ].map(card => (
                                    <div
                                        key={card.key}
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, [card.key]: !prev[card.key] }));
                                        }}
                                        style={{
                                            padding: '14px 10px',
                                            borderRadius: '12px',
                                            border: `2px solid ${formData[card.key] ? '#f59e0b' : '#e5e7eb'}`,
                                            background: formData[card.key] ? '#fffbeb' : '#ffffff',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            transition: 'all 0.2s',
                                            boxShadow: formData[card.key] ? '0 2px 8px rgba(245,158,11,0.15)' : 'none',
                                        }}
                                    >
                                        <div style={{ fontSize: '24px', marginBottom: '4px' }}>{card.icon}</div>
                                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#111827' }}>{card.label}</div>
                                        <div style={{
                                            fontSize: '11px',
                                            color: formData[card.key] ? '#d97706' : '#9ca3af',
                                            fontWeight: '600',
                                            marginTop: '4px',
                                        }}>
                                            H = {card.score}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Live H_score display */}
                            {(() => {
                                let hs = 0;
                                if (formData.heredity_both_parents || (formData.heredity_father && formData.heredity_mother)) hs = 1.0;
                                else {
                                    if (formData.heredity_father) hs += 0.5;
                                    if (formData.heredity_mother) hs += 0.5;
                                    if (formData.heredity_sibling) hs += 0.3;
                                    if (formData.heredity_grandparent) hs += 0.15;
                                }
                                hs = Math.min(hs, 1.0);
                                const drH = (hs * 25).toFixed(1);
                                return (
                                    <div style={{
                                        marginTop: '14px',
                                        padding: '10px 16px',
                                        background: '#fffbeb',
                                        borderRadius: '8px',
                                        border: '1px solid #fde68a',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                    }}>
                                        <span style={{ color: '#92400e' }}>H_score = {hs.toFixed(2)}</span>
                                        <span style={{ color: '#b45309' }}>ΔR_Heredity = {drH}%</span>
                                    </div>
                                );
                            })()}
                        </Section>

                        {/* Activity / MET Section (WCRS Section E) */}
                        <Section
                            title="🏃 Physical Activity (MET)"
                            icon=""
                            isOpen={activityOpen}
                            toggle={() => setActivityOpen(!activityOpen)}
                            accentColor="#06b6d4"
                        >
                            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
                                Activity is a <strong>multiplier</strong> on your composite risk. 150 min/week of moderate activity (600 MET-min) = 30% risk reduction.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ display: 'block', color: '#4b5563', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Activity Type (METs)</label>
                                    <select
                                        name="met_value"
                                        value={formData.met_value}
                                        onChange={handleChange}
                                        style={{
                                            width: '100%', padding: '10px 14px', background: '#ffffff',
                                            border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827',
                                            fontSize: '14px', fontWeight: '500', outline: 'none', cursor: 'pointer',
                                        }}
                                    >
                                        <option value="2">Light walk (2 METs)</option>
                                        <option value="3.5">Brisk walk (3.5 METs)</option>
                                        <option value="4">Moderate (4 METs)</option>
                                        <option value="6">Vigorous (6 METs)</option>
                                        <option value="8">Running (8 METs)</option>
                                    </select>
                                </div>
                                <NumberField label="Minutes / Day" name="activity_minutes" value={formData.activity_minutes} onChange={handleChange} step={5} />
                                <NumberField label="Days / Week" name="activity_days" value={formData.activity_days} onChange={handleChange} step={1} />
                            </div>
                            {/* Live MET-weekly & modifier display */}
                            {(() => {
                                const metW = parseFloat(formData.met_value) * parseFloat(formData.activity_minutes) * parseFloat(formData.activity_days);
                                let mod = 1.0 - (0.30 * (metW - 600) / 600);
                                mod = Math.max(0.5, Math.min(1.2, mod));
                                const modColor = mod > 1.0 ? '#dc2626' : mod < 1.0 ? '#16a34a' : '#6b7280';
                                return (
                                    <div style={{
                                        marginTop: '4px',
                                        padding: '10px 16px',
                                        background: mod <= 1.0 ? '#ecfdf5' : '#fef2f2',
                                        borderRadius: '8px',
                                        border: `1px solid ${mod <= 1.0 ? '#a7f3d0' : '#fecaca'}`,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                    }}>
                                        <span style={{ color: '#065f46' }}>MET-min/week = {metW.toFixed(0)}</span>
                                        <span style={{ color: modColor }}>Activity Modifier = {mod.toFixed(3)}</span>
                                    </div>
                                );
                            })()}
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
                    <div className="animate-fade-in-up">
                        <WCRSDashboard 
                            predictionResult={predictionResult} 
                            formData={formData} 
                            realData={realData} 
                            user={user}
                            onBack={() => { setStep(1); setPredictionResult(null); }} 
                            onBookAppointment={() => navigate('/patient/appointments')}
                        />
                        
                        {/* Quick Appointment Booking */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: '16px',
                            padding: '32px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                            marginTop: '24px',
                            width: '100%',
                            maxWidth: '100%',
                            margin: '24px auto',
                        }}>
                                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
                                    Schedule Specialist Consultation
                                </h3>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Select Doctor</label>
                                        <select 
                                            value={selectedDoctor} 
                                            onChange={(e) => setSelectedDoctor(e.target.value)}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
                                        >
                                            <option value="">Choose a doctor</option>
                                            {doctors.map(doc => (
                                                <option key={doc.id} value={doc.id}>Dr. {doc.name} - {doc.specialization}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Date</label>
                                        <input 
                                            type="date"
                                            value={bookingDate}
                                            onChange={(e) => setBookingDate(e.target.value)}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Time</label>
                                        <input 
                                            type="time"
                                            value={bookingTime}
                                            onChange={(e) => setBookingTime(e.target.value)}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                                    <button
                                        onClick={handleBookAppointment}
                                        disabled={!selectedDoctor || !bookingDate || !bookingTime}
                                        style={{
                                            padding: '12px 24px',
                                            background: (!selectedDoctor || !bookingDate || !bookingTime) ? '#d1d5db' : '#ef4444',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                            cursor: (!selectedDoctor || !bookingDate || !bookingTime) ? 'not-allowed' : 'pointer',
                                            transition: '0.2s all'
                                        }}
                                    >
                                        Confirm Appointment
                                    </button>
                                </div>
                            </div>
                    </div>
                )}
            </div>
        </div>
    );
}