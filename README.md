# Kenyan Diet Tracker Application

This is a full-stack diet tracking application focusing on Kenyan cuisine, designed to help users calculate their dietary needs, generate weekly meal plans, and analyze custom meals.

## Features:
- BMR and TDEE calculation based on user bio-data.
- Weekly meal plan generation with Kenyan food items, aligned to calorie goals.
- Custom meal calorie and nutritional analysis.
- (Future) Email/SMS notifications and workout advisory.

## Technology Stack:
- **Frontend:** React.js with Tailwind CSS
- **Backend:** Flask (Python) API
- **Database:** Firebase Firestore (for user profiles and meal plans)

## Setup and Running:

### Frontend (React)
1. Navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm start` (usually runs on `http://localhost:3000`)

### Backend (Flask)
1. Navigate to the `backend` directory: `cd backend`
2. Create a virtual environment (recommended): `python3 -m venv venv`
3. Activate the virtual environment:
   - macOS/Linux: `source venv/bin/activate`
   - Windows: `venv\Scripts\activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Run the Flask application: `python app.py` (or `flask run`)

## Deployment:
- Frontend: Vercel, Netlify
- Backend: Render, Google Cloud Run, PythonAnywhere

## Project Status:
- Initial setup complete. Core frontend functionality (BMR/TDEE calculation, basic meal generation, custom meal analysis) is implemented. Backend API design is outlined.
