import streamlit as st
import pandas as pd
import sqlite3
import firebase_admin
from firebase_admin import credentials, db
from datetime import datetime, timedelta
import joblib
import numpy as np

# --- 1. SCALER: Standard + Robust ---


class SmartScaler:
    def __init__(self):
        self.std_stats = {
            'age': {'mean': 33.24, 'std': 11.76},
            'gender': {'mean': 0.5, 'std': 0.5},
            'pulse_rate': {'mean': 72.0, 'std': 12.0},
            'systolic_bp': {'mean': 120.0, 'std': 15.0},
            'diastolic_bp': {'mean': 69.10, 'std': 19.35},
            'glucose': {'mean': 120.89, 'std': 31.97},
            'height': {'mean': 165.0, 'std': 10.0},
            'weight': {'mean': 70.0, 'std': 15.0},
            'bmi': {'mean': 31.99, 'std': 7.88},
            'family_diabetes': {'mean': 0.5, 'std': 0.5},
            'hypertensive': {'mean': 0.5, 'std': 0.5},
            'family_hypertension': {'mean': 0.5, 'std': 0.5},
            'cardiovascular_disease': {'mean': 0.5, 'std': 0.5},
            'stroke': {'mean': 0.5, 'std': 0.5}
        }
        self.robust_stats = {'median': 0.0, 'iqr': 1.35}

    def transform(self, input_df):
        scaled_df = input_df.copy()
        for col in scaled_df.columns:
            key = col.lower()
            if key in self.std_stats:
                # Standard Scale (Z-Score)
                mean = self.std_stats[key]['mean']
                std = self.std_stats[key]['std']
                val = (scaled_df[col] - mean) / std
                # Robust Scale (IQR)
                val = (val - self.robust_stats['median']
                       ) / self.robust_stats['iqr']
                scaled_df[col] = val
        return scaled_df


# --- Firebase Setup ---
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate('serviceAccountKey.json')
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://smart-care-f0ae2-default-rtdb.asia-southeast1.firebasedatabase.app/'
        })
    except Exception:
        pass

db_ref = db.reference()
doctors_ref = db_ref.child('doctors')
doctors = doctors_ref.get()
DOCTORS = [doc['name'] for doc in doctors.values()] if doctors else [
    "Dr. Smith", "Dr. Jones"]

# --- Fetch Real-time Sensor Data ---
sensor_values = {
    'age': 30.0, 'height': 170.0, 'weight': 70.0, 'glucose': 100.0,
    'heartRate': 72.0, 'acetone': 0.0, 'systolic': 120.0, 'diastolic': 80.0,
    'spo2': 98.0, 'temperature': 36.5, 'activity': 0.0
}
try:
    data = db_ref.child('sensor').get()
    if data:
        flat_data = data if all(isinstance(v, (int, float, str))
                                for v in data.values()) else next(iter(data.values()))
        if isinstance(flat_data, dict):
            sensor_values.update(flat_data)
except:
    pass


def get_safe_val(key, default, min_limit, max_limit):
    val = sensor_values.get(key, default)
    try:
        val = float(val)
        if val < min_limit or val > max_limit:
            return float(default)
        return val
    except:
        return float(default)


def get_google_meet_link(): return "https://meet.google.com/new"


# --- UI Setup ---
st.set_page_config(page_title="HealthGuard AI", layout="wide", page_icon="🩺")
st.markdown("""
<style>
    .stButton>button { background: linear-gradient(90deg, #4CAF50, #45a049); color: white; font-weight: bold; border-radius: 8px; }
    .result-card { padding: 20px; border-radius: 15px; margin-top: 20px; }
</style>
""", unsafe_allow_html=True)

st.markdown("""
<div style="background: linear-gradient(45deg, #e3f2fd, #f5f5f5); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
    <h2 style="color: #2b5876; margin:0;">🩸 Diabetes Risk Prediction</h2>
    <p style="margin:0; color: #555;">AI-Powered Real-time Risk Assessment</p>
</div>
""", unsafe_allow_html=True)

# --- Input Form ---
with st.expander("📝 Patient Data", expanded=True):
    c1, c2 = st.columns(2)
    with c1:
        Gender = st.selectbox("Gender", ["Male", "Female"])
        Age = st.number_input(
            "Age", 1.0, 120.0, get_safe_val('age', 30.0, 1.0, 120.0))
        Height = st.number_input(
            "Height (cm)", 50.0, 250.0, get_safe_val('height', 170.0, 50.0, 250.0))
    with c2:
        Weight = st.number_input(
            "Weight (kg)", 10.0, 300.0, get_safe_val('weight', 70.0, 10.0, 300.0))
        Glucose = st.number_input(
            "Glucose (mg/dL)", 50.0, 500.0, get_safe_val('glucose', 100.0, 50.0, 500.0))
        BMI = Weight/((Height/100)**2)
        st.number_input("BMI", value=float(BMI), disabled=True, format="%.1f")

with st.expander("💓 Vitals (Live)", expanded=True):
    c1, c2, c3 = st.columns(3)
    Pulse = c1.number_input("Pulse", 30.0, 220.0, get_safe_val(
        'heartRate', 72.0, 30.0, 220.0))
    Systolic = c2.number_input(
        "Systolic", 70.0, 250.0, get_safe_val('systolic', 120.0, 70.0, 250.0))
    Diastolic = c3.number_input(
        "Diastolic", 40.0, 150.0, get_safe_val('diastolic', 80.0, 40.0, 150.0))
    Acetone = c1.number_input("Acetone", 0.0, 10.0,
                              get_safe_val('acetone', 0.0, 0.0, 10.0))
    SPO2 = c2.number_input("SPO2 (%)", 70.0, 100.0,
                           get_safe_val('spo2', 98.0, 70.0, 100.0))
    Activity = c3.number_input(
        "Activity", 0.0, 10.0, get_safe_val('activity', 0.0, 0.0, 10.0))

with st.expander("📋 History"):
    c1, c2, c3 = st.columns(3)
    Hist_HT = c1.selectbox("Hypertension", ["No", "Yes"])
    Fam_HT = c1.selectbox("Fam. Hypertension", ["No", "Yes"])
    Heart_Dis = c2.selectbox("Heart Condition", ["No", "Yes"])
    Stroke = c2.selectbox("Stroke", ["No", "Yes"])
    Fam_Dia = c3.selectbox("Fam. Diabetes", ["No", "Yes"])
    Prev_Dia = c3.selectbox("Prev. Diagnosis", ["No", "Yes"])

# --- Logic & Prediction ---
if st.button("🔍 Analyze Risk", use_container_width=True):
    try:
        # 1. Load Model
        model = joblib.load('grid_gbc.pkl')

        # 2. Prepare Inputs (14 Features)
        raw_inputs = {
            'age': Age, 'gender': 1 if Gender == "Male" else 0,
            'pulse_rate': Pulse, 'systolic_bp': Systolic, 'diastolic_bp': Diastolic,
            'glucose': Glucose, 'height': Height, 'weight': Weight, 'bmi': BMI,
            'family_diabetes': 1 if Fam_Dia == "Yes" else 0,
            'hypertensive': 1 if Hist_HT == "Yes" else 0,
            'family_hypertension': 1 if Fam_HT == "Yes" else 0,
            'cardiovascular_disease': 1 if Heart_Dis == "Yes" else 0,
            'stroke': 1 if Stroke == "Yes" else 0
        }

        feature_order = ['age', 'gender', 'pulse_rate', 'systolic_bp', 'diastolic_bp',
                         'glucose', 'height', 'weight', 'bmi', 'family_diabetes',
                         'hypertensive', 'family_hypertension', 'cardiovascular_disease', 'stroke']

        df_14 = pd.DataFrame([raw_inputs])[feature_order]

        # 3. Scale Data
        if hasattr(model, 'steps'):
            input_final = df_14
        else:
            scaler = SmartScaler()
            input_final = scaler.transform(df_14)

        # 4. Predict (14 features)
        prob = model.predict_proba(input_final)[0][1]

        # --- 5. MEDICAL OVERRIDE (Crucial for Safety) ---
        # If ANY of these dangerous markers are present, we force a High Risk warning
        # even if the AI model says otherwise.
        override_reason = []
        if Glucose >= 140:
            override_reason.append("Glucose > 140")
        if Systolic >= 140:
            override_reason.append("Systolic BP > 140")
        if BMI >= 30:
            override_reason.append("BMI > 30 (Obesity)")

        if override_reason:
            # Force probability to be at least 85%
            prob = max(prob, 0.85)
            st.warning(
                f"⚠️ Clinical Alert: High risk detected due to: {', '.join(override_reason)}")

        result = "High risk of diabetes" if prob >= 0.5 else "Low risk of diabetes"

        # Display Result
        color = "#d32f2f" if prob >= 0.5 else "#2e7d32"
        st.markdown(f"""
        <div class="result-card" style="background-color: {color}20; border-left: 8px solid {color};">
            <h3 style="color: {color}; margin:0;">{result}</h3>
            <p style="margin:0;">Probability Score: {prob:.4f}</p>
        </div>
        """, unsafe_allow_html=True)

        if prob >= 0.5:
            doc = st.selectbox("Select Doctor", DOCTORS)
            if doc:
                time_slot = (datetime.now() + timedelta(hours=1)
                             ).strftime("%Y-%m-%d %H:%M")
                conn = sqlite3.connect(
                    'appointments.db', check_same_thread=False)
                c = conn.cursor()
                c.execute("INSERT INTO appointments (patient, doctor, time, notes, status, meet_link) VALUES (?, ?, ?, ?, ?, ?)",
                          ("prachi_shejwal", doc, time_slot, "Auto-High Risk", "Pending", get_google_meet_link()))
                conn.commit()
                conn.close()
                st.success(
                    f"✅ Appointment suggested with {doc} at {time_slot}")

    except Exception as e:
        st.error(f"Error: {str(e)}")

st.markdown('<div style="position:fixed;bottom:20px;right:20px;"><a href="http://localhost:5173" target="_blank"><button style="background:#4CAF50;color:white;padding:10px 20px;border:none;border-radius:5px;">AI Assistance</button></a></div>', unsafe_allow_html=True)
