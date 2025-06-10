import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// Firebase configuration and App ID for local development.
// When deployed to Canvas, these will be overridden by the injected global variables.
const firebaseConfig = typeof window.__firebase_config !== 'undefined'
  ? JSON.parse(window.__firebase_config)
  : {
      apiKey: "AIzaSyCboitKOoXPRXPaHgqt5P4t8uqL_iWrxUo", // Placeholder from user's ODT file
      authDomain: "diet-tracker-adf0d.firebaseapp.com", // Placeholder from user's ODT file
      projectId: "diet-tracker-adf0d", // Placeholder from user's ODT file
      storageBucket: "diet-tracker-adf0d.firebasestorage.app", // Placeholder from user's ODT file
      messagingSenderId: "705448870736", // Placeholder from user's ODT file
      appId: "1:705448870736:web:9c4dcb032f43121bd76255", // Placeholder from user's ODT file
      measurementId: "G-PZPX1MVEFX" // Placeholder from user's ODT file
    };

const appId = typeof window.__app_id !== 'undefined'
  ? window.__app_id
  : 'default-diet-tracker-local'; // A unique ID for local development data

const initialAuthToken = typeof window.__initial_auth_token !== 'undefined'
  ? window.__initial_auth_token
  : null;


// Food database (simplified for demonstration, would be more extensive in a real app/backend)
const foodDatabase = [
  { name: 'Ugali (white maize flour)', caloriesPer100g: 350, proteinPer100g: 8, carbsPer100g: 78, fatPer100g: 2, unit: 'g', type: 'carb' },
  { name: 'Tilapia (cooked)', caloriesPer100g: 128, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 2.7, unit: 'g', type: 'protein' },
  { name: 'Chicken Breast (cooked)', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, unit: 'g', type: 'protein' },
  { name: 'Milk (whole)', caloriesPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.7, fatPer100g: 3.3, unit: 'ml', type: 'dairy' },
  { name: 'Yoghurt (plain, low fat)', caloriesPer100g: 63, proteinPer100g: 5.7, carbsPer100g: 7, fatPer100g: 1.5, unit: 'g', type: 'dairy' },
  { name: 'Lettuce', caloriesPer100g: 15, proteinPer100g: 1.4, carbsPer100g: 2.9, fatPer100g: 0.2, unit: 'g', type: 'veg' },
  { name: 'Cabbage', caloriesPer100g: 25, proteinPer100g: 1.3, carbsPer100g: 5.8, fatPer100g: 0.1, unit: 'g', type: 'veg' },
  { name: 'Kale', caloriesPer100g: 49, proteinPer100g: 3.3, carbsPer100g: 8.8, fatPer100g: 0.9, unit: 'g', type: 'veg' },
  { name: 'Spinach', caloriesPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4, unit: 'g', type: 'veg' },
  { name: 'Rice (cooked white)', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, unit: 'g', type: 'carb' },
  { name: 'Eggs (large)', caloriesPerUnit: 78, proteinPerUnit: 6.3, carbsPerUnit: 0.6, fatPerUnit: 5.3, unit: 'unit', type: 'protein' },
  { name: 'Oats (dry)', caloriesPer100g: 389, proteinPer100g: 16.9, carbsPer100g: 66.3, fatPer100g: 6.9, unit: 'g', type: 'carb' },
  { name: 'Goat Meat (cooked)', caloriesPer100g: 143, proteinPer100g: 27.1, carbsPer100g: 0, fatPer100g: 3.8, unit: 'g', type: 'protein' },
  { name: 'Beef (lean, cooked)', caloriesPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 15, unit: 'g', type: 'protein' },
  { name: 'Pilau (rice & beef)', caloriesPer100g: 180, proteinPer100g: 8, carbsPer100g: 25, fatPer100g: 6, unit: 'g', type: 'dish' },
  { name: 'Sweet Potatoes (boiled)', caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1, unit: 'g', type: 'carb' },
  { name: 'Porridge (maize flour)', caloriesPer100g: 60, proteinPer100g: 2, carbsPer100g: 12, fatPer100g: 1, unit: 'g', type: 'carb' },
  { name: 'Pasta (cooked)', caloriesPer100g: 158, proteinPer100g: 5.8, carbsPer100g: 31, fatPer100g: 0.9, unit: 'g', type: 'carb' },
  { name: 'Avocado', caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 8.5, fatPer100g: 14.7, unit: 'g', type: 'fat' },
  { name: 'Mango', caloriesPer100g: 60, proteinPer100g: 0.8, carbsPer100g: 15, fatPer100g: 0.4, unit: 'g', type: 'fruit' },
  { name: 'Carrots', caloriesPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 9.6, fatPer100g: 0.2, unit: 'g', type: 'veg' },
  { name: 'Beans (cooked)', caloriesPer100g: 116, proteinPer100g: 7.8, carbsPer100g: 20.7, fatPer100g: 0.5, unit: 'g', type: 'protein' },
  { name: 'Sukuma Wiki (collard greens, cooked)', caloriesPer100g: 32, proteinPer100g: 2.7, carbsPer100g: 6, fatPer100g: 0.6, unit: 'g', type: 'veg' },
  { name: 'Samosa (beef/veg)', caloriesPerUnit: 250, proteinPerUnit: 8, carbsPerUnit: 25, fatPerUnit: 15, unit: 'unit', type: 'snack' },
  { name: 'Chapati', caloriesPerUnit: 180, proteinPerUnit: 5, carbsPerUnit: 30, fatPerUnit: 5, unit: 'unit', type: 'carb' },
  { name: 'Kaimati', caloriesPerUnit: 80, proteinPerUnit: 1, carbsPerUnit: 15, fatPerUnit: 2, unit: 'unit', type: 'snack' },
  { name: 'Mokimo (Maize, Potatoes, Beans, Greens)', caloriesPer100g: 150, proteinPer100g: 5, carbsPer100g: 25, fatPer100g: 4, unit: 'g', type: 'dish' },
  { name: 'Githeri (Maize and Beans)', caloriesPer100g: 130, proteinPer100g: 6, carbsPer100g: 23, fatPer100g: 2, unit: 'g', type: 'dish' },
  { name: 'Dengu (Lentils, cooked)', caloriesPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4, unit: 'g', type: 'protein' },
  { name: 'Mchicha (Amaranth greens, cooked)', caloriesPer100g: 29, proteinPer100g: 3, carbsPer100g: 5, fatPer100g: 0.3, unit: 'g', type: 'veg' },
  { name: 'Matoke (Green Bananas, cooked)', caloriesPer100g: 122, proteinPer100g: 1.3, carbsPer100g: 31, fatPer100g: 0.4, unit: 'g', type: 'carb' },
  { name: 'Mboga Kienyeji (Traditional Greens)', caloriesPer100g: 30, proteinPer100g: 2.5, carbsPer100g: 5, fatPer100g: 0.5, unit: 'g', type: 'veg' },
  { name: 'Mbaazi (Pigeon Peas, cooked)', caloriesPer100g: 120, proteinPer100g: 7, carbsPer100g: 21, fatPer100g: 0.5, unit: 'g', type: 'protein' },
  { name: 'Arrow Roots', caloriesPer100g: 65, proteinPer100g: 1.5, carbsPer100g: 15, fatPer100g: 0.1, unit: 'g', type: 'carb' },
  { name: 'Cassava', caloriesPer100g: 160, proteinPer100g: 1.4, carbsPer100g: 38, fatPer100g: 0.3, unit: 'g', type: 'carb' },
  { name: 'Wimbi (Millet Flour)', caloriesPer100g: 378, proteinPer100g: 11, carbsPer100g: 73, fatPer100g: 4, unit: 'g', type: 'carb' },
  { name: 'Nduma (Taro)', caloriesPer100g: 112, proteinPer100g: 1.5, carbsPer100g: 27, fatPer100g: 0.2, unit: 'g', type: 'carb' },
];

// Fisher-Yates (Knuth) Shuffle for array randomization
const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};


function App() {
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: '',
    age: '',
    weight: '', // in kg
    height: '', // in cm
    sex: 'male',
    activityLevel: 'sedentary',
    goal: 'maintain', // gain, maintain, lose
  });
  const [bmr, setBmr] = useState(0);
  const [tdee, setTdee] = useState(0);
  const [calorieGoal, setCalorieGoal] = useState(0);
  const [weeklyMenu, setWeeklyMenu] = useState([]);
  const [customMealInput, setCustomMealInput] = useState('');
  const [customMealAnalysis, setCustomMealAnalysis] = useState(null);
  const [message, setMessage] = useState('');

  // Memoize activityMultipliers using useMemo so it's only created once
  const activityMultipliers = useMemo(() => ({
    sedentary: 1.2, // little or no exercise
    light: 1.375, // light exercise/sports 1-3 days/week
    moderate: 1.55, // moderate exercise/sports 3-5 days/week
    active: 1.725, // hard exercise/sports 6-7 days/week
    veryActive: 1.9, // very hard exercise/sports & a physical job
  }), []); // Empty dependency array means it's only created once

  // useCallback to memoize saveUserProfile to make it stable for useEffect dependencies
  const saveUserProfile = useCallback(async (profileToSave) => {
    if (!db || !userId) {
      setMessage("Firebase not initialized or user not authenticated.");
      return;
    }
    try {
      const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/profiles`, 'myProfile');
      await setDoc(userDocRef, profileToSave, { merge: true });
      setMessage("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving user profile:", error);
      setMessage(`Error saving profile: ${error.message}`);
    }
  }, [db, userId]);

  // Initialize Firebase and set up auth listener
  useEffect(() => {
    let authInstance;
    try {
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      authInstance = getAuth(app);
      setDb(firestore);

      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
          if (initialAuthToken) {
            await signInWithCustomToken(authInstance, initialAuthToken);
          }
        } else {
          await signInAnonymously(authInstance);
          setUserId(authInstance.currentUser?.uid || crypto.randomUUID());
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase initialization error:", error);
      setMessage(`Error initializing Firebase: ${error.message}`);
    }
  }, []);

  // Fetch user profile from Firestore when auth is ready and userId is set
  useEffect(() => {
    if (db && userId && isAuthReady) {
      const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/profiles`, 'myProfile');
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          // If profile exists in Firestore, load it into state
          setUserProfile(docSnap.data());
        } else {
          // If no profile found in Firestore, keep the local state as is (initial empty or user input).
          // The user will then populate fields and click save.
          console.log("No user profile found in Firestore. User can now input data and save.");
          // IMPORTANT: Removed the call to saveUserProfile(userProfile) here.
          // This prevents overwriting local user input with a default empty profile.
        }
      }, (error) => {
        console.error("Error fetching user profile:", error);
        setMessage(`Error fetching profile: ${error.message}`);
      });

      // Dependencies for this useEffect should only be what is needed to establish or re-establish the listener.
      // userProfile should NOT be a dependency here, as changes to userProfile will trigger a re-subscription
      // which can lead to race conditions or overwriting local state.
      return () => unsubscribe();
    }
  }, [db, userId, isAuthReady]); // Removed saveUserProfile and userProfile from dependencies


  // useCallback to memoize calculateBmrTdeeCalorieGoal to make it stable
  const calculateBmrTdeeCalorieGoal = useCallback(() => {
    // Ensure numeric values are parsed from userProfile state strings
    // If the string is empty, parseFloat will return NaN.
    // We check for NaN before using the numbers.
    const ageNum = parseFloat(userProfile.age);
    const weightNum = parseFloat(userProfile.weight);
    const heightNum = parseFloat(userProfile.height);

    const { sex, activityLevel, goal } = userProfile;

    // Only proceed with calculations if all numeric inputs are valid numbers and positive
    if (isNaN(ageNum) || isNaN(weightNum) || isNaN(heightNum) || ageNum <= 0 || weightNum <= 0 || heightNum <= 0) {
        setBmr(0);
        setTdee(0);
        setCalorieGoal(0);
        return;
    }

    let calculatedBmr = 0;
    if (sex === 'male') {
      calculatedBmr = (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum) + 5;
    } else {
      calculatedBmr = (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum) - 161;
    }
    setBmr(calculatedBmr.toFixed(2));

    const calculatedTdee = calculatedBmr * activityMultipliers[activityLevel];
    setTdee(calculatedTdee.toFixed(2));

    let finalCalorieGoal = calculatedTdee;
    if (goal === 'lose') {
      finalCalorieGoal -= 500;
    } else if (goal === 'gain') {
      finalCalorieGoal += 300;
    }
    setCalorieGoal(finalCalorieGoal.toFixed(2));
  }, [userProfile, activityMultipliers]);

  // Recalculate BMR/TDEE/Calorie Goal whenever userProfile changes
  useEffect(() => {
    calculateBmrTdeeCalorieGoal();
  }, [calculateBmrTdeeCalorieGoal]);


  // Single definition for handleProfileChange, wrapped in useCallback
  const handleProfileChange = useCallback((e) => {
    const { name, value } = e.target;
    // For all input types, simply update the state with the raw string value from the input.
    // The validation and conversion to numbers will happen when calculations are performed.
    setUserProfile(prev => ({ ...prev, [name]: value }));
  }, []); // No dependency array needed as 'prev' state is used, and no external state is accessed directly


  // Improved meal generation using useCallback
  const generateWeeklyMenu = useCallback(async () => {
    if (calorieGoal === 0 || isNaN(parseFloat(calorieGoal))) {
      setMessage("Please calculate your calorie goal first and ensure it's a valid number.");
      return;
    }

    const dailyTargetCalories = parseFloat(calorieGoal);
    const generatedMenu = [];
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const getUniqueMealForTarget = (targetCals, mealType, excludedFoods = []) => {
      let mealItems = [];
      let currentCals = 0;
      const maxAttempts = 50; // Prevent infinite loops
      let availableFoodsForMeal = shuffleArray([...foodDatabase]);

      availableFoodsForMeal = availableFoodsForMeal.filter(f => !excludedFoods.includes(f.name));

      const getFoodByCategory = (categoryType, currentAvailable) => {
        return shuffleArray(currentAvailable.filter(f => f.type === categoryType));
      };

      const addFoodItem = (food, portionValue, portionUnit) => {
          // Ensure food and portionValue are valid before adding
          if (!food || isNaN(portionValue) || portionValue === undefined || portionUnit === undefined) {
              return null; // Return null if invalid, so it's not pushed
          }

          let caloriesToAdd = 0;
          let proteinToAdd = 0;
          let carbsToAdd = 0;
          let fatToAdd = 0;

          if (food.unit === 'unit') {
            caloriesToAdd = (food.caloriesPerUnit || 0) * portionValue;
            proteinToAdd = (food.proteinPerUnit || 0) * portionValue;
            carbsToAdd = (food.carbsPerUnit || 0) * portionValue;
            fatToAdd = (food.fatPerUnit || 0) * portionValue;
          } else { // g or ml
            caloriesToAdd = (food.caloriesPer100g || 0) * (portionValue / 100);
            proteinToAdd = (food.proteinPer100g || 0) * (portionValue / 100);
            carbsToAdd = (food.carbsPer100g || 0) * (portionValue / 100);
            fatToAdd = (food.fatPer100g || 0) * (portionValue / 100);
          }

          const newItem = {
            name: food.name || 'Unknown Food',
            portion: `${portionValue}${portionUnit}`,
            calories: caloriesToAdd,
            protein: proteinToAdd,
            carbs: carbsToAdd,
            fat: fatToAdd,
          };
          
          mealItems.push(newItem);
          currentCals += caloriesToAdd;
          availableFoodsForMeal = availableFoodsForMeal.filter(item => item.name !== food.name);
          return newItem;
      };

      // Meal composition strategy
      if (mealType === 'breakfast') {
        const primaryBreakfastFood = getFoodByCategory('carb', availableFoodsForMeal).filter(f => f.name.includes('Oats') || f.name.includes('Porridge'))[0];
        if (primaryBreakfastFood) addFoodItem(primaryBreakfastFood, Math.floor(Math.random() * 100) + 50, primaryBreakfastFood.unit);

        const proteinSource = getFoodByCategory('protein', availableFoodsForMeal).filter(f => f.name.includes('Eggs'))[0];
        if (proteinSource) addFoodItem(proteinSource, Math.floor(Math.random() * 2) + 1, proteinSource.unit);

        const dairySource = getFoodByCategory('dairy', availableFoodsForMeal)[0] || getFoodByCategory('protein', availableFoodsForMeal).filter(f => f.name.includes('Milk') || f.name.includes('Yoghurt'))[0];
        if (dairySource) addFoodItem(dairySource, Math.floor(Math.random() * 100) + 100, dairySource.unit);

        const fruitSource = getFoodByCategory('fruit', availableFoodsForMeal)[0] || getFoodByCategory('fat', availableFoodsForMeal).filter(f => f.name.includes('Avocado'))[0];
        if (fruitSource) addFoodItem(fruitSource, Math.floor(Math.random() * 100) + 50, fruitSource.unit);

      } else if (mealType === 'lunch' || mealType === 'dinner') {
        const mainDishes = getFoodByCategory('dish', availableFoodsForMeal);
        const mainDish = mainDishes[Math.floor(Math.random() * mainDishes.length)];

        if (mainDish && Math.random() > 0.4) {
            addFoodItem(mainDish, Math.floor(Math.random() * 150) + 150, mainDish.unit);
        } else {
            const carb = getFoodByCategory('carb', availableFoodsForMeal)[0];
            const protein = getFoodByCategory('protein', availableFoodsForMeal)[0];
            const veggie = getFoodByCategory('veg', availableFoodsForMeal)[0];

            if (carb) addFoodItem(carb, Math.floor(Math.random() * 150) + 100, carb.unit);
            if (protein) addFoodItem(protein, Math.floor(Math.random() * 70) + 80, protein.unit);
            if (veggie) addFoodItem(veggie, Math.floor(Math.random() * 70) + 50, veggie.unit);

            if (currentCals < targetCals * 0.8) {
              const secondaryProteins = getFoodByCategory('protein', availableFoodsForMeal);
              const secondaryProtein = secondaryProteins[Math.floor(Math.random() * secondaryProteins.length)];
              if(secondaryProtein) addFoodItem(secondaryProtein, Math.floor(Math.random() * 50) + 50, secondaryProtein.unit);
            }
        }
      }

      let adjustmentAttempts = 0;
      while (Math.abs(currentCals - targetCals) > 100 && adjustmentAttempts < maxAttempts) {
        adjustmentAttempts++;
        if (currentCals < targetCals) {
          const potentialAdditions = getFoodByCategory('carb', availableFoodsForMeal).concat(getFoodByCategory('protein', availableFoodsForMeal));
          const itemToAdd = potentialAdditions[Math.floor(Math.random() * potentialAdditions.length)];
          if (itemToAdd) {
            const portionFactor = itemToAdd.unit === 'unit' ? 1 : 100;
            const caloriesPerUnitOr100g = itemToAdd.caloriesPerUnit || itemToAdd.caloriesPer100g;
            const addPortion = Math.min(50, Math.max(10, (targetCals - currentCals) / (caloriesPerUnitOr100g / portionFactor) / 2));
            if (addPortion > 0) {
              addFoodItem(itemToAdd, addPortion, itemToAdd.unit);
            }
          }
        } else if (currentCals > targetCals && mealItems.length > 0) {
          const largestItem = mealItems.reduce((prev, current) => (prev.calories > current.calories ? prev : current));
          if (largestItem.calories > 50) {
            const portionMatch = largestItem.portion.match(/\d+/);
            const currentPortion = portionMatch ? parseFloat(portionMatch[0]) : 0;

            const originalFoodInfo = foodDatabase.find(f => f.name === largestItem.name);
            if (originalFoodInfo && currentPortion > 0) {
                const caloriesPerUnitOr100g = originalFoodInfo.caloriesPerUnit || originalFoodInfo.caloriesPer100g;
                const portionFactor = originalFoodInfo.unit === 'unit' ? 1 : 100;
                
                const reductionAmount = Math.max(10, Math.floor((currentCals - targetCals) / (caloriesPerUnitOr100g / portionFactor) / 2));
                const newPortion = Math.max(0, currentPortion - reductionAmount);

                if (newPortion > 0) {
                    const itemIndex = mealItems.findIndex(item => item.name === largestItem.name);
                    if (itemIndex !== -1) {
                        let newCalories = 0;
                        if (originalFoodInfo.unit === 'unit') {
                            newCalories = (originalFoodInfo.caloriesPerUnit || 0) * newPortion;
                        } else {
                            newCalories = (originalFoodInfo.caloriesPer100g || 0) * (newPortion / 100);
                        }
                        currentCals -= (largestItem.calories - newCalories);
                        mealItems[itemIndex] = { ...largestItem, portion: `${newPortion}${originalFoodInfo.unit}`, calories: newCalories };
                    }
                } else {
                    mealItems = mealItems.filter(item => item.name !== largestItem.name);
                    currentCals -= largestItem.calories;
                }
            }
          }
        }
      }

      return {
        items: mealItems,
        totalCalories: mealItems.reduce((sum, item) => sum + item.calories, 0),
        totalProtein: mealItems.reduce((sum, item) => sum + (item.protein || 0), 0),
        totalCarbs: mealItems.reduce((sum, item) => sum + (item.carbs || 0), 0),
        totalFat: mealItems.reduce((sum, item) => sum + (item.fat || 0), 0),
      };
    };

    let usedFoodsOverall = new Set();

    for (const day of daysOfWeek) {
      const dayMeals = {
        day: day,
        breakfast: [],
        lunch: [],
        dinner: [],
        totalCalories: 0,
      };

      const breakfastResult = getUniqueMealForTarget(dailyTargetCalories * 0.25, 'breakfast', Array.from(usedFoodsOverall));
      breakfastResult.items.forEach(item => usedFoodsOverall.add(item.name));
      dayMeals.breakfast = breakfastResult.items;

      const lunchResult = getUniqueMealForTarget(dailyTargetCalories * 0.40, 'lunch', Array.from(usedFoodsOverall));
      lunchResult.items.forEach(item => usedFoodsOverall.add(item.name));
      dayMeals.lunch = lunchResult.items;

      const dinnerResult = getUniqueMealForTarget(dailyTargetCalories * 0.35, 'dinner', Array.from(usedFoodsOverall));
      dinnerResult.items.forEach(item => usedFoodsOverall.add(item.name));
      dayMeals.dinner = dinnerResult.items;

      dayMeals.totalCalories = dayMeals.breakfast.reduce((sum, item) => sum + item.calories, 0) +
                               dayMeals.lunch.reduce((sum, item) => sum + item.calories, 0) +
                               dayMeals.dinner.reduce((sum, item) => sum + item.calories, 0);
      generatedMenu.push(dayMeals);
    }

    setWeeklyMenu(generatedMenu);
    setMessage("Weekly menu generated with improved variety!");

    if (db && userId) {
      try {
        const menuDocRef = doc(db, `artifacts/${appId}/users/${userId}/menus`, 'currentWeeklyMenu');
        await setDoc(menuDocRef, { menu: generatedMenu, generatedAt: new Date().toISOString() });
        setMessage(prev => prev + " Menu saved to Firestore.");
      } catch (error) {
        console.error("Error saving weekly menu:", error);
        setMessage(prev => prev + ` Error saving menu: ${error.message}`);
      }
    }
  }, [calorieGoal, db, userId]);


  const analyzeCustomMeal = useCallback(() => {
    if (!customMealInput.trim()) {
      setCustomMealAnalysis(null);
      setMessage("Please enter a meal to analyze.");
      return;
    }

    const mealItems = customMealInput.split(',').map(item => item.trim());
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    const analyzedItems = [];

    mealItems.forEach(itemText => {
      const match = itemText.match(/(\d+)\s*(g|ml|unit)?\s*(.*)/i);
      let quantity = 1;
      let unit = 'g';
      let foodName = itemText;

      if (match) {
        quantity = parseFloat(match[1]);
        unit = match[2] ? match[2].toLowerCase() : 'g';
        foodName = match[3].trim();
      }

      const foundFood = foodDatabase.find(food => food.name.toLowerCase().includes(foodName.toLowerCase()));

      if (foundFood) {
        let calories = 0;
        let protein = 0;
        let carbs = 0;
        let fat = 0;

        if (foundFood.unit === 'unit') {
          calories = (foundFood.caloriesPerUnit || 0) * quantity;
          protein = (foundFood.proteinPerUnit || 0) * quantity;
          carbs = (foundFood.carbsPerUnit || 0) * quantity;
          fat = (foundFood.fatPerUnit || 0) * quantity;
        } else {
          calories = (foundFood.caloriesPer100g || 0) * (quantity / 100);
          protein = (foundFood.proteinPer100g || 0) * (quantity / 100);
          carbs = (foundFood.carbsPer100g || 0) * (quantity / 100);
          fat = (foundFood.fatPer100g || 0) * (quantity / 100);
        }

        totalCalories += calories;
        totalProtein += protein;
        totalCarbs += carbs;
        totalFat += fat;

        analyzedItems.push({
          name: foundFood.name,
          portion: `${quantity}${unit}`,
          calories: calories.toFixed(0),
          protein: protein.toFixed(1),
          carbs: carbs.toFixed(1),
          fat: fat.toFixed(1),
        });
      } else {
        analyzedItems.push({ name: itemText, portion: 'N/A', calories: 'N/A', protein: 'N/A', carbs: 'N/A', fat: 'N/A', note: 'Not found in database' });
      }
    });

    setCustomMealAnalysis({
      items: analyzedItems,
      totalCalories: totalCalories.toFixed(0),
      totalProtein: totalProtein.toFixed(1),
      totalCarbs: totalCarbs.toFixed(1),
      totalFat: totalFat.toFixed(1),
    });
    setMessage("Custom meal analyzed based on available data.");
  }, [customMealInput]);


  const clearProfile = () => {
    setUserProfile({
      name: '',
      age: '',
      weight: '',
      height: '',
      sex: 'male',
      activityLevel: 'sedentary',
      goal: 'maintain',
    });
    setBmr(0);
    setTdee(0);
    setCalorieGoal(0);
    setWeeklyMenu([]);
    setCustomMealInput('');
    setCustomMealAnalysis(null);
    setMessage("Profile cleared. Please enter new data.");
  };

  // Basic workout advisory based on goal and activity level
  const getWorkoutAdvisory = useCallback(() => {
    const { goal, activityLevel } = userProfile;
    let advisory = "Based on your current settings:\n";

    if (goal === 'lose') {
      advisory += "Goal: Weight Loss. Focus on a combination of cardiovascular exercises (e.g., jogging, cycling, swimming 3-5 times/week for 30-60 mins) and strength training (2-3 times/week) to preserve muscle mass. Stay consistent!\n";
    } else if (goal === 'gain') {
      advisory += "Goal: Muscle Gain. Prioritize strength training 3-5 times/week, focusing on progressive overload. Incorporate compound movements (squats, deadlifts, bench press). Moderate cardio is fine, but don't overdo it.\n";
    } else { // maintain
      advisory += "Goal: Weight Maintenance. A balanced exercise routine including both cardio and strength training is ideal. Aim for 150-300 minutes of moderate-intensity cardio per week and 2-3 strength training sessions.\n";
    }

    advisory += `\nYour activity level is '${activityLevel}'. Adjust intensity and volume accordingly. Consult a fitness professional for a personalized plan.`;
    return advisory;
  }, [userProfile]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-6 font-inter text-gray-800 antialiased">
      {/* Tailwind CSS and Inter font are now configured via public/index.html and src/index.css */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden p-8 space-y-8 md:space-y-10">
        <h1 className="text-4xl font-bold text-center text-green-700 mb-6">Kenyan Diet Tracker</h1>

        {/* User Profile Section */}
        <div className="p-6 bg-green-50 rounded-lg shadow-inner">
          <h2 className="text-2xl font-semibold text-green-800 mb-4">Your Bio Data</h2>
          <p className="text-sm text-gray-600 mb-4">
            <span className="font-semibold">User ID:</span> {userId || 'Loading...'}<br/>
            Your data is stored privately using this ID.
          </p>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={userProfile.name}
                onChange={handleProfileChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
              <input
                type="number"
                id="age"
                name="age"
                value={userProfile.age}
                onChange={handleProfileChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                placeholder="e.g., 30"
              />
            </div>
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Weight (kg)</label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={userProfile.weight}
                onChange={handleProfileChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                placeholder="e.g., 70"
              />
            </div>
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-700">Height (cm)</label>
              <input
                type="number"
                id="height"
                name="height"
                value={userProfile.height}
                onChange={handleProfileChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                placeholder="e.g., 175"
              />
            </div>
            <div>
              <label htmlFor="sex" className="block text-sm font-medium text-gray-700">Sex</label>
              <select
                id="sex"
                name="sex"
                value={userProfile.sex}
                onChange={handleProfileChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label htmlFor="activityLevel" className="block text-sm font-medium text-gray-700">Activity Level</label>
              <select
                id="activityLevel"
                name="activityLevel"
                value={userProfile.activityLevel}
                onChange={handleProfileChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
              >
                <option value="sedentary">Sedentary (little or no exercise)</option>
                <option value="light">Lightly Active (1-3 days/week)</option>
                <option value="moderate">Moderately Active (3-5 days/week)</option>
                <option value="active">Very Active (6-7 days/week)</option>
                <option value="veryActive">Extremely Active (physical job/training)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="goal" className="block text-sm font-medium text-gray-700">Dietary Goal</label>
              <select
                id="goal"
                name="goal"
                value={userProfile.goal}
                onChange={handleProfileChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
              >
                <option value="maintain">Maintain Weight</option>
                <option value="lose">Lose Weight</option>
                <option value="gain">Gain Muscle</option>
              </select>
            </div>
          </form>
          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={() => saveUserProfile(userProfile)}
              className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
            >
              Save Profile
            </button>
            <button
              onClick={clearProfile}
              className="flex-1 min-w-[120px] bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
            >
              Clear Profile
            </button>
          </div>
          {message && (
            <p className="mt-4 text-sm text-center text-gray-600 italic">{message}</p>
          )}
        </div>

        {/* Calorie Summary Section */}
        <div className="p-6 bg-blue-50 rounded-lg shadow-inner">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">Calorie Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-white p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-600">BMR (Basal Metabolic Rate)</p>
              <p className="text-2xl font-bold text-blue-600">{bmr} kcal</p>
            </div>
            <div className="bg-white p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-600">TDEE (Total Daily Energy Expenditure)</p>
              <p className="text-2xl font-bold text-blue-600">{tdee} kcal</p>
            </div>
            <div className="bg-white p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-600">Target Calorie Goal</p>
              <p className="text-2xl font-bold text-blue-600">{calorieGoal} kcal</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-center text-gray-600">
            Based on your bio-data and a goal to <span className="font-semibold text-blue-700">{userProfile.goal.replace('-', ' ')}</span>.
          </p>
        </div>

        {/* Weekly Menu Section */}
        <div className="p-6 bg-purple-50 rounded-lg shadow-inner">
          <h2 className="text-2xl font-semibold text-purple-800 mb-4">Weekly Meal Plan</h2>
          <button
            onClick={generateWeeklyMenu}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 mb-6"
          >
            Generate Weekly Menu
          </button>
          {weeklyMenu.length > 0 ? (
            <div className="space-y-6">
              {weeklyMenu.map((dayData, index) => (
                <div key={index} className="bg-white rounded-md shadow-md p-4 border border-purple-200">
                  <h3 className="text-xl font-bold text-purple-700 mb-2">{dayData.day}</h3>
                  <p className="text-md font-semibold text-gray-700 mb-3">Total Day Calories: {dayData.totalCalories.toFixed(0)} kcal</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['breakfast', 'lunch', 'dinner'].map(mealType => (
                      <div key={mealType} className="border border-gray-200 rounded-md p-3">
                        <h4 className="font-semibold text-lg text-gray-800 capitalize mb-2">{mealType}</h4>
                        {dayData[mealType].length > 0 ? (
                          <ul className="list-disc list-inside text-sm text-gray-700">
                            {dayData[mealType].map((item, i) => (
                              <li key={i}>{item.name} ({item.portion}) - {typeof item.calories === 'number' ? item.calories.toFixed(0) : 'N/A'} kcal</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">No {mealType} items specified.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No menu generated yet. Click 'Generate Weekly Menu' to create one.</p>
          )}
        </div>

        {/* Custom Meal Analysis Section */}
        <div className="p-6 bg-yellow-50 rounded-lg shadow-inner">
          <h2 className="text-2xl font-semibold text-yellow-800 mb-4">Analyze Custom Meal</h2>
          <p className="text-sm text-gray-600 mb-3">
            Enter your meal items separated by commas, including approximate portions (e.g., "100g rice, 120g chicken breast, 2 eggs").
          </p>
          <textarea
            className="w-full h-24 p-3 rounded-md border border-gray-300 focus:border-yellow-500 focus:ring-yellow-500 shadow-sm"
            placeholder="e.g., 150g ugali, 100g beef, 50g cabbage"
            value={customMealInput}
            onChange={(e) => setCustomMealInput(e.target.value)}
          ></textarea>
          <button
            onClick={analyzeCustomMeal}
            className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
          >
            Analyze Meal
          </button>

          {customMealAnalysis && (
            <div className="mt-6 bg-white p-4 rounded-md shadow-sm border border-yellow-200">
              <h3 className="text-xl font-bold text-yellow-700 mb-3">Meal Breakdown:</h3>
              {customMealAnalysis.items.map((item, index) => (
                <div key={index} className="mb-2 text-gray-700">
                  <p className="font-semibold">{item.name} ({item.portion})</p>
                  <ul className="list-disc list-inside ml-4 text-sm">
                    {item.note && <li className="text-red-500">Note: {item.note}</li>}
                    <li>Calories: {item.calories} kcal</li>
                    <li>Protein: {item.protein} g</li>
                    <li>Carbs: {item.carbs} g</li>
                    <li>Fat: {item.fat} g</li>
                  </ul>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-yellow-200">
                <p className="font-bold text-lg text-yellow-800">Total Nutritional Value:</p>
                <p className="text-gray-700">Calories: {customMealAnalysis.totalCalories} kcal</p>
                <p className="text-gray-700">Protein: {customMealAnalysis.totalProtein} g</p>
                <p className="text-gray-700">Carbs: {customMealAnalysis.totalCarbs} g</p>
                <p className="text-gray-700">Fat: {customMealAnalysis.totalFat} g</p>
              </div>
            </div>
          )}
        </div>

        {/* Workout Advisory Section */}
        <div className="p-6 bg-pink-50 rounded-lg shadow-inner">
          <h2 className="text-2xl font-semibold text-pink-800 mb-4">Workout Advisory</h2>
          <div className="bg-white p-4 rounded-md shadow-sm border border-pink-200">
            <p className="text-gray-700 whitespace-pre-wrap">{getWorkoutAdvisory()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
