import React, { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../context/userContext';
import Navbar from '../../components/navbar';
import WCRSDashboard from '../../components/WCRSDashboard';
import { Flame, Zap, ChevronDown, ChevronRight, Moon, Sun } from 'lucide-react';
import { toast } from 'react-toastify';

/* ─────────────────── colour tokens ─────────────────── */
const themes = {
  dark: {
    bg: '#0f1117',
    surface: '#1a1d27',
    card: '#20242f',
    border: '#2e3347',
    borderHover: '#4a5080',
    text: '#e8eaf0',
    textSec: '#8b90a7',
    textMuted: '#555b78',
    accent: '#4f8ef7',
    accentDim: '#1e2d4a',
    green: '#22c55e',
    greenDim: '#0d2d1e',
    amber: '#f59e0b',
    amberDim: '#2d1f00',
    red: '#ef4444',
    redDim: '#2d0e0e',
    purple: '#a855f7',
    purpleDim: '#1e0d2e',
    cyan: '#06b6d4',
    cyanDim: '#0a1f26',
  },
  light: {
    bg: '#f9fafb',        
    surface: '#f3f4f6',   
    card: '#ffffff',      
    border: '#e5e7eb',
    borderHover: '#d1d5db',
    text: '#111827',
    textSec: '#4b5563',
    textMuted: '#9ca3af',
    accent: '#3b82f6',
    accentDim: '#eff6ff',
    green: '#16a34a',
    greenDim: '#dcffe4',
    amber: '#d97706',
    amberDim: '#fffbeb',
    red: '#ef4444',
    redDim: '#fef2f2',
    purple: '#9333ea',
    purpleDim: '#faf5ff',
    cyan: '#0891b2',
    cyanDim: '#ecfeff',
  }
};

const ThemeContext = createContext(themes.light);

/* ─────────────────── tiny components ─────────────────── */
const SectionBadge = ({ label, color }) => {
  return (
    <span style={{
      padding: '2px 10px', borderRadius: '20px', fontSize: '11px',
      fontWeight: '700', background: color + '22', color,
      border: `1px solid ${color}44`,
    }}>{label}</span>
  )
};

const FieldLabel = ({ children, hint }) => {
  const T = useContext(ThemeContext);
  return (
    <div style={{ marginBottom: '6px' }}>
      <label style={{ fontSize: '12px', fontWeight: '600', color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {children}
      </label>
      {hint && <div style={{ fontSize: '10px', color: T.textMuted, marginTop: '2px' }}>{hint}</div>}
    </div>
  );
};

const TextInput = ({ name, value, onChange, placeholder, type = 'text', readOnly }) => {
  const T = useContext(ThemeContext);
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      style={{
        width: '100%', padding: '10px 14px', background: readOnly ? T.surface : T.card,
        border: `1px solid ${T.border}`, borderRadius: '8px', color: readOnly ? T.textSec : T.text,
        fontSize: '14px', outline: 'none', boxSizing: 'border-box',
        transition: 'border-color 0.2s',
      }}
      onFocus={e => { if (!readOnly) e.target.style.borderColor = T.accent; }}
      onBlur={e => e.target.style.borderColor = T.border}
    />
  );
};

const NumInput = ({ name, value, onChange, min, max, step = 1 }) => {
  const T = useContext(ThemeContext);
  return (
    <input
      type="number"
      name={name}
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
      style={{
        width: '100%', padding: '10px 14px', background: T.card,
        border: `1px solid ${T.border}`, borderRadius: '8px', color: T.text,
        fontSize: '14px', outline: 'none', boxSizing: 'border-box',
      }}
      onFocus={e => e.target.style.borderColor = T.accent}
      onBlur={e => e.target.style.borderColor = T.border}
    />
  );
};

const SelectInput = ({ name, value, onChange, options }) => {
  const T = useContext(ThemeContext);
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      style={{
        width: '100%', padding: '10px 14px', background: T.card,
        border: `1px solid ${T.border}`, borderRadius: '8px', color: T.text,
        fontSize: '14px', outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
      }}
      onFocus={e => e.target.style.borderColor = T.accent}
      onBlur={e => e.target.style.borderColor = T.border}
    >
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o} style={{ background: T.card }}>{o.label ?? o}</option>)}
    </select>
  );
};

/* collapsible section shell */
const AccordionSection = ({ letter, title, badge, badgeColor, isOpen, toggle, children }) => {
  const T = useContext(ThemeContext);
  return (
    <div style={{
      marginBottom: '12px', borderRadius: '12px', overflow: 'hidden',
      border: `1px solid ${isOpen ? T.borderHover : T.border}`,
      background: T.card, transition: 'border-color 0.2s',
    }}>
      <button type="button" onClick={toggle} style={{
        width: '100%', padding: '14px 20px', display: 'flex', alignItems: 'center',
        gap: '12px', background: 'transparent', border: 'none', cursor: 'pointer',
        color: T.text, fontSize: '14px', fontWeight: '700',
      }}>
        <span style={{
          width: '28px', height: '28px', borderRadius: '50%', background: T.accentDim,
          border: `1.5px solid ${T.accent}`, color: T.accent, fontWeight: '800',
          fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{letter}</span>
        <span style={{ flex: 1, textAlign: 'left' }}>{title}</span>
        {badge && <SectionBadge label={badge} color={badgeColor || T.accent} />}
        {isOpen ? <ChevronDown size={16} color={T.textSec} /> : <ChevronRight size={16} color={T.textSec} />}
      </button>
      <div style={{
        maxHeight: isOpen ? '1200px' : '0', overflow: 'hidden',
        transition: 'max-height 0.4s ease',
      }}>
        <div style={{ padding: '0 20px 20px' }}>{children}</div>
      </div>
    </div>
  );
};

/* divider */
const Divider = () => {
  const T = useContext(ThemeContext);
  return <div style={{ height: '1px', background: T.border, margin: '16px 0' }} />;
};

/* ─────────────────── main component ─────────────────── */
export default function PatientOnboarding() {
  const navigate = useNavigate();
  const { user } = useUserContext();

  const [isDark, setIsDark] = useState(false); // Default to light mode (matches project)
  const T = isDark ? themes.dark : themes.light;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);

  /* section open states */
  const [openA, setOpenA] = useState(true);
  const [openB, setOpenB] = useState(true);
  const [openC, setOpenC] = useState(true);
  const [openD, setOpenD] = useState(true);
  const [openE, setOpenE] = useState(true);

  /* doctor booking */
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');

  const [formData, setFormData] = useState({
    patientId: '', fullName: '', dob: '', age: '', gender: 'Male', ethnicity: 'Select',
    systolic_bp: '120', diastolic_bp: '80', spo2: '98', pulse_rate: '72', temperature: '36.6', acetone: '0.5', glucose: '100',
    weight: '70', height: '170',
    heredity_both_parents: false, heredity_father: false, heredity_mother: false, heredity_sibling: false,
    heredity_paternal_grandparent: false, heredity_maternal_grandparent: false, heredity_aunt_uncle: false, heredity_none: false,
    activity_type: '7', activity_minutes: '30', activity_days: '3',
    hypertensive: 'No', cardiovascular_disease: 'No', family_diabetes: 'No', stroke: 'No', prev_diagnosis: 'No',
  });

  const heightM = parseFloat(formData.height) / 100;
  const bmi = heightM > 0 ? (parseFloat(formData.weight) / (heightM * heightM)).toFixed(1) : '--';
  const bmiColor = parseFloat(bmi) >= 30 ? T.red : parseFloat(bmi) >= 25 ? T.amber : T.green;

  const map = ((parseFloat(formData.systolic_bp) + 2 * parseFloat(formData.diastolic_bp)) / 3).toFixed(1);

  const calcHScore = () => {
    if (formData.heredity_none) return 0;
    if (formData.heredity_both_parents || (formData.heredity_father && formData.heredity_mother)) return 1.0;
    let h = 0;
    if (formData.heredity_father) h += 0.5;
    if (formData.heredity_mother) h += 0.5;
    if (formData.heredity_sibling) h += 0.3;
    if (formData.heredity_paternal_grandparent) h += 0.15;
    if (formData.heredity_maternal_grandparent) h += 0.15;
    if (formData.heredity_aunt_uncle) h += 0.10;
    return Math.min(h, 1.0);
  };
  const hScore = calcHScore();
  const drHeredity = (hScore * 25).toFixed(1);

  const metWeekly = parseFloat(formData.activity_type) * parseFloat(formData.activity_minutes) * parseFloat(formData.activity_days);
  const actMod = Math.max(0.5, Math.min(1.2, 1.0 - (0.30 * (metWeekly - 600) / 600)));
  const actModColor = actMod < 1.0 ? T.green : actMod > 1.0 ? T.red : T.textSec;

  useEffect(() => {
    if (formData.dob) {
      const d = new Date(formData.dob);
      const age = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
      setFormData(p => ({ ...p, age: String(age) }));
    }
  }, [formData.dob]);

  useEffect(() => { fetchDoctors(); }, []);
  const fetchDoctors = async () => {
    try {
      const r = await fetch('http://localhost:8080/api/admin/doctors');
      const d = await r.json();
      if (d.success) setDoctors(d.data);
    } catch { }
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleHeredity = key => {
    setFormData(p => {
      const next = { ...p, [key]: !p[key] };
      if (key === 'heredity_none' && next.heredity_none) {
        ['heredity_both_parents','heredity_father','heredity_mother','heredity_sibling',
         'heredity_paternal_grandparent','heredity_maternal_grandparent','heredity_aunt_uncle']
          .forEach(k => next[k] = false);
      } else if (key !== 'heredity_none') {
        next.heredity_none = false;
      }
      return next;
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, bmi, h_score: hScore, met_weekly: metWeekly };
      const res = await fetch('http://localhost:8080/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) { setPredictionResult(data); setStep(2); }
      else toast.error(data.message || 'Prediction failed');
    } catch { toast.error('Failed to connect to server'); }
    finally { setLoading(false); }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !bookingDate || !bookingTime) {
      toast.error('Please select a doctor, date, and time');
      return;
    }
    try {
      setLoading(true);
      let patientId = user?.uid || user?.id;
      if (!patientId) {
        try { const s = JSON.parse(localStorage.getItem('user')); patientId = s?.uid || s?.id; } catch { }
      }
      const res = await fetch('http://localhost:8080/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: patientId || 'guest', doctorId: selectedDoctor, date: new Date(`${bookingDate}T${bookingTime}`).toISOString(), notes: 'Diabetes Risk Assessment' }),
      });
      const data = await res.json();
      if (data.success) { toast.success('Appointment booked!'); navigate('/patient/appointments'); }
      else toast.error('Failed to book appointment');
    } catch { toast.error('Booking failed'); }
    finally { setLoading(false); }
  };

  const heredityCards = [
    { key: 'heredity_father', label: 'Father has/had T2D', sub: 'Biological father', score: '+0.50', icon: '👨' },
    { key: 'heredity_mother', label: 'Mother has/had T2D', sub: 'Biological mother', score: '+0.50', icon: '👩' },
    { key: 'heredity_both_parents', label: 'Both Parents T2D', sub: 'H_score capped at 1.0', score: '1.00 (max)', icon: '👨‍👩‍👦' },
    { key: 'heredity_sibling', label: 'Sibling has/had T2D', sub: 'Full biological sibling', score: '+0.30', icon: '🧑‍🤝‍🧑' },
    { key: 'heredity_paternal_grandparent', label: 'Paternal Grandparent', sub: "Father's parent", score: '+0.15', icon: '👴' },
    { key: 'heredity_maternal_grandparent', label: 'Maternal Grandparent', sub: "Mother's parent", score: '+0.15', icon: '👵' },
    { key: 'heredity_aunt_uncle', label: 'Aunt / Uncle', sub: 'First-degree relative', score: '+0.10', icon: '🧑' },
    { key: 'heredity_none', label: 'No Known History', sub: 'No diabetic relatives', score: '0.00', icon: '✅' },
  ];

  const activityTypes = [
    { value: '2', label: 'Light walk (2 METs)' },
    { value: '3.5', label: 'Brisk walk (3.5 METs)' },
    { value: '4', label: 'Cycling moderate (4 METs)' },
    { value: '5', label: 'Swimming (5 METs)' },
    { value: '7', label: 'Jogging (7 METs)' },
    { value: '8', label: 'Running (8 METs)' },
    { value: '10', label: 'Vigorous sport (10 METs)' },
  ];

  return (
    <ThemeContext.Provider value={T}>
      <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", transition: 'background-color 0.3s, color 0.3s' }}>
        
        {/* We can place the theme toggler near the Navbar dynamically without modifying Navbar component itself for now */}
        <div style={{ position: 'relative' }}>
          <Navbar />
          <div style={{ position: 'absolute', top: '12px', right: '160px', zIndex: 10 }}> 
            <button
              onClick={() => setIsDark(!isDark)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 12px', borderRadius: '20px',
                background: isDark ? '#374151' : '#f3f4f6', 
                border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                color: isDark ? '#f9fafb' : '#111827',
                cursor: 'pointer', outline: 'none',
                fontWeight: '600', fontSize: '13px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          .fadeUp { animation: fadeUp 0.4s ease-out; }
          input::-webkit-inner-spin-button { opacity: 0.5; }
          input[type=number] { -moz-appearance: textfield; }
          select option { background: ${T.card}; }
          ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
        `}</style>

        {/* ── Header ── */}
        <div style={{ maxWidth: step === 1 ? '860px' : '100%', margin: '0 auto', padding: '24px 20px 0' }}>
          <div style={{
            background: T.card, borderRadius: '14px', padding: '20px 24px', marginBottom: '20px',
            border: `1px solid ${T.border}`,
            backgroundImage: isDark ? 'linear-gradient(135deg, #20242f 0%, #1a1d27 100%)' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <Flame size={24} color={T.red} />
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: T.text, margin: 0 }}>
                Diabetes Risk Prediction
              </h1>
            </div>
            <p style={{ color: T.textSec, fontSize: '13px', margin: '0 0 0 34px' }}>
              WCRS — Weighted Composite Risk Scoring · Clinical data entry
            </p>
          </div>

          {/* progress */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
            {[1,2].map((s, i) => (
              <React.Fragment key={s}>
                {i > 0 && (
                  <div style={{ width: '48px', height: '2px', borderRadius: '2px', background: step >= s ? T.accent : T.border, transition: 'background 0.3s' }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: step >= s ? T.accent : T.textMuted }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', border: `2px solid ${step >= s ? T.accent : T.border}`,
                    background: step >= s ? T.accentDim : 'transparent', fontWeight: '700', fontSize: '13px',
                  }}>{s}</div>
                  <span style={{ fontWeight: '600', fontSize: '13px' }}>{s === 1 ? 'Health Data' : 'Results & Analysis'}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ════════════════ STEP 1 ════════════════ */}
        {step === 1 && (
          <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 20px 40px' }} className="fadeUp">
            <form onSubmit={handleSubmit}>

              {/* ── Section A: Patient Demographics ── */}
              <AccordionSection
                letter="A" title="Patient Demographics" badge="One-time entry" badgeColor={T.accent}
                isOpen={openA} toggle={() => setOpenA(p => !p)}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div>
                    <FieldLabel>Patient ID / MR Number</FieldLabel>
                    <TextInput name="patientId" value={formData.patientId} onChange={handleChange} placeholder="e.g. PT-2024-001" />
                  </div>
                  <div>
                    <FieldLabel>Full Name</FieldLabel>
                    <TextInput name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Last, First" />
                  </div>
                  <div>
                    <FieldLabel>Date of Birth</FieldLabel>
                    <TextInput type="date" name="dob" value={formData.dob} onChange={handleChange} />
                  </div>
                  <div>
                    <FieldLabel hint="Auto-computed from DOB">Age (years)</FieldLabel>
                    <TextInput name="age" value={formData.age} onChange={handleChange} placeholder="years" readOnly={!!formData.dob} />
                  </div>
                  <div>
                    <FieldLabel hint="Used in: ML model input">Sex assigned at birth</FieldLabel>
                    <SelectInput name="gender" value={formData.gender} onChange={handleChange}
                      options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }]} />
                  </div>
                  <div>
                    <FieldLabel hint="Used in: ML model input (risk modifier)">Ethnicity</FieldLabel>
                    <SelectInput name="ethnicity" value={formData.ethnicity} onChange={handleChange}
                      options={['Select','Asian','South Asian','African','Caucasian','Hispanic','Middle Eastern','Other']} />
                  </div>
                </div>
              </AccordionSection>

              {/* ── Section B: Clinical Vitals (manual) ── */}
              <AccordionSection
                letter="B" title="Clinical Vitals — Manual Entry" badge="Manual entry" badgeColor={T.cyan}
                isOpen={openB} toggle={() => setOpenB(p => !p)}
              >
                {/* BP row */}
                <div style={{ marginBottom: '16px', padding: '14px', background: T.surface, borderRadius: '10px', border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: T.accent, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                    Blood Pressure → ΔR_BP Formula
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', alignItems: 'end' }}>
                    <div>
                      <FieldLabel hint="→ ΔR_BP formula">Systolic BP (SBP) mmHg</FieldLabel>
                      <NumInput name="systolic_bp" value={formData.systolic_bp} onChange={handleChange} min={60} max={250} />
                    </div>
                    <div>
                      <FieldLabel hint="→ ΔR_BP formula">Diastolic BP (DBP) mmHg</FieldLabel>
                      <NumInput name="diastolic_bp" value={formData.diastolic_bp} onChange={handleChange} min={40} max={150} />
                    </div>
                    <div>
                      <FieldLabel hint="= (SBP + 2×DBP) / 3">Mean Arterial Pressure (MAP)</FieldLabel>
                      <div style={{
                        padding: '10px 14px', background: T.bg, borderRadius: '8px',
                        border: `1px solid ${parseFloat(map) >= 100 ? T.amber : T.border}`,
                        fontSize: '15px', fontWeight: '700',
                        color: parseFloat(map) >= 100 ? T.amber : T.textSec,
                      }}>
                        {map} <span style={{ fontSize: '11px', fontWeight: '400' }}>mmHg</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', padding: '7px 12px', background: T.bg, borderRadius: '7px', fontFamily: 'monospace', fontSize: '11px', color: T.textMuted }}>
                    MAP = (SBP + 2×DBP) / 3 &nbsp;|&nbsp; ΔR_BP(%) = [(MAP − 93.3) / 93.3] × 35
                  </div>
                </div>

                {/* Other vitals */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px' }}>
                  <div>
                    <FieldLabel hint="→ ML model input">SpO₂ — Oxygen Sat. (%)</FieldLabel>
                    <NumInput name="spo2" value={formData.spo2} onChange={handleChange} min={70} max={100} />
                  </div>
                  <div>
                    <FieldLabel hint="→ ML model input">Heart Rate (bpm)</FieldLabel>
                    <NumInput name="pulse_rate" value={formData.pulse_rate} onChange={handleChange} min={30} max={220} />
                  </div>
                  <div>
                    <FieldLabel hint="→ ML model input">Body Temperature (°C)</FieldLabel>
                    <NumInput name="temperature" value={formData.temperature} onChange={handleChange} min={34} max={42} step={0.1} />
                  </div>
                  <div>
                    <FieldLabel hint="Breath acetone — diabetes marker">Breath Acetone / VOC (ppm)</FieldLabel>
                    <NumInput name="acetone" value={formData.acetone} onChange={handleChange} min={0} max={20} step={0.1} />
                  </div>
                </div>

                {/* Glucose */}
                <div style={{ marginTop: '14px' }}>
                  <FieldLabel hint="Fasting plasma glucose → ML model input">Glucose (mg/dL)</FieldLabel>
                  <NumInput name="glucose" value={formData.glucose} onChange={handleChange} min={40} max={600} />
                </div>

                {/* History flags */}
                <Divider />
                <div style={{ fontSize: '11px', fontWeight: '700', color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  Medical History Flags
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                  {[
                    { name: 'hypertensive', label: 'Hypertension' },
                    { name: 'cardiovascular_disease', label: 'Heart Condition' },
                    { name: 'family_diabetes', label: 'Family Diabetes' },
                    { name: 'stroke', label: 'Stroke History' },
                    { name: 'prev_diagnosis', label: 'Prior Diabetes Dx' },
                  ].map(f => (
                    <div key={f.name}>
                      <FieldLabel>{f.label}</FieldLabel>
                      <SelectInput name={f.name} value={formData[f.name]} onChange={handleChange}
                        options={[{ value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes — confirmed' }]} />
                    </div>
                  ))}
                </div>
              </AccordionSection>

              {/* ── Section C: Anthropometric ── */}
              <AccordionSection
                letter="C" title="Anthropometric Inputs — Weight & Height" badge="Manual entry" badgeColor={T.amber}
                isOpen={openC} toggle={() => setOpenC(p => !p)}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', alignItems: 'end' }}>
                  <div>
                    <FieldLabel hint="→ ΔR_Weight = [(BMI-25)/25] × 40">Weight (kg)</FieldLabel>
                    <NumInput name="weight" value={formData.weight} onChange={handleChange} min={20} max={300} step={0.5} />
                  </div>
                  <div>
                    <FieldLabel hint="→ BMI = weight / height(m)²">Height (cm)</FieldLabel>
                    <NumInput name="height" value={formData.height} onChange={handleChange} min={100} max={250} />
                  </div>
                  <div>
                    <FieldLabel hint="Normal: 18.5–24.9">BMI (auto-computed)</FieldLabel>
                    <div style={{
                      padding: '10px 14px', background: T.bg, borderRadius: '8px',
                      border: `1px solid ${bmiColor}55`,
                      fontSize: '18px', fontWeight: '800', color: bmiColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <span>{bmi}</span>
                      <span style={{ fontSize: '11px', fontWeight: '500', color: T.textMuted }}>
                        {parseFloat(bmi) < 18.5 ? 'Underweight' : parseFloat(bmi) < 25 ? 'Normal' : parseFloat(bmi) < 30 ? 'Overweight' : 'Obese'}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '10px', padding: '7px 12px', background: T.surface, borderRadius: '7px', fontFamily: 'monospace', fontSize: '11px', color: T.textMuted }}>
                  BMI = weight(kg) / height(m)² &nbsp;|&nbsp; ΔR_Weight(%) = [(BMI − 25) / 25] × 40
                </div>
              </AccordionSection>

              {/* ── Section D: Heredity ── */}
              <AccordionSection
                letter="D" title="Heredity / Family History (T2D)" badge="One-time entry" badgeColor={T.purple}
                isOpen={openD} toggle={() => setOpenD(p => !p)}
              >
                <p style={{ fontSize: '12px', color: T.textSec, marginBottom: '14px', lineHeight: '1.6' }}>
                  Select all relatives diagnosed with Type 2 Diabetes. H_score is capped at 1.0.
                  &nbsp;ΔR_Heredity(%) = H_score × 25
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px' }}>
                  {heredityCards.map(c => (
                    <div key={c.key} onClick={() => toggleHeredity(c.key)} style={{
                      padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                      border: `1.5px solid ${formData[c.key] ? T.purple : T.border}`,
                      background: formData[c.key] ? T.purpleDim : T.surface,
                      display: 'flex', alignItems: 'center', gap: '12px',
                      transition: 'all 0.2s',
                    }}>
                      <span style={{ fontSize: '24px', flexShrink: 0 }}>{c.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: formData[c.key] ? T.text : T.textSec }}>{c.label}</div>
                        <div style={{ fontSize: '11px', color: T.textMuted, marginTop: '1px' }}>{c.sub}</div>
                      </div>
                      <div style={{
                        fontWeight: '700', fontSize: '12px', flexShrink: 0,
                        color: formData[c.key] ? T.purple : T.textMuted,
                        fontFamily: 'monospace',
                      }}>H {c.score}</div>
                    </div>
                  ))}
                </div>

                {/* live H_score bar */}
                <div style={{ marginTop: '14px', padding: '12px 14px', background: T.surface, borderRadius: '10px', border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                    <span style={{ color: T.textSec }}>H_score (Σ, capped at 1.0)</span>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <span style={{ fontWeight: '700', color: T.purple }}>{hScore.toFixed(2)}</span>
                      <span style={{ color: T.textMuted }}>→</span>
                      <span style={{ fontWeight: '700', color: hScore > 0 ? T.purple : T.textMuted }}>ΔR_Heredity = +{drHeredity}%</span>
                    </div>
                  </div>
                  <div style={{ height: '6px', background: T.border, borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${hScore * 100}%`, height: '100%', background: T.purple, borderRadius: '3px', transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ marginTop: '8px', fontFamily: 'monospace', fontSize: '10px', color: T.textMuted }}>
                    H_score = Σ(family weights), capped at 1.0 &nbsp;|&nbsp; ΔR_Heredity(%) = H_score × 25
                  </div>
                </div>
              </AccordionSection>

              {/* ── Section E: Physical Activity ── */}
              <AccordionSection
                letter="E" title="Physical Activity — MET-based" badge="Manual entry" badgeColor={T.green}
                isOpen={openE} toggle={() => setOpenE(p => !p)}
              >
                <p style={{ fontSize: '12px', color: T.textSec, marginBottom: '14px', lineHeight: '1.6' }}>
                  Activity is a <strong style={{ color: T.text }}>multiplier</strong> on composite risk.
                  &nbsp;150 min/week of moderate activity (600 MET-min) = 30% risk reduction.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                  <div>
                    <FieldLabel hint="MET value determines intensity">Activity Type</FieldLabel>
                    <SelectInput name="activity_type" value={formData.activity_type} onChange={handleChange} options={activityTypes} />
                  </div>
                  <div>
                    <FieldLabel hint="Per session">Minutes / Day</FieldLabel>
                    <NumInput name="activity_minutes" value={formData.activity_minutes} onChange={handleChange} min={0} max={300} step={5} />
                  </div>
                  <div>
                    <FieldLabel hint="Per week">Days / Week</FieldLabel>
                    <NumInput name="activity_days" value={formData.activity_days} onChange={handleChange} min={0} max={7} />
                  </div>
                </div>

                {/* live MET output */}
                <div style={{ padding: '12px 14px', background: T.surface, borderRadius: '10px', border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                    <span style={{ color: T.textSec }}>MET-min / week</span>
                    <span style={{ fontWeight: '700', color: T.text, fontFamily: 'monospace' }}>{metWeekly.toFixed(0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '10px' }}>
                    <span style={{ color: T.textSec }}>Activity Modifier</span>
                    <span style={{ fontWeight: '800', color: actModColor, fontFamily: 'monospace' }}>{actMod.toFixed(3)}×</span>
                  </div>
                  <div style={{ height: '6px', background: T.border, borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{
                      width: `${Math.min(100, (metWeekly / 1200) * 100)}%`,
                      height: '100%', background: actMod <= 1.0 ? T.green : T.amber,
                      borderRadius: '3px', transition: 'width 0.3s',
                    }} />
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: T.textMuted, lineHeight: '1.6' }}>
                    MET_weekly = METs × min/day × days/week &nbsp;|&nbsp; Modifier = 1 − [0.30 × (MET_w − 600) / 600] (clamp 0.5–1.2)
                  </div>
                </div>
              </AccordionSection>

              {/* submit */}
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '16px', borderRadius: '12px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? T.border : 'linear-gradient(135deg, #4f8ef7 0%, #7c3aed 100%)',
                color: '#fff', fontSize: '15px', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(79,142,247,0.35)',
                transition: 'all 0.3s', marginTop: '8px',
              }}>
                <Zap size={18} />
                {loading ? 'Analyzing...' : 'Analyze Risk with WCRS'}
              </button>
            </form>

            {/* AI float btn */}
            <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50 }}>
              <button type="button" onClick={() => window.open('http://localhost:5173', '_blank')} style={{
                padding: '11px 18px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: '600',
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(79,70,229,0.4)',
              }}>🤖 AI Assistance</button>
            </div>
          </div>
        )}

        {/* ════════════════ STEP 2 ════════════════ */}
        {step === 2 && predictionResult && (
          <div style={{ padding: '0 24px 40px' }} className="fadeUp">
            <WCRSDashboard
              predictionResult={predictionResult}
              formData={formData}
              user={user}
              onBack={() => { setStep(1); setPredictionResult(null); }}
              onBookAppointment={() => navigate('/patient/appointments')}
              isDark={isDark} // Pass the theme state so WCRSDashboard matches
            />

            {/* Appointment booking */}
            <div style={{
              maxWidth: '900px', margin: '20px auto 0',
              background: T.card, borderRadius: '14px', padding: '28px',
              border: `1px solid ${T.border}`,
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: T.text, marginBottom: '18px' }}>
                📅 Schedule Specialist Consultation
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <FieldLabel>Select Doctor</FieldLabel>
                  <SelectInput
                    name="doctor"
                    value={selectedDoctor}
                    onChange={e => setSelectedDoctor(e.target.value)}
                    options={[{ value: '', label: 'Choose a doctor' }, ...doctors.map(d => ({ value: d.id, label: `Dr. ${d.name} — ${d.specialization}` }))]}
                  />
                </div>
                <div>
                  <FieldLabel>Date</FieldLabel>
                  <TextInput type="date" name="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Time</FieldLabel>
                  <TextInput type="time" name="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  onClick={handleBookAppointment}
                  disabled={!selectedDoctor || !bookingDate || !bookingTime}
                  style={{
                    padding: '12px 28px', borderRadius: '10px', border: 'none',
                    background: (!selectedDoctor || !bookingDate || !bookingTime) ? T.border : T.red,
                    color: '#fff', fontWeight: '700', fontSize: '14px',
                    cursor: (!selectedDoctor || !bookingDate || !bookingTime) ? 'not-allowed' : 'pointer',
                  }}
                >
                  Confirm Appointment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ThemeContext.Provider>
  );
}