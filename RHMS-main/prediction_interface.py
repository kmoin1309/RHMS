import streamlit as st
import pandas as pd
import sqlite3
import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
from datetime import datetime, timedelta
import joblib  # For loading the .pkl file

# Initialize Firebase Admin with Realtime Database
if not firebase_admin._apps:
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://smart-care-f0ae2-default-rtdb.asia-southeast1.firebasedatabase.app/'
    })

# Reference to the Realtime Database
db_ref = db.reference()

# Fetch doctors from Realtime Database with fallback
doctors_ref = db_ref.child('doctors')
doctors = doctors_ref.get()
DOCTORS = [doc['name'] for doc in doctors.values()] if doctors else []
if not DOCTORS:
    # st.warning("No doctors available from Realtime Database. Using default list.")
    DOCTORS = ["Dr. Smith", "Dr. Jones"]  # Fallback doctor list

# Fetch and process data from the 'sensor' node
sensor_data_ref = db_ref.child('sensor')
try:
    sensor_data = sensor_data_ref.get()
except Exception as e:
    st.error(f"Failed to fetch sensor data from Firebase: {str(e)}")
    sensor_data = None

sensor_values = {}
if sensor_data is None:
    st.warning(
        "No data found at 'sensor' node or access denied. Using default values.")
    sensor_values = {
        'age': 30.0, 'height': 170.0, 'weight': 70.0, 'glucose': 100.0,
        'heartRate': 72.0, 'acetone': 0.0, 'systolic': 120.0, 'diastolic': 80.0,
        'spo2': 98.0, 'temperature': 36.5, 'activity': 0.0
    }
else:
    if isinstance(sensor_data, dict):
        if all(isinstance(v, (int, float, str)) for v in sensor_data.values()):  # Flat object case
            sensor_values = sensor_data
        else:  # Nested dictionary case, take the first entry
            first_sensor = next(iter(sensor_data.values()), {})
            if isinstance(first_sensor, dict):
                sensor_values = first_sensor
    else:
        st.error("Unexpected data format at 'sensor' node.")
        sensor_values = {
            'age': 30.0, 'height': 170.0, 'weight': 70.0, 'glucose': 100.0,
            'heartRate': 72.0, 'acetone': 0.0, 'systolic': 120.0, 'diastolic': 80.0,
            'spo2': 98.0, 'temperature': 36.5, 'activity': 0.0
        }

# Debug: Display sensor_values for troubleshooting
# st.write(f"Debug: sensor_values = {sensor_values}")

# Helper function to validate and convert sensor values
def get_valid_sensor_value(key, default, min_val, max_val):
    value = sensor_values.get(key)
    try:
        value = float(value) if isinstance(
            value, (int, float, str)) and value != 'Inactive' else default
        if value < min_val or value > max_val:
            return default
        return value
    except (ValueError, TypeError):
        return default

# Placeholder functions
def get_google_meet_link():
    return "https://meet.google.com/new"

def add_notification(username, message):
    if username not in st.session_state.notifications:
        st.session_state.notifications[username] = []
    st.session_state.notifications[username].append({
        "message": message,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "read": False
    })

# Session state initialization
if 'username' not in st.session_state:
    st.session_state.username = "prachi_shejwal"
if 'appointments' not in st.session_state:
    st.session_state.appointments = []
if 'notifications' not in st.session_state:
    st.session_state.notifications = {}

# Custom CSS for button and result styling
st.markdown(
    """
    <style>
    .custom-button {
        background: linear-gradient(90deg, #4CAF50, #45a049);
        color: white;
        font-weight: bold;
        font-size: 18px;
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        width: 100%;
        cursor: pointer;
    }
    .custom-button:hover {
        background: linear-gradient(90deg, #45a049, #388e3c);
    }
    .prediction-card {
        background: linear-gradient(135deg, rgba(46, 125, 50, 0.1), rgba(46, 125, 50, 0.2));
        padding: 20px;
        border-radius: 15px;
        border-left: 8px solid #2e7d32;
        box-shadow: 0 6px 12px rgba(0,0,0,0.1);
        margin: 10px 0;
    }
    .prediction-card.high-risk {
        background: linear-gradient(135deg, rgba(211, 47, 47, 0.1), rgba(211, 47, 47, 0.2));
        border-left: 8px solid #d32f2f;
    }
    .prediction-card h3 {
        color: #2e7d32;
        font-weight: bold;
        margin: 0 0 10px 0;
    }
    .prediction-card.high-risk h3 {
        color: #d32f2f;
    }
    .prediction-card p {
        color: #2e7d32;
        font-size: 24px;
        font-weight: bold;
        margin: 0;
    }
    .prediction-card.high-risk p {
        color: #d32f2f;
    }
    </style>
    """,
    unsafe_allow_html=True
)

st.markdown("""
<div style="background: linear-gradient(45deg, #e3f2fd, #f5f5f5); padding: 20px; border-radius: 10px;">
    <h2 style="color: #2b5876;">🩸 Diabetes Prediction Using Machine Learning</h2>
    <p>Fill the following instruction carefully for accurate prediction</p>
</div>
""", unsafe_allow_html=True)

with st.expander("📝 Patient Information", expanded=True):
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("**Personal Details**")
        Gender = st.selectbox("Gender", ["Male", "Female"], key="gender_pred")
        Age = st.number_input(
            "Age",
            min_value=1.0,
            max_value=120.0,
            value=get_valid_sensor_value('age', 30.0, 1.0, 120.0),
            key="age_pred"
        )
        Height = st.number_input(
            "Height (cm)",
            min_value=50.0,
            max_value=250.0,
            value=get_valid_sensor_value('height', 170.0, 50.0, 250.0),
            key="height_pred"
        )

    with col2:
        st.markdown("**Body Metrics**")
        Weight = st.number_input(
            "Weight (kg)",
            min_value=10.0,
            max_value=300.0,
            value=get_valid_sensor_value('weight', 70.0, 10.0, 300.0),
            key="weight_pred"
        )
        Glucose = st.number_input(
            "Glucose (mg/dL)",
            min_value=50.0,
            max_value=400.0,
            value=get_valid_sensor_value('glucose', 100.0, 50.0, 400.0),
            key="glucose_pred"
        )
        BMI = Weight / ((Height / 100) ** 2) if Height > 0 else 0
        st.number_input(
            "BMI",
            min_value=10.0,
            max_value=60.0,
            value=float(BMI),
            format="%.1f",
            disabled=True,
            key="bmi_pred"
        )

with st.expander("💓 Vital Signs Monitor"):
    cols = st.columns(3)
    with cols[0]:
        st.markdown("❤️ Pulse Rate")
        Pulse_Rate = st.number_input(
            "bpm",
            min_value=30.0,
            max_value=200.0,
            value=get_valid_sensor_value('heartRate', 72.0, 30.0, 200.0),
            key="pulse_rate_pred"
        )
        Acetone_Level = st.number_input(
            "Acetone Level",
            min_value=0.0,
            max_value=10.0,
            value=get_valid_sensor_value('acetone', 0.0, 0.0, 10.0),
            key="acetone_level_pred"
        )
    with cols[1]:
        st.markdown("🩸 Blood Pressure")
        Systolic_BP = st.number_input(
            "Systolic",
            min_value=70.0,
            max_value=200.0,
            value=get_valid_sensor_value('systolic', 120.0, 70.0, 200.0),
            key="systolic_bp_pred"
        )
        SPO2 = st.number_input(
            "SPO2 (%)",
            min_value=70.0,
            max_value=100.0,
            value=get_valid_sensor_value('spo2', 98.0, 70.0, 100.0),
            key="spo2_pred"
        )
    with cols[2]:
        Diastolic_BP = st.number_input(
            "Diastolic",
            min_value=40.0,
            max_value=120.0,
            value=get_valid_sensor_value('diastolic', 80.0, 40.0, 120.0),
            key="diastolic_bp_pred"
        )
        Temperature = st.number_input(
            "Temperature (°C)",
            min_value=35.0,
            max_value=42.0,
            value=get_valid_sensor_value('temperature', 36.5, 35.0, 42.0),
            key="temperature_pred"
        )
        Activity = st.number_input(
            "Activity Level",
            min_value=0.0,
            max_value=10.0,
            value=get_valid_sensor_value('activity', 0.0, 0.0, 10.0),
            key="activity_level_pred"
        )

with st.expander("📋 Medical History"):
    cols = st.columns(3)
    with cols[0]:
        st.markdown("**Hypertension**")
        Hypertensive = st.selectbox(
            "Personal History", ["No", "Yes"], key="hypertensive_pred"
        )
        Family_Hypertension = st.selectbox(
            "Family History", ["No", "Yes"], key="family_hypertension_pred"
        )
    with cols[1]:
        st.markdown("**Cardiac Health**")
        Cardiovascular_Disease = st.selectbox(
            "Heart Conditions", ["No", "Yes"], key="cardiovascular_pred"
        )
        Stroke = st.selectbox(
            "Stroke History", ["No", "Yes"], key="stroke_pred"
        )
    with cols[2]:
        st.markdown("**Diabetes**")
        Family_Diabetes = st.selectbox(
            "Family History", ["No", "Yes"], key="family_diabetes_pred"
        )
        Diabetic = st.selectbox(
            "Previous Diagnosis", ["No", "Yes"], key="diabetic_pred"
        )

diabetes_result = None
if st.button("🔍 Analyze Diabetes Risk", use_container_width=True, key="analyze_risk", help="Click to analyze diabetes risk"):
    # Validation checks
    if not (1 <= Age <= 120):
        st.error("Please enter a valid Age between 1 and 120 years.")
    elif not (50.0 <= Height <= 250.0):
        st.error("Please enter a valid Height between 50.0 and 250.0 cm.")
    elif not (10.0 <= Weight <= 300.0):
        st.error("Please enter a valid Weight between 10.0 and 300.0 kg.")
    elif not (50.0 <= Glucose <= 400.0):
        st.error("Please enter a valid Glucose level between 50.0 and 400.0 mg/dL.")
    elif not (10.0 <= BMI <= 60.0):
        st.error(
            "Please enter valid Height and Weight to calculate BMI between 10.0 and 60.0.")
    elif not (30.0 <= Pulse_Rate <= 200.0):
        st.error("Please enter a valid Pulse Rate between 30.0 and 200.0 bpm.")
    elif not (0.0 <= Acetone_Level <= 10.0):
        st.error("Please enter a valid Acetone Level between 0.0 and 10.0.")
    elif not (70.0 <= Systolic_BP <= 200.0):
        st.error("Please enter a valid Systolic BP between 70.0 and 200.0 mmHg.")
    elif not (70.0 <= SPO2 <= 100.0):
        st.error("Please enter a valid SPO2 between 70.0 and 100.0%.")
    elif not (40.0 <= Diastolic_BP <= 120.0):
        st.error("Please enter a valid Diastolic BP between 40.0 and 120.0 mmHg.")
    elif not (35.0 <= Temperature <= 42.0):
        st.error("Please enter a valid Temperature between 35.0 and 42.0 °C.")
    elif not (0.0 <= Activity <= 10.0):
        st.error("Please enter a valid Activity Level between 0.0 and 10.0.")
    else:
        gender_val = 1 if Gender == "Male" else 0
        family_diabetes_val = 1 if Family_Diabetes == "Yes" else 0
        hypertensive_val = 1 if Hypertensive == "Yes" else 0
        family_hypertension_val = 1 if Family_Hypertension == "Yes" else 0
        cardiovascular_val = 1 if Cardiovascular_Disease == "Yes" else 0
        stroke_val = 1 if Stroke == "Yes" else 0

        feature_names = ['age', 'gender', 'pulse_rate', 'systolic_bp', 'diastolic_bp', 'glucose', 'height', 'weight',
                         'bmi', 'family_diabetes', 'hypertensive', 'family_hypertension', 'cardiovascular_disease', 'stroke']
        input_data = pd.DataFrame([[Age, gender_val, Pulse_Rate, Systolic_BP, Diastolic_BP, Glucose, Height, Weight,
                                    BMI, family_diabetes_val, hypertensive_val, family_hypertension_val,
                                    cardiovascular_val, stroke_val]], columns=feature_names)
        st.write("Debug: Input data:", input_data)  # Debug input data
        try:
            model = joblib.load('grid_gbc.pkl')
            prediction = model.predict_proba(input_data)[0][1]
            st.write("Debug: Predicted probability:", prediction)  # Debug probability
            diabetes_result = "High risk of diabetes" if prediction >= 0.5 else "Low risk of diabetes"
        except Exception as e:
            st.error(f"Prediction failed: {str(e)}")
            diabetes_result = None

if diabetes_result:
    result_class = "high-risk" if "High risk" in diabetes_result else ""
    st.markdown(f"""
    <div class="prediction-card {result_class}">
        <h3>📋 Prediction Result</h3>
        <p>{diabetes_result}</p>
    </div>
    """, unsafe_allow_html=True)

    if "High risk" in diabetes_result:
        selected_doctor = st.selectbox(
            "Select Doctor", DOCTORS, key="auto_doctor_select"
        )
        if selected_doctor:
            try:
                meet_link = get_google_meet_link()
                default_time = (datetime.now() + timedelta(hours=1)
                               ).strftime("%Y-%m-%d %H:%M")
                appointment = {
                    "patient": st.session_state.username,
                    "doctor": selected_doctor,
                    "time": default_time,
                    "notes": "Automatic appointment due to high diabetes risk",
                    "status": "Pending",
                    "appointment_id": f"{st.session_state.username}_{default_time}",
                    "meet_link": meet_link
                }

                conn = sqlite3.connect(
                    'appointments.db', check_same_thread=False)
                c = conn.cursor()
                c.execute('''CREATE TABLE IF NOT EXISTS appointments
                         (id INTEGER PRIMARY KEY AUTOINCREMENT,
                          patient TEXT, doctor TEXT, time TEXT, notes TEXT, status TEXT, meet_link TEXT)''')
                c.execute("INSERT INTO appointments (patient, doctor, time, notes, status, meet_link) VALUES (?, ?, ?, ?, ?, ?)",
                          (appointment["patient"], appointment["doctor"], appointment["time"],
                           appointment["notes"], appointment["status"], meet_link))
                conn.commit()
                conn.close()

                st.session_state.appointments.append(appointment)
                add_notification(st.session_state.username,
                                f"High diabetes risk detected. Appointment with {selected_doctor} at {default_time}. Join: {meet_link}")
                add_notification(selected_doctor,
                                f"Appointment with {st.session_state.username} at {default_time} due to high risk.")
                st.success(
                    f"✅ Appointment with {selected_doctor} at {default_time}. Meet link: {meet_link}")
            except Exception as e:
                st.error(f"Failed to schedule appointment: {str(e)}")

            st.markdown(
                """
                <style>
                .ai-assistance-button {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 1000;
                }
                </style>
                <div class="ai-assistance-button">
                    <a href="http://localhost:5173" target="_blank">
                        <button style="background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                            AI Assistance
                        </button>
                    </a>
                </div>
                """,
                unsafe_allow_html=True
            )

# Sidebar
with st.sidebar:
    st.markdown("### 👋 Welcome!")
    # st.markdown(f"**User:** {st.session_state.username}")