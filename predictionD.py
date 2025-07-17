import streamlit as st
import pickle
import os
import sqlite3
from streamlit_option_menu import option_menu
from datetime import datetime, timedelta
import pandas as pd
from google_meet import get_google_meet_link

# Load the diabetes prediction model
with open("grid_gbc.pkl", "rb") as f:
    diabetes_model = pickle.load(f)

# Database connection and table creation
try:
    conn = sqlite3.connect('appointments.db', check_same_thread=False)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS appointments
                (id INTEGER PRIMARY KEY AUTOINCREMENT,
                 patient TEXT,
                 doctor TEXT,
                 time TEXT,
                 notes TEXT,
                 status TEXT,
                 meet_link TEXT)''')
    conn.commit()
except sqlite3.Error as e:
    st.error(f"Database error: {e}")

# Custom CSS styling
st.markdown("""
    <style>
    .main {background-color: #f5f5f5;}
    h1, h2, h3 {color: #2b5876;}
    .stButton>button {background-color: #4CAF50; color: white; border-radius: 8px; padding: 10px;}
    .stButton>button:hover {background-color: #388e3c;}
    .stTextInput>div>div>input {background-color: #ffffff;}
    .stSelectbox>div>div>select {background-color: #ffffff;}
    .sidebar .sidebar-content {background-image: linear-gradient(#e0f7fa,#b2ebf2);}
    .reportview-container .main .block-container {padding-top: 2rem;}
    .header-image {width: 100%; height: 200px; object-fit: cover;}
    .role-card {padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2); transition: 0.3s;}
    .role-card:hover {box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2);}
    .appointment-card {padding: 15px; border-radius: 8px; background-color: #ffffff; margin-bottom: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);}
    .notification {padding: 10px; border-radius: 5px; margin-bottom: 10px;}
    </style>
    """, unsafe_allow_html=True)

st.set_page_config(page_title="HealthGuard AI", layout="wide", page_icon="🩺")

# Images URLs
HEADER_IMAGE = "https://images.unsplash.com/photo-1576091160550-2173dba999ef"
PATIENT_IMAGE = "https://cdn-icons-png.flaticon.com/512/3004/3004452.png"
DOCTOR_IMAGE = "https://cdn-icons-png.flaticon.com/512/3313/3313888.png"
ADMIN_IMAGE = "https://cdn-icons-png.flaticon.com/512/1077/1077114.png"
LOGIN_IMAGE = "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d"

# Initialize session state
if "appointments" not in st.session_state:
    st.session_state.appointments = []  # List to store appointment requests
if "notifications" not in st.session_state:
    st.session_state.notifications = {}  # Dictionary to store user notifications
if "logged_in" not in st.session_state:
    st.session_state.logged_in = False
if "page" not in st.session_state:
    st.session_state.page = "welcome"
if "role" not in st.session_state:
    st.session_state.role = None
if "form_data" not in st.session_state:
    st.session_state.form_data = {}
if "username" not in st.session_state:
    st.session_state.username = None

# Simulated list of doctors (in a real app, this would come from a database)
DOCTORS = ["Dr. Smith", "Dr. Johnson", "Dr. Lee"]

# Function to reset form data


def reset_form_data():
    st.session_state.form_data = {}

# Function to simulate login


def login_user(username, password, role):
    return (username == "patient" and password == "patient123") or \
           (username in DOCTORS and password == "doctor123")

# Function to generate available time slots (next 7 days, 9 AM to 5 PM, 30-min intervals)


def get_available_slots(doctor):
    slots = []
    current_date = datetime.now()
    # Check existing appointments to avoid double-booking
    booked_slots = [appt["time"] for appt in st.session_state.appointments if appt["doctor"]
                    == doctor and appt["status"] in ["Pending", "Accepted"]]
    for day in range(7):
        date = current_date + timedelta(days=day)
        for hour in range(9, 17):  # 9 AM to 5 PM
            for minute in [0, 30]:
                slot_time = date.replace(
                    hour=hour, minute=minute, second=0, microsecond=0)
                if slot_time > datetime.now() and slot_time.strftime("%Y-%m-%d %H:%M") not in booked_slots:
                    slots.append(slot_time)
    return slots

# Function to add notification


def add_notification(username, message):
    if username not in st.session_state.notifications:
        st.session_state.notifications[username] = []
    st.session_state.notifications[username].append({
        "message": message,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "read": False
    })


# Welcome Page
if not st.session_state.logged_in:
    if st.session_state.page == 'welcome':
        st.image(HEADER_IMAGE, use_column_width=True,
                 caption="Your Health, Our Priority")
        st.markdown(
            "<h1 style='text-align: center; color: #2b5876;'>Welcome to HealthGuard AI</h1>", unsafe_allow_html=True)
        st.markdown(
            "<h3 style='text-align: center; color: #4CAF50;'>Smart Disease Prediction System</h3>", unsafe_allow_html=True)

        col1, col2, col3 = st.columns(3)
        with col1:
            st.markdown(f"""
            <div class="role-card" style="background-color: #e3f2fd;">
                <center>
                <img src="{PATIENT_IMAGE}" width="150">
                <h3>Patient</h3>
                <p>Get instant health predictions and monitor your well-being</p>
                </center>
            </div>
            """, unsafe_allow_html=True)
            if st.button("Patient Login", key="patient"):
                st.session_state.page = 'login'
                st.session_state.role = 'patient'

        with col2:
            st.markdown(f"""
            <div class="role-card" style="background-color: #f0f4c3;">
                <center>
                <img src="{DOCTOR_IMAGE}" width="150">
                <h3>Doctor</h3>
                <p>Access advanced diagnostics and patient management tools</p>
                </center>
            </div>
            """, unsafe_allow_html=True)
            if st.button("Doctor Login", key="doctor"):
                st.session_state.page = 'login'
                st.session_state.role = 'doctor'

        with col3:
            st.markdown(f"""
            <div class="role-card" style="background-color: #ffcdd2;">
                <center>
                <img src="{ADMIN_IMAGE}" width="150">
                <h3>Admin</h3>
                <p>Manage system configurations and user access</p>
                </center>
            </div>
            """, unsafe_allow_html=True)
            if st.button("Admin Login", key="admin"):
                st.session_state.page = 'login'
                st.session_state.role = 'admin'

# Login Page
if st.session_state.page == 'login' and not st.session_state.logged_in:
    col1, col2 = st.columns([1, 2])
    with col1:
        st.image(LOGIN_IMAGE, use_column_width=True,
                 caption="Secure Health Access")
    with col2:
        st.markdown(
            f"<h2 style='color: #2b5876;'>{st.session_state.role.capitalize()} Login</h2>", unsafe_allow_html=True)
        username = st.text_input("👤 Username")
        password = st.text_input("🔒 Password", type="password")

        if st.button("🚪 Login"):
            if login_user(username, password, st.session_state.role):
                st.session_state.logged_in = True
                st.session_state.page = 'dashboard'
                st.session_state.username = username
                reset_form_data()
                st.success(f"Welcome {username}!")
            else:
                st.error("⚠️ Invalid credentials")

        if st.button("↩ Back"):
            st.session_state.page = 'welcome'

# Dashboard
# Dashboard
if st.session_state.page == 'dashboard' and st.session_state.logged_in:
    st.markdown(
        f"<h1 style='color: #2b5876; text-align: center;'>👨‍⚕️ HealthGuard {st.session_state.role.capitalize()} Dashboard</h1>", unsafe_allow_html=True)

    # Display notifications
    if st.session_state.username in st.session_state.notifications:
        st.markdown("### 📬 Notifications")
        for notif in st.session_state.notifications[st.session_state.username]:
            if not notif["read"]:
                st.markdown(f"""
                <div class="notification" style="background-color: #e3f2fd; border-left: 5px solid #0288d1;">
                    <p><strong>{notif['timestamp']}</strong>: {notif['message']}</p>
                </div>
                """, unsafe_allow_html=True)
                notif["read"] = True  # Mark as read after displaying

    # Initialize selected with a default value based on role
    default_selection = 'Diabetes Prediction' if st.session_state.role == 'patient' else 'Appointment Management'
    selected = default_selection  # Ensure selected is always defined

    with st.sidebar:
        st.markdown(f"**Logged in as:** {st.session_state.username}")
        st.markdown(f"**Role:** {st.session_state.role.capitalize()}")
        menu_options = ['Diabetes Prediction', 'Appointment Scheduling'] if st.session_state.role == 'patient' else [
            'Patient Management', 'Appointment Management']
        selected = option_menu(
            "Main Menu",
            menu_options,
            icons=['clipboard2-pulse', 'calendar-check'],
            menu_icon="house",
            default_index=0,
            styles={
                "container": {"background-color": "#e3f2fd"},
                "icon": {"color": "#2b5876"},
                "nav-link": {"--hover-color": "#b2ebf2"},
            }
        )
        if st.button("🔓 Logout"):
            st.session_state.page = 'welcome'
            st.session_state.logged_in = False
            st.session_state.role = None
            st.session_state.username = None
            reset_form_data()
            st.success("🔒 Logged out successfully.")

    # Patient Dashboard - Appointment Scheduling
    if st.session_state.role == "patient" and selected == 'Appointment Scheduling':
        st.markdown("""
        <div style="background: linear-gradient(45deg, #e3f2fd, #f5f5f5); padding: 20px; border-radius: 10px;">
            <h2 style="color: #2b5876;">📅 Book an Appointment</h2>
            <p>Select a doctor and time slot to request an appointment.</p>
        </div>
        """, unsafe_allow_html=True)

        with st.form("appointment_form"):
            selected_doctor = st.selectbox("Select Doctor", DOCTORS)
            available_slots = get_available_slots(selected_doctor)
            slot_strings = [slot.strftime("%Y-%m-%d %H:%M")
                            for slot in available_slots]
            selected_slot = st.selectbox(
                "Select Appointment Time", slot_strings)
            notes = st.text_area("Reason for Appointment (Optional)",
                                 placeholder="Describe your symptoms or reason for visit")
            submit_button = st.form_submit_button(
                "📩 Submit Appointment Request")

            if submit_button:
                appointment = {
                    "patient": st.session_state.username,
                    "doctor": selected_doctor,
                    "time": selected_slot,
                    "notes": notes,
                    "status": "Pending",
                    "appointment_id": f"{st.session_state.username}_{selected_slot}"
                }
                st.session_state.appointments.append(appointment)
                # Insert into database
                c.execute(
                    "INSERT INTO appointments (patient, doctor, time, notes, status, meet_link) VALUES (?, ?, ?, ?, ?, ?)",
                    (appointment["patient"], appointment["doctor"], appointment["time"],
                     appointment["notes"], appointment["status"], None)
                )
                conn.commit()
                add_notification(
                    st.session_state.username, f"Appointment request for {selected_slot} with {selected_doctor} submitted.")
                st.success(
                    f"✅ Appointment request for {selected_slot} with {selected_doctor} submitted successfully!")

        # Display patient's appointments
        st.markdown("### Your Appointments")
        patient_appointments = c.execute(
            "SELECT * FROM appointments WHERE patient = ?", (st.session_state.username,)).fetchall()
        if patient_appointments:
            for appt in patient_appointments:
                status_color = "#f57c00" if appt[5] == "Pending" else "#2e7d32" if appt[5] == "Accepted" else "#d32f2f"
                st.markdown(f"""
                <div class="appointment-card">
                    <p><strong>Time:</strong> {appt[3]}</p>
                    <p><strong>Doctor:</strong> {appt[2]}</p>
                    <p><strong>Status:</strong> <span style="color: {status_color};">{appt[5]}</span></p>
                    <p><strong>Notes:</strong> {appt[4]}</p>
                    {'<p><strong>Meet Link:</strong> <a href="' + str(appt[6]) + '" target="_blank">' + str(appt[6]) + '</a></p>' if appt[5] == "Accepted" and appt[6] else ""}
                </div>
                """, unsafe_allow_html=True)
                if appt[5] in ["Pending", "Accepted"]:
                    if st.button("🗑️ Cancel Appointment", key=f"cancel_{appt[0]}"):
                        c.execute(
                            "DELETE FROM appointments WHERE id = ?", (appt[0],))
                        conn.commit()
                        add_notification(
                            st.session_state.username, f"Appointment with {appt[2]} at {appt[3]} cancelled.")
                        add_notification(
                            appt[2], f"Patient {appt[1]} cancelled appointment at {appt[3]}.")
                        st.success("Appointment cancelled successfully!")
        else:
            st.info("No appointments scheduled yet.")

        # Display patient's past appointments
        st.markdown("### Past Appointments")
        past_appointments = c.execute(
            "SELECT * FROM appointments WHERE patient = ? AND status = ? AND time < ? ORDER BY time DESC",
            (st.session_state.username, "Accepted",
             datetime.now().strftime("%Y-%m-%d %H:%M"))
        ).fetchall()

        if past_appointments:
            for appt in past_appointments:
                st.markdown(f"""
                <div class="appointment-card">
                    <p><strong>Time:</strong> {appt[3]}</p>
                    <p><strong>Doctor:</strong> {appt[2]}</p>
                    <p><strong>Status:</strong> {appt[5]}</p>
                    <p><strong>Notes:</strong> {appt[4]}</p>
                    {'<p><strong>Meet Link:</strong> <a href="' + str(appt[6]) + '" target="_blank">' + str(appt[6]) + '</a></p>' if appt[6] else ""}
                </div>
                """, unsafe_allow_html=True)
        else:
            st.info("No past appointments.")

    # Doctor Dashboard - Appointment Management
    elif st.session_state.role == "doctor" and selected == 'Appointment Management':
        st.markdown("""
        <div style="background: linear-gradient(45deg, #e3f2fd, #f5f5f5); padding: 20px; border-radius: 10px;">
            <h2 style="color: #2b5876;">📅 Appointment Management</h2>
            <p>Review and manage patient appointment requests.</p>
        </div>
        """, unsafe_allow_html=True)

        pending_appointments = c.execute(
            "SELECT * FROM appointments WHERE status = ? AND doctor = ?", ("Pending", st.session_state.username)).fetchall()
        if pending_appointments:
            st.markdown("### Pending Appointment Requests")
            for appt in pending_appointments:
                with st.expander(f"Request from {appt[1]} at {appt[3]}"):
                    st.markdown(f"""
                    <div class="appointment-card">
                        <p><strong>Patient:</strong> {appt[1]}</p>
                        <p><strong>Time:</strong> {appt[3]}</p>
                        <p><strong>Notes:</strong> {appt[4]}</p>
                    </div>
                    """, unsafe_allow_html=True)
                    col1, col2, col3 = st.columns([1, 1, 1])
                    with col1:
                        if st.button("✅ Accept", key=f"accept_{appt[0]}"):
                            meet_link = get_google_meet_link()
                            c.execute("UPDATE appointments SET status = ?, meet_link = ? WHERE id = ?", (
                                "Accepted", meet_link, appt[0]))
                            conn.commit()
                            add_notification(
                                appt[1], f"Your appointment with {st.session_state.username} at {appt[3]} has been accepted. Join here: {meet_link}")
                            add_notification(
                                st.session_state.username, f"You accepted appointment with {appt[1]} at {appt[3]}.")
                            st.success(
                                f"Appointment with {appt[1]} at {appt[3]} accepted! Meet link: {meet_link}")
                    with col2:
                        if st.button("❌ Reject", key=f"reject_{appt[0]}"):
                            c.execute(
                                "UPDATE appointments SET status = ? WHERE id = ?", ("Rejected", appt[0]))
                            conn.commit()
                            add_notification(
                                appt[1], f"Your appointment with {st.session_state.username} at {appt[3]} has been rejected.")
                            add_notification(
                                st.session_state.username, f"You rejected appointment with {appt[1]} at {appt[3]}.")
                            st.success(
                                f"Appointment with {appt[1]} at {appt[3]} rejected.")
        else:
            st.info("No pending appointment requests.")

        # Display doctor's accepted appointments
        st.markdown("### Your Accepted Appointments")
        doctor_appointments = [appt for appt in st.session_state.appointments if appt["doctor"]
                               == st.session_state.username and appt["status"] == "Accepted"]
        if doctor_appointments:
            for appt in doctor_appointments:
                st.markdown(f"""
                <div class="appointment-card">
                    <p><strong>Patient:</strong> {appt['patient']}</p>
                    <p><strong>Time:</strong> {appt['time']}</p>
                    <p><strong>Status:</strong> {appt['status']}</p>
                    <p><strong>Notes:</strong> {appt['notes']}</p>
                </div>
                """, unsafe_allow_html=True)
        else:
            st.info("No accepted appointments yet.")

        # Display doctor's past appointments
        st.markdown("### Past Appointments")
        doctor_past_appointments = c.execute(
            "SELECT * FROM appointments WHERE doctor = ? AND status = ? AND time < ? ORDER BY time DESC",
            (st.session_state.username, "Accepted",
             datetime.now().strftime("%Y-%m-%d %H:%M"))
        ).fetchall()

        if doctor_past_appointments:
            for appt in doctor_past_appointments:
                st.markdown(f"""
                <div class="appointment-card">
                    <p><strong>Patient:</strong> {appt[1]}</p>
                    <p><strong>Time:</strong> {appt[3]}</p>
                    <p><strong>Status:</strong> {appt[5]}</p>
                    <p><strong>Notes:</strong> {appt[4]}</p>
                    {'<p><strong>Meet Link:</strong> <a href="' + str(appt[6]) + '" target="_blank">' + str(appt[6]) + '</a></p>' if appt[6] else ""}
                </div>
                """, unsafe_allow_html=True)
        else:
            st.info("No past appointments.")

    # Patient Dashboard - Diabetes Prediction
    # Patient Dashboard - Diabetes Prediction
    # Patient Dashboard - Diabetes Prediction
    # Patient Dashboard - Diabetes Prediction
    # Patient Dashboard - Diabetes Prediction
    # Patient Dashboard - Diabetes Prediction
    # Patient Dashboard - Diabetes Prediction
    # Patient Dashboard - Diabetes Prediction
    # Patient Dashboard - Diabetes Prediction
    # Patient Dashboard - Diabetes Prediction
    # Patient Dashboard - Diabetes Prediction
    elif st.session_state.role == "patient" and selected == 'Diabetes Prediction':
        st.markdown("""
        <div style="background: linear-gradient(45deg, #e3f2fd, #f5f5f5); padding: 20px; border-radius: 10px;">
            <h2 style="color: #2b5876;">🩸 Diabetes Risk Assessment</h2>
            <p>Fill in your health details for instant AI-powered prediction</p>
        </div>
        """, unsafe_allow_html=True)

        with st.expander("📝 Patient Information", expanded=True):
            col1, col2 = st.columns(2)
            with col1:
                st.markdown("**Personal Details**")
                Gender = st.selectbox(
                    "Gender", ["Male", "Female"], key="gender_pred")
                Age = st.number_input("Age", min_value=1,
                                      max_value=120, value=30, key="age_pred")
                Height = st.number_input(
                    "Height (cm)", value=170, key="height_pred")

            with col2:
                st.markdown("**Body Metrics**")
                Weight = st.number_input(
                    "Weight (kg)", value=70, key="weight_pred")
                Glucose = st.number_input(
                    "Glucose (mg/dL)", value=100, key="glucose_pred")
                BMI = Weight / ((Height / 100) ** 2) if Height > 0 else 0
                st.number_input("BMI", value=BMI, format="%.1f",
                                disabled=True, key="bmi_pred")

        with st.expander("💓 Vital Signs Monitor"):
            cols = st.columns(3)
            with cols[0]:
                st.markdown("❤️ Pulse Rate")
                Pulse_Rate = st.number_input(
                    "bpm", value=72, key="pulse_rate_pred")
                Acetone_Level = st.number_input(
                    "Acetone Level", value=0.0, key="acetone_level_pred")
            with cols[1]:
                st.markdown("🩸 Blood Pressure")
                Systolic_BP = st.number_input(
                    "Systolic", value=120, key="systolic_bp_pred")
                SPO2 = st.number_input("SPO2 (%)", value=98, key="spo2_pred")
            with cols[2]:
                Diastolic_BP = st.number_input(
                    "Diastolic", value=80, key="diastolic_bp_pred")
                Temperature = st.number_input(
                    "Temperature (°C)", value=36.5, key="temperature_pred")
                Activity = st.number_input(
                    "Activity Level", value=0.0, key="activity_level_pred")

        with st.expander("📋 Medical History"):
            cols = st.columns(3)
            with cols[0]:
                st.markdown("**Hypertension**")
                Hypertensive = st.selectbox(
                    "Personal History", ["No", "Yes"], key="hypertensive_pred")
                Family_Hypertension = st.selectbox(
                    "Family History", ["No", "Yes"], key="family_hypertension_pred")
            with cols[1]:
                st.markdown("**Cardiac Health**")
                Cardiovascular_Disease = st.selectbox(
                    "Heart Conditions", ["No", "Yes"], key="cardiovascular_pred")
                Stroke = st.selectbox(
                    "Stroke History", ["No", "Yes"], key="stroke_pred")
            with cols[2]:
                st.markdown("**Diabetes**")
                Family_Diabetes = st.selectbox(
                    "Family History", ["No", "Yes"], key="family_diabetes_pred")
                Diabetic = st.selectbox("Previous Diagnosis", [
                                        "No", "Yes"], key="diabetic_pred")

        diabetes_result = None
        if st.button("🔍 Analyze Diabetes Risk", use_container_width=True, key="analyze_risk"):
            gender_val = 1 if Gender == "Male" else 0
            family_diabetes_val = 1 if Family_Diabetes == "Yes" else 0
            hypertensive_val = 1 if Hypertensive == "Yes" else 0
            family_hypertension_val = 1 if Family_Hypertension == "Yes" else 0
            cardiovascular_val = 1 if Cardiovascular_Disease == "Yes" else 0
            stroke_val = 1 if Stroke == "Yes" else 0

            # Use lowercase feature names to match training data
            feature_names = ['age', 'gender', 'pulse_rate', 'systolic_bp', 'diastolic_bp', 'glucose', 'height', 'weight',
                             'bmi', 'family_diabetes', 'hypertensive', 'family_hypertension', 'cardiovascular_disease', 'stroke']
            input_data = pd.DataFrame([[
                Age,
                gender_val,
                Pulse_Rate,
                Systolic_BP,
                Diastolic_BP,
                Glucose,
                Height,
                Weight,
                BMI,
                family_diabetes_val,
                hypertensive_val,
                family_hypertension_val,
                cardiovascular_val,
                stroke_val
            ]], columns=feature_names)
            try:
                prediction = diabetes_model.predict(input_data)
                diabetes_result = "High risk of diabetes" if prediction[
                    0] == 1 else "Low risk of diabetes"
            except Exception as e:
                st.error(f"Prediction failed: {str(e)}")
                diabetes_result = None  # Skip further action if prediction fails

        if diabetes_result:
            result_color = "#d32f2f" if "High risk" in diabetes_result else "#2e7d32"
            st.markdown(f"""
            <div style="padding: 20px; border-radius: 10px; background-color: {result_color}20; border-left: 5px solid {result_color};">
                <h4 style="color: {result_color}; margin:0;">📋 Prediction Result:</h4>
                <p style="color: {result_color}; font-size: 18px; margin:0;">{diabetes_result}</p>
            </div>
            """, unsafe_allow_html=True)

            # Automatic appointment setup for high risk
            if "High risk" in diabetes_result:
                # Initialize session state for appointments and notifications if not present
                if "appointments" not in st.session_state:
                    st.session_state.appointments = []
                if "notifications" not in st.session_state:
                    st.session_state.notifications = {}

                selected_doctor = st.selectbox(
                    "Select Doctor", DOCTORS, key="auto_doctor_select")
                if selected_doctor:
                    try:
                        # Generate Google Meet link
                        meet_link = None
                        try:
                            meet_link = get_google_meet_link()
                        except Exception as meet_error:
                            st.warning(
                                f"Failed to generate Google Meet link: {str(meet_error)}. Using fallback link.")
                            meet_link = "https://meet.google.com/new"

                        if meet_link is None:
                            st.error(
                                "Meet link generation failed and no fallback available.")
                            raise Exception("Meet link generation failed")

                        # Use current date and time with a 1-hour offset as default
                        from datetime import datetime, timedelta
                        default_time = (
                            datetime.now() + timedelta(hours=1)).strftime("%Y-%m-%d %H:%M")
                        appointment = {
                            "patient": st.session_state.username,
                            "doctor": selected_doctor,
                            "time": default_time,
                            "notes": "Automatic appointment due to high diabetes risk",
                            "status": "Pending",
                            "appointment_id": f"{st.session_state.username}_{default_time}",
                            "meet_link": meet_link
                        }

                        # Verify database connection
                        try:
                            c.execute(
                                "SELECT name FROM sqlite_master WHERE type='table' AND name='appointments'")
                            if not c.fetchone():
                                st.error(
                                    "Appointments table does not exist in database.")
                                raise sqlite3.Error(
                                    "Appointments table not found")
                        except sqlite3.Error as db_error:
                            st.error(
                                f"Database connection error: {str(db_error)}")
                            raise db_error

                        # Insert into database
                        try:
                            c.execute(
                                "INSERT INTO appointments (patient, doctor, time, notes, status, meet_link) VALUES (?, ?, ?, ?, ?, ?)",
                                (appointment["patient"], appointment["doctor"], appointment["time"],
                                 appointment["notes"], appointment["status"], meet_link)
                            )
                            conn.commit()
                        except sqlite3.Error as db_error:
                            st.error(f"Database error: {str(db_error)}")
                            raise db_error

                        # Update session state
                        st.session_state.appointments.append(appointment)

                        # Add notifications
                        try:
                            add_notification(
                                st.session_state.username,
                                f"High diabetes risk detected. Appointment scheduled with {selected_doctor} at {default_time}. Join here: {meet_link}"
                            )
                            add_notification(
                                selected_doctor,
                                f"Automatic appointment scheduled with {st.session_state.username} at {default_time} due to high diabetes risk."
                            )
                        except Exception as notif_error:
                            st.error(f"Notification error: {str(notif_error)}")
                            raise notif_error

                        st.success(
                            f"✅ Appointment scheduled with {selected_doctor} at {default_time}. Meet link: {meet_link}")
                    except Exception as e:
                        st.error(f"Failed to schedule appointment: {str(e)}")

                # AI Assistance button at bottom right for high risk
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
