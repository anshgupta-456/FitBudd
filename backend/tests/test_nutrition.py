import pytest

from fitbudd.nutrition import Body, bmr, build_targets


def test_mifflin_st_jeor():
    # 70 kg, 175 cm, 30-year-old man: 10*70 + 6.25*175 - 5*30 + 5 = 1648.75
    assert bmr(Body(age=30, gender="male", height_cm=175, weight_kg=70)) == pytest.approx(1648.75)
    assert bmr(Body(age=30, gender="female", height_cm=175, weight_kg=70)) == pytest.approx(1482.75)


def test_fat_loss_targets_are_below_maintenance_with_high_protein():
    result = build_targets(Body(30, "male", 175, 80), "moderate", "lose_fat", "non_vegetarian")
    assert result["calories"] < result["maintenance"]
    assert result["macros"]["protein_g"] == 160
    total = result["macros"]["protein_g"] * 4 + result["macros"]["carbs_g"] * 4 + result["macros"]["fat_g"] * 9
    assert total == pytest.approx(result["calories"], abs=20)
    assert [m["name"] for m in result["meals"]] == ["Breakfast", "Lunch", "Snack", "Dinner"]


def test_calorie_floor():
    result = build_targets(Body(60, "female", 150, 42), "sedentary", "lose_fat", "vegetarian")
    assert result["calories"] == 1200
    assert any("minimum" in n for n in result["notes"])


def test_vegan_meals_contain_no_animal_products():
    result = build_targets(Body(25, "female", 160, 55), "light", "maintain", "vegan")
    text = " ".join(opt.lower() for meal in result["meals"] for opt in meal["options"])
    for word in ("paneer", "egg", "chicken", "fish", "curd", "milk "):
        assert word not in text


def test_luteal_phase_adds_energy_and_notes():
    base = build_targets(Body(28, "female", 165, 60), "moderate", "maintain", "vegetarian")
    luteal = build_targets(Body(28, "female", 165, 60), "moderate", "maintain", "vegetarian", "luteal")
    assert luteal["calories"] - base["calories"] == 150
    assert luteal["notes"]


def test_targets_endpoint_uses_profile_defaults(signup):
    me = signup(age=32, gender="female", height_cm=160, weight_kg=58, diet="vegan")
    res = me.post("/api/nutrition/targets", json={"goal": "lose_fat", "activity": "light"})
    assert res.status_code == 200
    assert res.get_json()["targets"]["macros"]["protein_g"] == 116

    incomplete = signup()
    res = incomplete.post("/api/nutrition/targets", json={"goal": "maintain"})
    assert res.status_code == 422


def test_diet_plan_filters(signup):
    me = signup()
    plans = me.get("/api/diet-plans?for_women=1").get_json()["plans"]
    assert plans and all(p["for_women"] for p in plans)
    assert me.get("/api/diet-plans?goal=sleep").status_code == 400
