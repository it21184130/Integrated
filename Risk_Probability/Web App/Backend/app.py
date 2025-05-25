from flask import Flask, request, jsonify
import pickle
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
# Load the trained model
with open("../best_model.pickle", "rb") as f:
    model = pickle.load(f)

def predict_risk(features):
    risk_probability = model.predict([features])[0]

    if risk_probability > 0.6:
        risk_level = "High"
        description = description = (
                "Transactions with a high probability of being fraudulent (risk probability > 0.6). "
                "These transactions typically require immediate investigation and action."
            )
        remediation_steps = [
                "1. Block IP/Region: If geographic anomalies are detected, block traffic from the suspicious region temporarily.",
                "2. Temporary Account Lock: Suspend transactions from the associated account until verified by the user or SOC team.",
                "3. User Verification: Contact the user to confirm if the transaction is legitimate."
            ]
    elif 0.3 < risk_probability <= 0.6:
        risk_level = "Medium"
        description = (
                "Transactions with a medium probability of fraud (risk probability 0.3–0.6). "
                "These transactions might indicate early signs of fraudulent behavior."
            )
        remediation_steps = [
                "1. Delayed Authorization: Hold the transaction temporarily for further validation before completion.",
                "2. User Notification: Send a security alert to the user, prompting them to verify the transaction.",
                "3. Geo-Restriction Analysis: Verify the legitimacy of the transaction based on the location. If it’s an occasional deviation, allow upon user confirmation."
            ]
    else:
        risk_level = "Low"
        description = (
                "Transactions with minimal fraud probability (risk probability ≤ 0.3). "
                "These transactions align with the user's regular patterns and behaviors."
            )
        remediation_steps = [
                "1. Behavioral Monitoring: Continuously monitor for new patterns or changes in the user’s typical transaction behavior.",
                "2. Normal Processing: Allow the transaction to proceed without interruptions.",
                "3. Periodic Review: Include these transactions in regular audit cycles for assurance."
            ]

    return {
        "risk_probability": round(risk_probability * 100, 2),
        "risk_level": risk_level,
        "description": description,
        "remediation_steps": remediation_steps
    }

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    features = [
        float(data["amt"]),
        int(data["city_pop"]),
        int(data["hour"]),
        float(data["distance_km"])
    ]

    category_list = [
        "category_entertainment", "category_food_dining", "category_gas_transport",
        "category_grocery_net", "category_grocery_pos", "category_health_fitness",
        "category_home", "category_kids_pets", "category_misc_net", "category_misc_pos",
        "category_personal_care", "category_shopping_net", "category_shopping_pos", "category_travel"
    ]

    features += [1 if cat == data["category"] else 0 for cat in category_list]

    # Log the features to ensure they are correct
    print("Features:", features)

    result = predict_risk(features)
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)

