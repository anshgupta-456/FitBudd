"""Daily calorie and macro targets, plus a day of meals built from common Indian foods.

Energy uses the Mifflin-St Jeor equation, which is the most accurate of the simple
BMR formulas for adults. Protein is set per kg of bodyweight rather than as a
percentage of calories, so a lighter person on a diet still gets enough.
"""

from dataclasses import dataclass

ACTIVITY = {
    "sedentary": (1.2, "Desk job, little exercise"),
    "light": (1.375, "Exercise 1-3 days a week"),
    "moderate": (1.55, "Exercise 3-5 days a week"),
    "active": (1.725, "Hard exercise 6-7 days a week"),
    "athlete": (1.9, "Training twice a day or a physical job"),
}

GOAL_ADJUST = {"lose_fat": -0.18, "maintain": 0.0, "build_muscle": 0.10}
PROTEIN_PER_KG = {"lose_fat": 2.0, "maintain": 1.6, "build_muscle": 1.8}
CYCLE_PHASES = ("menstrual", "follicular", "ovulatory", "luteal")

MEAL_SPLIT = [("Breakfast", 0.25), ("Lunch", 0.35), ("Snack", 0.10), ("Dinner", 0.30)]

# Each option: (text, diets it suits). Diets: vegan < vegetarian < eggetarian < non_vegetarian.
MEALS = {
    "Breakfast": [
        ("Vegetable poha with peanuts and a bowl of curd", {"vegetarian"}),
        ("Moong dal chilla (2) with mint chutney and paneer bhurji", {"vegetarian"}),
        ("Besan chilla (2) with tofu scramble", {"vegan"}),
        ("Overnight oats with soy milk, chia seeds and banana", {"vegan"}),
        ("Masala omelette (3 eggs) with 2 multigrain toast", {"eggetarian"}),
        ("Idli (3) with sambar and a boiled egg", {"eggetarian"}),
        ("Upma with vegetables and a glass of milk", {"vegetarian"}),
    ],
    "Lunch": [
        ("2 rotis, rajma, cucumber raita and salad", {"vegetarian"}),
        ("Brown rice, dal tadka, palak paneer and salad", {"vegetarian"}),
        ("Quinoa pulao with chana masala and kachumber", {"vegan"}),
        ("2 rotis, chicken curry (150 g), sabzi and salad", {"non_vegetarian"}),
        ("Rice, fish curry (150 g), beans thoran", {"non_vegetarian"}),
        ("2 rotis, egg curry (2 eggs), mixed veg", {"eggetarian"}),
        ("Millet khichdi with soya chunks and curd", {"vegetarian"}),
    ],
    "Snack": [
        ("Roasted chana and a fruit", {"vegan"}),
        ("Sprouts chaat with lemon and onion", {"vegan"}),
        ("Greek yoghurt or hung curd with berries", {"vegetarian"}),
        ("Buttermilk and a handful of almonds", {"vegetarian"}),
        ("2 boiled eggs with pepper", {"eggetarian"}),
    ],
    "Dinner": [
        ("Grilled paneer tikka (150 g) with sauteed vegetables and 1 roti", {"vegetarian"}),
        ("Tofu and vegetable stir-fry with brown rice", {"vegan"}),
        ("Dal, lauki sabzi and 2 jowar rotis", {"vegan"}),
        ("Tandoori chicken (200 g) with salad and mint chutney", {"non_vegetarian"}),
        ("Grilled fish with jeera rice and stir-fried greens", {"non_vegetarian"}),
        ("Egg bhurji (3 eggs) with 2 rotis and salad", {"eggetarian"}),
        ("Moong dal khichdi with curd and papad", {"vegetarian"}),
    ],
}

DIET_INCLUDES = {
    "vegan": {"vegan"},
    "vegetarian": {"vegan", "vegetarian"},
    "eggetarian": {"vegan", "vegetarian", "eggetarian"},
    "non_vegetarian": {"vegan", "vegetarian", "eggetarian", "non_vegetarian"},
}

CYCLE_NOTES = {
    "menstrual": [
        "Iron needs are higher: add spinach, rajma, jaggery or lean red meat, with lemon or amla for absorption.",
        "Lower energy is normal. Swap intense sessions for walks, yoga or light strength work if you need to.",
    ],
    "follicular": [
        "Energy and insulin sensitivity tend to be higher, so this is a good phase for heavier training and more carbs around workouts.",
    ],
    "ovulatory": [
        "Strength often peaks around now. Keep protein up and warm up thoroughly; ligaments can be laxer this week.",
    ],
    "luteal": [
        "Appetite often rises by 100-300 kcal. The target below already allows for about 150 kcal more.",
        "Magnesium-rich foods (pumpkin seeds, dark chocolate, bananas) can help with cramps and cravings.",
    ],
}


@dataclass
class Body:
    age: int
    gender: str  # "female", "male" or "other"
    height_cm: float
    weight_kg: float


def bmr(body: Body) -> float:
    base = 10 * body.weight_kg + 6.25 * body.height_cm - 5 * body.age
    if body.gender == "male":
        return base + 5
    if body.gender == "female":
        return base - 161
    return base - 78  # midpoint when sex isn't given


def build_targets(body: Body, activity: str, goal: str, diet: str, cycle_phase: str | None = None) -> dict:
    multiplier, activity_label = ACTIVITY[activity]
    resting = bmr(body)
    maintenance = resting * multiplier

    calories = maintenance * (1 + GOAL_ADJUST[goal])
    notes: list[str] = []
    if body.gender == "female" and cycle_phase == "luteal":
        calories += 150

    # Never prescribe below a safe floor.
    floor = 1200 if body.gender == "female" else 1500
    if calories < floor:
        calories = floor
        notes.append(f"Your target was raised to {floor} kcal, the minimum we suggest without medical supervision.")
    calories = int(round(calories / 10) * 10)

    protein_g = int(round(body.weight_kg * PROTEIN_PER_KG[goal]))
    fat_g = int(round(calories * 0.27 / 9))
    carbs_g = max(int(round((calories - protein_g * 4 - fat_g * 9) / 4)), 50)
    fibre_g = int(round(calories / 1000 * 14))
    water_l = round(body.weight_kg * 0.035, 1)

    allowed = DIET_INCLUDES[diet]
    meals = []
    for name, share in MEAL_SPLIT:
        options = [(text, suits) for text, suits in MEALS[name] if suits & allowed]
        # Put dishes that match the exact diet first (e.g. chicken before dal for non-veg).
        options.sort(key=lambda option: 0 if diet in option[1] else 1)
        meals.append({
            "name": name,
            "calories": int(round(calories * share / 10) * 10),
            "protein_g": int(round(protein_g * share)),
            "options": [text for text, _ in options[:3]],
        })

    if body.gender == "female" and cycle_phase in CYCLE_NOTES:
        notes.extend(CYCLE_NOTES[cycle_phase])
    if goal == "lose_fat":
        notes.append("Aim to lose 0.5-1% of bodyweight a week. Faster than that and you start losing muscle.")
    if goal == "build_muscle":
        notes.append("Expect about 0.25-0.5 kg of gain per month. Re-check the scale every two weeks and adjust by 100-150 kcal.")

    return {
        "bmr": int(round(resting)),
        "maintenance": int(round(maintenance)),
        "activity_label": activity_label,
        "calories": calories,
        "macros": {"protein_g": protein_g, "carbs_g": carbs_g, "fat_g": fat_g, "fibre_g": fibre_g},
        "water_l": water_l,
        "meals": meals,
        "notes": notes,
    }
