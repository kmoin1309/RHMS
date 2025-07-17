import streamlit as st
import pickle
from streamlit_option_menu import option_menu
from PIL import Image
import pandas as pd

# ✅ Set page config
st.set_page_config(
    page_title="🧠 Multiple Disease Prediction System", layout="wide", page_icon="💊")

# ✅ Load model
with open("grid_gbc.pkl", "rb") as file:
    diabetes_model = pickle.load(file)

# ✅ Inject custom CSS
st.markdown("""
<style>
    .main { background-color: #f4f9f9; }
    .stButton>button {
        background-color: #0066cc;
        color: white;
        font-weight: bold;
        padding: 0.5em 1em;
        border-radius: 10px;
    }
    .stButton>button:hover {
        background-color: #0052a3;
        color: #ffffff;
    }
</style>
""", unsafe_allow_html=True)

# ✅ Initialize session state
if "logged_in" not in st.session_state:
    st.session_state.logged_in = False
if "page" not in st.session_state:
    st.session_state.page = "welcome"
if "role" not in st.session_state:
    st.session_state.role = None
if "form_data" not in st.session_state:
    st.session_state.form_data = {}

# ✅ Function to reset form data


def reset_form_data():
    st.session_state.form_data = {}


# ✅ Welcome/Login Page
if not st.session_state.logged_in and st.session_state.page == 'welcome':
    st.title("👨‍⚕️ Welcome to the Smart Disease Prediction System")
    st.markdown("#### 🧬 Empowering healthcare through real-time data and AI")
    st.image("https://cdn.pixabay.com/photo/2017/08/06/00/03/doctor-2587625_1280.jpg",
             use_container_width=True)

    st.markdown("### 👤 Choose your role to login:")
    col1, col2, col3 = st.columns(3)
    with col1:
        if st.button("🧑‍⚕️ Patient Login"):
            st.session_state.page = 'login'
            st.session_state.role = 'patient'
    with col2:
        if st.button("👨‍⚕️ Doctor Login"):
            st.session_state.page = 'login'
            st.session_state.role = 'doctor'
    with col3:
        if st.button("🧑‍💼 Admin Login"):
            st.session_state.page = 'login'
            st.session_state.role = 'admin'

# ✅ Login Page
if st.session_state.page == 'login' and not st.session_state.logged_in:
    st.title(f"🔐 {st.session_state.role.capitalize()} Login Page")
    with st.form("login_form"):
        username = st.text_input("👤 Username")
        password = st.text_input("🔑 Password", type="password")
        submitted = st.form_submit_button("🚪 Login")

        def login_user(username, password, role):
            return username == "patient" and password == "patient123"

        if submitted:
            if login_user(username, password, st.session_state.role):
                st.session_state.logged_in = True
                st.session_state.page = 'dashboard'
                reset_form_data()  # Clear form on successful login
                st.success(f"✅ Welcome {username}!")
            else:
                st.error("❌ Invalid username or password")

    if st.button("🔙 Back to Welcome"):
        st.session_state.page = 'welcome'

# ✅ Sidebar after login
if st.session_state.logged_in:
    with st.sidebar:
        st.markdown("### 👋 Welcome!")
        st.markdown(f"**Role:** `{st.session_state.role}`")
        st.markdown("---")
        if st.button("🔓 Logout"):
            st.session_state.page = 'welcome'
            st.session_state.logged_in = False
            st.session_state.role = None
            reset_form_data()  # Clear data on logout
            st.success("🔒 Logged out successfully.")

# ✅ Dashboard - Diabetes Prediction
if st.session_state.logged_in and st.session_state.page == 'dashboard':
    st.header("🧪 Diabetes Prediction Using Machine Learning")
    st.info("Please fill the following information carefully for accurate prediction.")

    with st.expander("📋 Basic Information", expanded=True):
        col1, col2 = st.columns(2)
        with col1:
            Gender = st.selectbox("Gender", ["Male", "Female"], key="gender")
            Age = st.text_input("Age", value="", key="age")
        with col2:
            Height = st.text_input("Height (in cm)", value="", key="height")
            Weight = st.text_input("Weight (in kg)", value="", key="weight")

    try:
        height_m = float(Height) / 100
        weight_kg = float(Weight)
        calculated_bmi = round(weight_kg / (height_m ** 2), 2)
        st.success(f"📊 Calculated BMI: **{calculated_bmi}**")
    except:
        calculated_bmi = None
        st.warning("⚠️ Enter valid Height and Weight to calculate BMI.")

    with st.expander("💓 Vitals Monitoring", expanded=True):
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            Pulse_Rate = st.text_input("Pulse Rate", value="", key="pulse")
        with col2:
            Systolic_BP = st.text_input("Systolic BP", value="", key="sys_bp")
        with col3:
            Diastolic_BP = st.text_input(
                "Diastolic BP", value="", key="dia_bp")
            Glucose = st.text_input("Glucose Level", value="", key="glucose")
        with col4:
            Acetone_Level = st.text_input(
                "Acetone Level", value="", key="acetone")
            SpO2 = st.text_input("SpO2 (%)", value="", key="spo2")
            Temperature = st.text_input(
                "Temperature (°C)", value="", key="temp")
            Activity = st.selectbox(
                "Activity Level", ["Low", "Moderate", "High"], key="activity")

    with st.expander("📖 Medical History", expanded=True):
        col1, col2, col3 = st.columns(3)
        with col1:
            Family_Diabetes = st.selectbox("Family History of Diabetes", [
                                           "No", "Yes"], key="fam_diab")
            Hypertensive = st.selectbox(
                "Hypertensive", ["No", "Yes"], key="hypertensive")
        with col2:
            Family_Hypertension = st.selectbox("Family History of Hypertension", [
                                               "No", "Yes"], key="fam_hyper")
            Cardiovascular_Disease = st.selectbox(
                "Cardiovascular Disease", ["No", "Yes"], key="cvd")
        with col3:
            Stroke = st.selectbox(
                "Stroke History", ["No", "Yes"], key="stroke")

    if st.button("🧬 Predict Diabetes"):
        with st.spinner("Analyzing..."):
            try:
                gender_val = 1 if Gender == "Male" else 0
                family_diabetes_val = 1 if Family_Diabetes == "Yes" else 0
                hypertensive_val = 1 if Hypertensive == "Yes" else 0
                family_hypertension_val = 1 if Family_Hypertension == "Yes" else 0
                cardiovascular_val = 1 if Cardiovascular_Disease == "Yes" else 0
                stroke_val = 1 if Stroke == "Yes" else 0

                # Use only the 14 features the model was trained on
                input_data = [[
                    float(Age),
                    gender_val,
                    float(Pulse_Rate),
                    float(Systolic_BP),
                    float(Diastolic_BP),
                    float(Glucose),
                    float(Height),
                    float(Weight),
                    calculated_bmi if calculated_bmi is not None else 0.0,
                    family_diabetes_val,
                    hypertensive_val,
                    family_hypertension_val,
                    cardiovascular_val,
                    stroke_val
                ]]

                prediction = diabetes_model.predict(input_data)
                result_text = "✅ The person **has** diabetes." if prediction[
                    0] == 1 else "❎ The person **does not have** diabetes."
                st.success(result_text)

                # Display additional features for informational purposes
                st.markdown("### 🩺 Additional Vitals Insights")
                st.write(
                    f"**Acetone Level:** {Acetone_Level if Acetone_Level else 'Not provided'}")
                st.write(f"**SpO2:** {SpO2 if SpO2 else 'Not provided'} %")
                st.write(
                    f"**Temperature:** {Temperature if Temperature else 'Not provided'} °C")
                st.write(f"**Activity Level:** {Activity}")

            except ValueError as e:
                st.error(
                    f"⚠️ Please enter valid numeric values.\n\nError: {str(e)}")
