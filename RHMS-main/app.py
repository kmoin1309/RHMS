from flask import Flask, request, jsonify
import pickle
import numpy as np
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ✅ Load trained model
with open("grid_gbc.pkl", "rb") as file:
    diabetes_model = pickle.load(file)

# ─────────────────────────────────────────────
# WCRS Constants (from PRD / literature-backed)
# ─────────────────────────────────────────────
ALPHA = 0.35        # BP weight (UKPDS/Framingham)
BETA  = 0.40        # BMI/Weight weight (WHO obesity-diabetes)
GAMMA = 0.25        # Heredity weight (ADA familial risk)
DELTA = 0.30        # Activity max risk reduction (ADA/WHO)
MAP_NORMAL = 93.3   # mmHg (120/80 baseline)
MET_THRESHOLD = 600 # MET-min/week threshold


def compute_wcrs(data, ml_prediction):
    """
    Weighted Composite Risk Scoring (WCRS)
    R_final(%) = [R_ML_output × (1 + ΔR_BP + ΔR_Weight + ΔR_Heredity)] × Activity_Modifier
    """
    # ── ML Baseline ──
    # ML model output maps to: high=75%, moderate=50%, low=25%
    r_baseline = 75.0 if ml_prediction == 1 else 25.0

    # ── Formula 1: Blood Pressure Risk Delta (MAP) ──
    sbp = float(data.get("systolic_bp", 120))
    dbp = float(data.get("diastolic_bp", 80))
    map_val = (sbp + 2 * dbp) / 3.0
    delta_r_bp = ALPHA * (map_val - MAP_NORMAL) / MAP_NORMAL
    # Also compute SBP-specific delta for display
    delta_r_bp_pct = ((sbp - 120) / 120.0) * 35.0

    # ── Formula 2: Weight / BMI Risk Delta ──
    height_cm = float(data.get("height", 170))
    weight_kg = float(data.get("weight", 70))
    height_m = height_cm / 100.0
    bmi = weight_kg / (height_m ** 2) if height_m > 0 else 25.0
    delta_r_weight = BETA * (bmi - 25.0) / 25.0
    delta_r_weight_pct = ((bmi - 25.0) / 25.0) * 40.0
    # For BMI < 18.5: cap at -5%
    if bmi < 18.5:
        delta_r_weight_pct = max(delta_r_weight_pct, -5.0)
        delta_r_weight = max(delta_r_weight, -0.05)

    # ── Formula 3: Heredity Risk Delta ──
    h_score = 0.0
    heredity_detail = {}

    # Parse heredity from form data
    both_parents = data.get("heredity_both_parents", False)
    father = data.get("heredity_father", False)
    mother = data.get("heredity_mother", False)
    sibling = data.get("heredity_sibling", False)
    grandparent = data.get("heredity_grandparent", False)
    family_diabetes = data.get("family_diabetes", "No")

    if both_parents or (father and mother):
        h_score = 1.0
        heredity_detail = {"both_parents": 1.0}
    else:
        if father:
            h_score += 0.5
            heredity_detail["father"] = 0.5
        if mother:
            h_score += 0.5
            heredity_detail["mother"] = 0.5
        if sibling:
            h_score += 0.3
            heredity_detail["sibling"] = 0.3
        if grandparent:
            h_score += 0.15
            heredity_detail["grandparent"] = 0.15

    # Fallback: if no granular heredity data, use family_diabetes flag
    if h_score == 0 and family_diabetes == "Yes":
        h_score = 0.5
        heredity_detail["family_diabetes_flag"] = 0.5

    h_score = min(h_score, 1.0)   # Cap at 1.0
    delta_r_heredity = h_score * GAMMA
    delta_r_heredity_pct = h_score * 25.0

    # ── Formula 4: Activity Modifier (multiplicative) ──
    met_value = float(data.get("met_value", 4.0))      # METs of activity
    activity_minutes = float(data.get("activity_minutes", 0))  # min/day
    activity_days = float(data.get("activity_days", 0))         # days/week
    met_weekly = met_value * activity_minutes * activity_days

    # Fallback: use simple activity level
    if met_weekly == 0:
        activity_level = data.get("activity", "0")
        if activity_level in ["High", "2"]:
            met_weekly = 1200
        elif activity_level in ["Moderate", "1"]:
            met_weekly = 600
        else:
            met_weekly = 200

    activity_modifier = 1.0 - (DELTA * (met_weekly - MET_THRESHOLD) / MET_THRESHOLD)
    activity_modifier = max(0.5, min(1.2, activity_modifier))  # Clamp [0.5, 1.2]

    # ── Composite Final Formula ──
    r_total = r_baseline * (1 + delta_r_bp + delta_r_weight + delta_r_heredity) * activity_modifier
    r_final = max(0, min(100, r_total))  # Clamp to 0-100%

    return {
        "wcrs_score": round(r_final, 1),
        "r_baseline": round(r_baseline, 1),
        "formulas": {
            "bp": {
                "label": "Blood Pressure (MAP)",
                "map_value": round(map_val, 1),
                "map_normal": MAP_NORMAL,
                "alpha": ALPHA,
                "delta_r": round(delta_r_bp, 4),
                "delta_r_pct": round(delta_r_bp_pct, 1),
                "sbp": sbp,
                "dbp": dbp,
                "formula": f"ΔR_BP = α × (MAP − MAP_normal) / MAP_normal = {ALPHA} × ({round(map_val,1)} − {MAP_NORMAL}) / {MAP_NORMAL} = {round(delta_r_bp,4)}",
                "impact": "positive" if delta_r_bp > 0 else "negative" if delta_r_bp < 0 else "neutral"
            },
            "weight": {
                "label": "Weight / BMI",
                "bmi": round(bmi, 1),
                "bmi_normal": 25.0,
                "beta": BETA,
                "delta_r": round(delta_r_weight, 4),
                "delta_r_pct": round(delta_r_weight_pct, 1),
                "formula": f"ΔR_Weight = β × (BMI − 25) / 25 = {BETA} × ({round(bmi,1)} − 25) / 25 = {round(delta_r_weight,4)}",
                "impact": "positive" if delta_r_weight > 0 else "negative" if delta_r_weight < 0 else "neutral"
            },
            "heredity": {
                "label": "Heredity",
                "h_score": round(h_score, 2),
                "gamma": GAMMA,
                "delta_r": round(delta_r_heredity, 4),
                "delta_r_pct": round(delta_r_heredity_pct, 1),
                "detail": heredity_detail,
                "formula": f"ΔR_Heredity = H_score × γ = {round(h_score,2)} × {GAMMA} = {round(delta_r_heredity,4)}",
                "impact": "positive" if delta_r_heredity > 0 else "neutral"
            },
            "activity": {
                "label": "Physical Activity",
                "met_weekly": round(met_weekly, 0),
                "met_threshold": MET_THRESHOLD,
                "delta_val": DELTA,
                "modifier": round(activity_modifier, 3),
                "formula": f"Activity_Modifier = 1 − [δ × (MET_weekly − 600) / 600] = 1 − [{DELTA} × ({round(met_weekly,0)} − 600) / 600] = {round(activity_modifier,3)}",
                "impact": "positive" if activity_modifier > 1.0 else "negative" if activity_modifier < 1.0 else "neutral"
            }
        },
        "composite_formula": f"R_final = R_baseline × (1 + ΔR_BP + ΔR_Weight + ΔR_Heredity) × Activity_Modifier = {round(r_baseline,1)} × (1 + {round(delta_r_bp,4)} + {round(delta_r_weight,4)} + {round(delta_r_heredity,4)}) × {round(activity_modifier,3)} = {round(r_final,1)}%",
        "parameter_impacts": [
            {"name": "ML Baseline", "value": round(r_baseline, 1), "type": "baseline"},
            {"name": "Blood Pressure", "value": round(delta_r_bp_pct, 1), "type": "delta", "direction": "risk" if delta_r_bp_pct > 0 else "protective"},
            {"name": "BMI / Weight", "value": round(delta_r_weight_pct, 1), "type": "delta", "direction": "risk" if delta_r_weight_pct > 0 else "protective"},
            {"name": "Heredity", "value": round(delta_r_heredity_pct, 1), "type": "delta", "direction": "risk" if delta_r_heredity_pct > 0 else "neutral"},
            {"name": "Physical Activity", "value": round((1 - activity_modifier) * 100, 1), "type": "modifier", "direction": "protective" if activity_modifier < 1.0 else "risk"},
        ]
    }


@app.route("/")
def home():
    return "🧠 Diabetes Prediction API with WCRS is running."


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

        # ✅ Model prediction and probabilities
        prediction = int(diabetes_model.predict(input_data)[0])
        probabilities = diabetes_model.predict_proba(input_data)[0].tolist()

        # ✅ Compute WCRS (Weighted Composite Risk Scoring)
        wcrs_result = compute_wcrs(data, prediction)

        result = "✅ The person **has** diabetes." if prediction == 1 else "❎ The person **does not have** diabetes."

        return jsonify({
            "result": result,
            "prediction": prediction,
            "probabilities": { "low": round(probabilities[0], 4), "high": round(probabilities[1], 4) },
            "bmi": bmi,
            "wcrs": wcrs_result
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, debug=True)
