# HMS React Frontend (with Diabetes Risk Prediction)

This is the React frontend for the Hospital Management System, built with Vite.

## 🚀 Key Modules: Diabetes Risk Prediction (WCRS)
A sophisticated manual clinical assessment tool that computes the **Weighted Composite Risk Score (WCRS)** to predict diabetes risk based on medical data.

### Features
- **Manual Clinical Form**:
  - **A. Demographics**: Full patient record management.
  - **B. Clinical Vitals**: Manual entry for BP, SpO2, Heart Rate, and Breath Acetone.
  - **C. Anthropometrics**: Automatic BMI and weight-related risk mapping.
  - **D. Heredity**: Interactive family history H_score calculation.
  - **E. Activity**: MET-based modifier based on lifestyle.
- **WCRS Interactivity**:
  - **Real-time Risk Exploration**: Interactive "Slider-Based" simulation dashboard.
  - **Live Risk Deltas**: Visual impact of cada parameter (e.g., BP vs BMI) on the total risk.
  - **Clinical Recommendations**: Dynamic medical advice based on score severity.
- **Dynamic Theming**: Integrated Light and Dark modes.

## 🛠️ Tech Stack
- **React 18** + **Vite**
- **Chart.js** (Trends visualization)
- **Lucide-React** (Aesthetics & Icons)
- **Tailwind CSS** (Layout & Responsiveness)
- **Context API** (User and Theme management)

## 🏃 Getting Started
1. `npm install`
2. `npm run dev` (starts on port 5174)
