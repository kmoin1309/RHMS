import streamlit as st
import pickle
import os
from streamlit_option_menu import option_menu

st.set_page_config(page_title="Multiple Disease Prediction", layout="wide", page_icon="👨‍🦰🤶")

# Function to simulate a simple login system
def login_user(username, password, user_type):
    users = {
        "admin": {"password": "admin123", "role": "admin"},
        "doctor": {"password": "doc123", "role": "doctor"},
        "patient": {"password": "patient123", "role": "patient"},
    }
    return username in users and users[username]["password"] == password and users[username]["role"] == user_type

# Initialize session state for page, role, and login status
if 'page' not in st.session_state:
    st.session_state.page = 'welcome'
if 'role' not in st.session_state:
    st.session_state.role = None
if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False

# Welcome Page
if not st.session_state.logged_in:
    if st.session_state.page == 'welcome':
        st.title("Welcome to the Multiple Disease Prediction System")
        st.write("Choose your role to proceed:")

        # Buttons for different login roles
        col1, col2, col3 = st.columns(3)

        with col1:
            if st.button("Patient Login"):
                st.session_state.page = 'login'
                st.session_state.role = 'patient'
        with col2:
            if st.button("Doctor Login"):
                st.session_state.page = 'login'
                st.session_state.role = 'doctor'
        with col3:
            if st.button("Admin Login"):
                st.session_state.page = 'login'
                st.session_state.role = 'admin'

# Login Page
if st.session_state.page == 'login' and not st.session_state.logged_in:
    st.title(f"{st.session_state.role.capitalize()} Login Page")

    username = st.text_input("Username")
    password = st.text_input("Password", type="password")

    if st.button("Login"):
        if login_user(username, password, st.session_state.role):
            st.session_state.logged_in = True
            st.session_state.page = 'dashboard'
            st.success(f"Welcome {username}!")
        else:
            st.error("Invalid username or password")

    if st.button("Back to Welcome"):
        st.session_state.page = 'welcome'

# Dashboard (Prediction Page) after login
if st.session_state.page == 'dashboard' and st.session_state.logged_in:
    st.title(f"{st.session_state.role.capitalize()} Dashboard")

    # Load the model only for the patient
    if st.session_state.role == "patient":
        working_dir = os.path.dirname(os.path.abspath(__file__))
        diabetes_model = pickle.load(open(f'{working_dir}/random_forest.pkl', 'rb'))

        # Sidebar for disease selection
        with st.sidebar:
            selected = option_menu("Multiple Disease Prediction",
                                   ['Diabetes Prediction', 'Heart Disease Prediction', 'Kidney Disease Prediction'],
                                   menu_icon='hospital-fill',
                                   icons=['activity', 'heart', 'person'],
                                   default_index=0)

        # Ensure selected exists before using it
        if selected == 'Diabetes Prediction':
            st.title("Diabetes Prediction Using Machine Learning")

            col1, col2, col3 = st.columns(3)

            with col1:
                Age = st.text_input("Age")
            with col2:
                Gender = st.selectbox("Gender", ["Male", "Female"])
            with col3:
                Pulse_Rate = st.text_input("Pulse Rate")
            with col1:
                Systolic_BP = st.text_input("Systolic Blood Pressure")
            with col2:
                Diastolic_BP = st.text_input("Diastolic Blood Pressure")
            with col3:
                Glucose = st.text_input("Glucose Level")
            with col1:
                Height = st.text_input("Height (in cm)")
            with col2:
                Weight = st.text_input("Weight (in kg)")
            with col3:
                BMI = st.text_input("BMI")
            with col1:
                Family_Diabetes = st.selectbox("Family History of Diabetes", ["No", "Yes"])
            with col2:
                Hypertensive = st.selectbox("Hypertensive", ["No", "Yes"])
            with col3:
                Family_Hypertension = st.selectbox("Family History of Hypertension", ["No", "Yes"])
            with col1:
                Cardiovascular_Disease = st.selectbox("Cardiovascular Disease", ["No", "Yes"])
            with col2:
                Stroke = st.selectbox("Stroke History", ["No", "Yes"])
            with col3:
                Diabetic = st.selectbox("Previously Diagnosed Diabetic", ["No", "Yes"])

            diabetes_result = ""

            if st.button("Diabetes Test Result"):
                # Convert categorical inputs to numeric values
                Gender = 1 if Gender == "Male" else 0
                Family_Diabetes = 1 if Family_Diabetes == "Yes" else 0
                Hypertensive = 1 if Hypertensive == "Yes" else 0
                Family_Hypertension = 1 if Family_Hypertension == "Yes" else 0
                Cardiovascular_Disease = 1 if Cardiovascular_Disease == "Yes" else 0
                Stroke = 1 if Stroke == "Yes" else 0
                Diabetic = 1 if Diabetic == "Yes" else 0

                try:
                    user_input = [float(Age), Gender, float(Pulse_Rate), float(Systolic_BP), float(Diastolic_BP),
                                  float(Glucose), float(Height), float(Weight), float(BMI), Family_Diabetes,
                                  Hypertensive, Family_Hypertension, Cardiovascular_Disease, Stroke, Diabetic]

                    prediction = diabetes_model.predict([user_input])

                    if prediction[0] == 1:
                        diabetes_result = "The person has diabetes."
                    else:
                        diabetes_result = "The person does not have diabetes."

                except ValueError:
                    diabetes_result = "Please enter valid numeric values for all fields."

            st.success(diabetes_result)

# Logout button to reset session state
if st.session_state.logged_in:
    if st.sidebar.button("Logout"):
        st.session_state.page = 'welcome'
        st.session_state.logged_in = False
        st.session_state.role = None
        st.success("Logged out successfully.")
