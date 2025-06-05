from flask import Flask, request, jsonify
from flask_cors import CORS # Needed for cross-origin requests from frontend

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

@app.route('/')
def home():
    return "Diet Tracker Backend is running!"

@app.route('/api/profile', methods=['POST'])
def update_profile():
    data = request.get_json()
    # In a real app, you'd save this to Firestore here
    print(f"Received profile update: {data}")
    return jsonify({"message": "Profile updated successfully (dummy response)", "data": data}), 200

@app.route('/api/calculate_goals', methods=['POST'])
def calculate_goals():
    data = request.get_json()
    weight = float(data.get('weight'))
    height = float(data.get('height'))
    age = int(data.get('age'))
    sex = data.get('sex')
    activity_level = data.get('activityLevel')
    goal = data.get('goal')

    # Dummy calculation for now
    bmr = 0
    if sex == 'male':
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
    else: # female
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161

    activity_multipliers = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'veryActive': 1.9,
    }
    tdee = bmr * activity_multipliers.get(activity_level, 1.2)

    calorie_goal = tdee
    if goal == 'lose':
        calorie_goal -= 500
    elif goal == 'gain':
        calorie_goal += 300

    return jsonify({
        "bmr": round(bmr, 2),
        "tdee": round(tdee, 2),
        "calorieGoal": round(calorie_goal, 2)
    }), 200

# More routes for /api/generate_menu, /api/analyze_meal, etc. would go here
# These would contain the actual logic interacting with your food database and Firestore

if __name__ == '__main__':
    app.run(debug=True, port=5000) # Runs on http://localhost:5000 by default
