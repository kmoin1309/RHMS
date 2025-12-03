from flask import Flask, request, jsonify
import pickle
import numpy as np
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ✅ Load trained model
with open("grid_gbc.pkl", "rb") as file:
    diabetes_model = pickle.load(file)

@app.route("/")
def home():
    return "🧠 Diabetes Prediction API is running."

@app.route("/predict", methods=["POST"])
def predict_diabetes():
    try:
        data = request.json

        # ✅ Map inputs
        gender = 1 if data.get("gender") == "Male" else 0
        family_diabetes = 1 if data.get("family_diabetes") == "Yes" else 0
        hypertensive = 1 if data.get("hypertensive") == "Yes" else 0
        family_hypertension = 1 if data.get("family_hypertension") == "Yes" else 0
        cardiovascular_disease = 1 if data.get("cardiovascular_disease") == "Yes" else 0
        stroke = 1 if data.get("stroke") == "Yes" else 0

        # ✅ BMI Calculation
        height_cm = float(data.get("height"))
        weight_kg = float(data.get("weight"))
        height_m = height_cm / 100
        bmi = round(weight_kg / (height_m ** 2), 2)

        input_data = np.array([[
            float(data.get("age")),
            gender,
            float(data.get("pulse_rate")),
            float(data.get("systolic_bp")),
            float(data.get("diastolic_bp")),
            float(data.get("glucose")),
            height_cm,
            weight_kg,
            bmi,
            family_diabetes,
            hypertensive,
            family_hypertension,
            cardiovascular_disease,
            stroke
        ]])

        # ✅ Model prediction
        prediction = diabetes_model.predict(input_data)[0]
        result = "✅ The person **has** diabetes." if prediction == 1 else "❎ The person **does not have** diabetes."

        return jsonify({
            "result": result,
            "prediction": int(prediction),
            "bmi": bmi
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, debug=True)
