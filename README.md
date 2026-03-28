# Integrated Hospital Management System

This repository contains the integrated code for the Hospital Management System, featuring a Node.js backend, a React frontend (hms-website), and Python-based ML integration.

## Project Structure

- **backend/**: Node.js/Express backend server.
- **hms-website/**: React frontend application (with Diabetes Risk Module).
- **prediction_interface.py**: Flask-based ML prediction engine.
- **LangchainAgent/**: AI/ML agent integration.
- **RHMS-main/**: Additional resources/modules.

## ✨ New: Diabetes Risk Prediction (WCRS)
The system now includes a comprehensive **Weighted Composite Risk Scoring (WCRS)** module for early diabetes detection.

### Key Features:
- **Clinical Data Assessment**: 5-section manual data entry (Demographics, Vitals, Anthropometrics, Heredity, Activity).
- **Interactive Risk Explorer**: "What-if" analysis using real-time sliders for parameter simulation.
- **Weighted Scoring (WCRS)**:
  - **BP Impact**: Map Arterial Pressure (MAP) based scoring.
  - **Weight/BMI Impact**: Automatic BMI computation and risk delta.
  - **Heredity Score (H_score)**: Cumulative weighted family history tracking.
  - **Physical Activity**: MET-based modifier calculation.
- **Dynamic Theming**: Support for both Clinical Dark Mode and standard Light Mode.


## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [Python](https://www.python.org/) (v3.8 or higher)
- [MongoDB](https://www.mongodb.com/) (if running locally)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd integrated\ code
    ```

2.  **Install Backend Dependencies:**
    ```bash
    cd backend
    npm install
    cd ..
    ```

3.  **Install Frontend Dependencies:**
    ```bash
    cd hms-website
    npm install
    cd ..
    ```

4.  **Install Python Dependencies (if applicable):**
    Check `LangchainAgent` or root for `requirements.txt` and install:
    ```bash
    pip install -r requirements.txt
    ```

## Configuration

1.  **Backend Environment Variables:**
    Create a `.env` file in the `backend/` directory. You can copy a sample if provided or set the following keys:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    # Add other necessary variables
    ```

2.  **Frontend Configuration:**
    Check `hms-website/` for any `.env` requirements.

## Running the Application

### Option 1: Using the Startup Script (Recommended)

**Mac/Linux:**
```bash
./start_all.sh
```
Make sure the script is executable: `chmod +x start_all.sh`

**Windows:**
```bash
start_all.bat
```

### Option 2: Manual Start

1.  **Start Backend:**
    ```bash
    cd backend
    npm start
    ```

2.  **Start Frontend:**
    ```bash
    cd hms-website
    npm start
    ```

## Deployment

[Add deployment instructions here if applicable, e.g., Heroku, Vercel, AWS]
