"""Sample data so a fresh install has gyms, trainers, plans and people to train with.

Run `flask --app wsgi seed` to fill an empty database, or `flask --app wsgi reset-db`
to wipe and refill it. The demo login is DEMO_EMAIL / DEMO_PASSWORD below.
"""

import random
from datetime import datetime, time, timedelta

import click
from flask import Flask, current_app

from .auth import UNUSABLE_PASSWORD, hash_password
from .clock import local_today
from .extensions import db
from .models import (
    ClassBooking, Connection, DietPlan, Gym, GymAmenity, Measurement, Message, StudioClass, Trainer, User, Workout,
    utcnow,
)
from .timetable import ensure_timetable

DEMO_EMAIL = "demo@fitbudd.app"
DEMO_PASSWORD = "fitbudd-demo"

# ---------------------------------------------------------------- gyms
# (name, area, city, address, rating, reviews, monthly, day pass, weekday hrs, weekend hrs, women-only hrs,
#  amenities, equipment, classes, description)
GYMS = [
    ("Ironworks Strength Club", "Indiranagar", "Bengaluru", "12th Main, HAL 2nd Stage, Indiranagar", 4.7, 412, 3500, 400,
     "05:30-22:30", "07:00-20:00", None,
     ["Showers", "Lockers", "Air conditioning", "Personal training"],
     ["Squat racks (6)", "Deadlift platforms (3)", "Dumbbells to 50 kg", "Cable stations", "Rowers", "Assault bikes"],
     ["Barbell club", "Olympic lifting"],
     "A lifting-first gym with proper racks and calibrated plates. Coaches on the floor at peak hours."),
    ("Pulse 24x7", "Koramangala", "Bengaluru", "80 Feet Road, Koramangala 4th Block", 4.3, 958, 2200, 300,
     "Open 24 hours", "Open 24 hours", "06:00-08:00 daily",
     ["Showers", "Lockers", "Air conditioning", "Parking", "Wi-Fi"],
     ["Treadmills (20)", "Ellipticals", "Smith machines", "Leg press", "Dumbbells to 40 kg", "Functional zone"],
     ["Spin", "Zumba", "Core"],
     "Round-the-clock access with a large cardio floor. Busy 7-9 pm, quiet after 10."),
    ("Kinetic Studio", "HSR Layout", "Bengaluru", "27th Main, Sector 1, HSR Layout", 4.8, 233, 4800, None,
     "06:00-21:00", "07:00-13:00", None,
     ["Showers", "Lockers", "Physio room", "Personal training"],
     ["Reformers (8)", "Kettlebells", "Sleds", "Turf lane", "Rigs"],
     ["Reformer Pilates", "Mobility", "Small-group strength"],
     "Small boutique space focused on coached small groups. Membership includes a monthly movement screen."),
    ("Urban Grit", "Whitefield", "Bengaluru", "ITPL Main Road, Whitefield", 4.1, 624, 1800, 250,
     "05:00-23:00", "06:00-21:00", "11:00-13:00 weekdays",
     ["Parking", "Lockers", "Showers", "Cafe"],
     ["Treadmills", "Cable crossover", "Dumbbells to 45 kg", "Squat racks (3)", "Battle ropes"],
     ["HIIT", "Yoga"],
     "No-frills neighbourhood gym near the tech parks. Good value if you train early."),
    ("Tempo Fitness", "Jayanagar", "Bengaluru", "4th Block, Jayanagar", 4.5, 341, 2800, 350,
     "05:30-22:00", "06:00-20:00", "14:00-16:00 daily",
     ["Steam room", "Showers", "Lockers", "Air conditioning", "Personal training"],
     ["Hammer Strength machines", "Squat racks (4)", "Dumbbells to 50 kg", "Rowers", "Spin bikes"],
     ["Spin", "Bollywood dance", "Yoga"],
     "Well-kept machines and a friendly crowd. The spin studio is popular on weekday mornings."),
    ("Forge Athletic", "Bandra West", "Mumbai", "Hill Road, Bandra West", 4.6, 517, 5500, 700,
     "06:00-22:00", "07:00-19:00", None,
     ["Showers", "Lockers", "Air conditioning", "Cafe", "Personal training"],
     ["Squat racks (5)", "Olympic platforms", "Sleds", "SkiErgs", "Rowers", "Dumbbells to 50 kg"],
     ["Conditioning", "Strength cycle"],
     "Serious training floor with a strong conditioning programme. Book the platforms at peak times."),
    ("Steel Republic", "Andheri West", "Mumbai", "Lokhandwala Complex, Andheri West", 4.2, 1104, 2500, 300,
     "05:00-23:00", "06:00-22:00", "12:00-14:00 daily",
     ["Parking", "Showers", "Lockers", "Air conditioning", "Steam room"],
     ["Treadmills (25)", "Leg press", "Pec deck", "Cable stations", "Dumbbells to 45 kg"],
     ["Zumba", "Spin", "Yoga", "Kickboxing"],
     "Big commercial gym with long hours and lots of classes included in the fee."),
    ("Harbour Lifting Co.", "Lower Parel", "Mumbai", "Senapati Bapat Marg, Lower Parel", 4.9, 186, 6500, None,
     "06:00-21:30", "08:00-14:00", None,
     ["Showers", "Lockers", "Physio room", "Personal training", "Air conditioning"],
     ["Competition racks", "Calibrated plates", "Specialty bars", "Deadlift platforms (4)", "Reverse hyper"],
     ["Powerlifting team", "Technique clinic"],
     "Powerlifting gym with coached programmes and monthly mock meets."),
    ("Seaside Fitness", "Powai", "Mumbai", "Hiranandani Gardens, Powai", 4.4, 389, 3200, 400,
     "05:30-22:00", "06:00-20:00", "06:00-07:30 daily",
     ["Pool", "Showers", "Lockers", "Parking", "Air conditioning"],
     ["25 m pool", "Treadmills", "Cable stations", "Dumbbells to 40 kg", "Squat racks (2)"],
     ["Aqua aerobics", "Yoga", "Spin"],
     "The only gym in Powai with a lap pool included in the membership."),
    ("Atlas Barbell", "Saket", "Delhi", "Press Enclave Road, Saket", 4.6, 452, 3800, 450,
     "05:30-22:30", "07:00-20:00", "10:00-12:00 weekends",
     ["Showers", "Lockers", "Air conditioning", "Personal training", "Parking"],
     ["Squat racks (6)", "Deadlift platforms", "Dumbbells to 60 kg", "Sleds", "Assault bikes"],
     ["Women's strength", "Metcon"],
     "Strength gym with a women's lifting programme run by female coaches."),
    ("Peak Performance Centre", "Hauz Khas", "Delhi", "Aurobindo Marg, Hauz Khas", 4.3, 702, 2900, 350,
     "05:00-23:00", "06:00-21:00", "13:00-15:00 daily",
     ["Steam room", "Showers", "Lockers", "Air conditioning", "Cafe"],
     ["Treadmills", "Ellipticals", "Leg press", "Smith machine", "Dumbbells to 45 kg", "Functional zone"],
     ["Spin", "Yoga", "Bhangra fit"],
     "All-round gym with a good mix of machines and free weights. Steam room after 6 pm is a bonus."),
    ("Core & Co.", "Greater Kailash", "Delhi", "M Block Market, Greater Kailash 1", 4.7, 158, 5200, None,
     "06:30-20:30", "08:00-13:00", "All day (women-only floor)",
     ["Showers", "Lockers", "Creche", "Physio room", "Personal training"],
     ["Reformers (6)", "Kettlebells", "Dumbbells to 30 kg", "Cable column", "Rowers"],
     ["Pre/postnatal", "Pilates", "Strength for women"],
     "Women-only studio with a creche. Strong focus on pre- and postnatal training."),
]

# ---------------------------------------------------------------- trainers
# (name, gender, headline, specialties, certifications, languages, years, city, areas, rating, reviews, rate,
#  women focus, bio)
TRAINERS = [
    ("Kavya Iyer", "female", "Strength coach for beginners and women returning to training",
     ["strength", "fat_loss"], ["NSCA-CSCS", "Precision Nutrition L1"], ["English", "Tamil", "Kannada"], 8,
     "Bengaluru", "HSR Layout, Koramangala, BTM", 4.9, 142, 1800, True,
     "I spent six years coaching at a barbell gym before going independent. Most of my clients have never lifted "
     "before. We start with bodyweight and dumbbells at home and build from there."),
    ("Rohit Shetty", "male", "Conditioning and fat-loss programmes that fit around work",
     ["fat_loss", "sport"], ["ACE CPT", "CrossFit L2"], ["English", "Kannada", "Hindi"], 6,
     "Bengaluru", "Whitefield, Marathahalli, Bellandur", 4.6, 98, 1400, False,
     "Short, hard sessions for people with long working days. I bring kettlebells, bands and a mat."),
    ("Meera Pillai", "female", "Mobility, yoga and back-pain rehab",
     ["mobility"], ["RYT-500", "FRC Mobility Specialist"], ["English", "Malayalam", "Hindi"], 11,
     "Bengaluru", "Indiranagar, Domlur, CV Raman Nagar", 4.8, 203, 1600, True,
     "I work a lot with desk workers and people coming back from injury. Sessions mix mobility drills, "
     "yoga and simple strength work."),
    ("Arjun Menon", "male", "Sports performance for runners and racket players",
     ["sport", "strength"], ["NSCA-CSCS", "World Athletics Level 1"], ["English", "Malayalam"], 9,
     "Bengaluru", "Jayanagar, JP Nagar, Banashankari", 4.7, 76, 2000, False,
     "Former state-level 800 m runner. I build strength and speed programmes around your race or match calendar."),
    ("Tanya Mehta", "female", "Pre and postnatal training",
     ["prenatal", "mobility", "strength"], ["GGS Pre/Postnatal Coach", "ACSM-CPT"], ["English", "Hindi", "Gujarati"], 10,
     "Mumbai", "Bandra, Khar, Santacruz", 4.9, 167, 2500, True,
     "I help women train safely through pregnancy and rebuild afterwards, working with your doctor where needed."),
    ("Karan Malhotra", "male", "Muscle gain and body recomposition",
     ["strength", "nutrition"], ["K11 Certified Trainer", "ISSA Nutritionist"], ["English", "Hindi", "Punjabi"], 7,
     "Mumbai", "Andheri, Juhu, Versova", 4.5, 121, 1500, False,
     "Hypertrophy programmes with home dumbbells or your building gym, plus a simple eating plan you can stick to."),
    ("Pooja Naik", "female", "Fat loss and lifestyle coaching",
     ["fat_loss", "nutrition"], ["ACE CPT", "Precision Nutrition L1"], ["English", "Marathi", "Hindi"], 5,
     "Mumbai", "Powai, Vikhroli, Ghatkopar", 4.7, 88, 1300, True,
     "Steady, sustainable fat loss. We train twice a week and I check in on food and steps in between."),
    ("Vikram Desai", "male", "Senior fitness and balance",
     ["mobility", "strength"], ["ACSM-CPT", "Senior Fitness Specialist"], ["English", "Hindi", "Marathi", "Gujarati"], 14,
     "Mumbai", "Dadar, Matunga, Worli", 4.8, 64, 1700, False,
     "Most of my clients are over 55. We work on strength, balance and confidence so everyday life gets easier."),
    ("Harleen Kaur", "female", "Strength training for women",
     ["strength", "fat_loss"], ["NSCA-CPT", "USA Weightlifting L1"], ["English", "Hindi", "Punjabi"], 8,
     "Delhi", "Saket, Malviya Nagar, Hauz Khas", 4.9, 154, 1900, True,
     "I coach women-only and run the women's strength class at Iron Yard. Home sessions use dumbbells and bands."),
    ("Siddharth Rana", "male", "Athletic conditioning and boxing fitness",
     ["sport", "fat_loss"], ["ACE CPT", "AIBA Level 1 Coach"], ["English", "Hindi"], 6,
     "Delhi", "Dwarka, Janakpuri, Vasant Kunj", 4.4, 71, 1200, False,
     "Pad work, footwork and conditioning circuits. A fun way to get fit if the gym bores you."),
    ("Ritu Sharma", "female", "Postnatal recovery and core rehab",
     ["prenatal", "mobility"], ["Pilates Mat & Reformer (STOTT)", "GGS Pre/Postnatal Coach"], ["English", "Hindi"], 12,
     "Delhi", "Greater Kailash, Defence Colony, Lajpat Nagar", 4.8, 132, 2200, True,
     "Pelvic floor, diastasis and core rebuilding after birth, then a gradual return to full training."),
    ("Aman Kapoor", "male", "Nutrition-led weight loss",
     ["nutrition", "fat_loss"], ["Precision Nutrition L2", "ACE CPT"], ["English", "Hindi", "Bengali"], 9,
     "Delhi", "Connaught Place, Karol Bagh, Rajinder Nagar", 4.6, 109, 1600, False,
     "Half nutrition coaching, half training. We fix the plate first and use workouts to keep muscle while you lose fat."),
]

# ---------------------------------------------------------------- diet plans
DIET_PLANS = [
    dict(name="Vegetarian fat loss, 1600 kcal", goal="lose_fat", diet="vegetarian", for_women=False,
         daily_calories=1600, protein_g=105, author="Pooja Naik",
         summary="High-protein vegetarian day built on paneer, dal and curd. Keeps you full on fewer calories.",
         meals=[
             {"name": "Breakfast", "calories": 380, "items": ["Moong dal chilla (2)", "Mint chutney", "Hung curd (100 g)"]},
             {"name": "Lunch", "calories": 520, "items": ["2 phulkas", "Rajma (1 katori)", "Cucumber raita", "Salad"]},
             {"name": "Snack", "calories": 180, "items": ["Roasted chana (30 g)", "1 apple"]},
             {"name": "Dinner", "calories": 520, "items": ["Paneer tikka (120 g)", "Sauteed vegetables", "1 roti"]},
         ]),
    dict(name="Non-veg fat loss, 1800 kcal", goal="lose_fat", diet="non_vegetarian", for_women=False,
         daily_calories=1800, protein_g=140, author="Aman Kapoor",
         summary="Chicken, eggs and fish do the heavy lifting on protein so you keep muscle in a deficit.",
         meals=[
             {"name": "Breakfast", "calories": 420, "items": ["Masala omelette (3 eggs)", "1 multigrain toast", "Black coffee or tea"]},
             {"name": "Lunch", "calories": 600, "items": ["Brown rice (1 cup cooked)", "Chicken curry (150 g)", "Beans sabzi"]},
             {"name": "Snack", "calories": 180, "items": ["Buttermilk", "Handful of almonds"]},
             {"name": "Dinner", "calories": 600, "items": ["Grilled fish (200 g)", "Stir-fried greens", "1 roti"]},
         ]),
    dict(name="Vegan muscle gain, 2600 kcal", goal="build_muscle", diet="vegan", for_women=False,
         daily_calories=2600, protein_g=135, author="Karan Malhotra",
         summary="Soy, legumes and a daily shake get a plant-based lifter to their protein target.",
         meals=[
             {"name": "Breakfast", "calories": 650, "items": ["Overnight oats with soy milk", "Peanut butter (2 tbsp)", "Banana"]},
             {"name": "Lunch", "calories": 750, "items": ["Quinoa pulao", "Chana masala", "Kachumber salad"]},
             {"name": "Snack", "calories": 450, "items": ["Pea protein shake", "Dates (3)", "Roasted peanuts"]},
             {"name": "Dinner", "calories": 750, "items": ["Tofu stir-fry (200 g)", "Brown rice", "Dal"]},
         ]),
    dict(name="Eggetarian muscle gain, 2800 kcal", goal="build_muscle", diet="eggetarian", for_women=False,
         daily_calories=2800, protein_g=150, author="Karan Malhotra",
         summary="Eggs, milk and paneer through the day with plenty of rice and roti for training fuel.",
         meals=[
             {"name": "Breakfast", "calories": 700, "items": ["4-egg bhurji", "2 parathas", "Glass of milk"]},
             {"name": "Lunch", "calories": 800, "items": ["Rice (1.5 cups)", "Dal makhani", "Paneer bhurji", "Salad"]},
             {"name": "Snack", "calories": 450, "items": ["Banana shake with peanut butter", "2 boiled eggs"]},
             {"name": "Dinner", "calories": 850, "items": ["Egg curry (3 eggs)", "3 rotis", "Mixed veg"]},
         ]),
    dict(name="Balanced vegetarian maintenance, 2000 kcal", goal="maintain", diet="vegetarian", for_women=False,
         daily_calories=2000, protein_g=95, author="Meera Pillai",
         summary="A normal Indian thali, portioned. For people happy with their weight who want steady energy.",
         meals=[
             {"name": "Breakfast", "calories": 450, "items": ["Vegetable upma", "Glass of milk", "Fruit"]},
             {"name": "Lunch", "calories": 650, "items": ["2 rotis", "Dal", "Seasonal sabzi", "Curd", "Salad"]},
             {"name": "Snack", "calories": 250, "items": ["Sprouts chaat", "Green tea"]},
             {"name": "Dinner", "calories": 650, "items": ["Millet khichdi", "Kadhi", "Papad"]},
         ]),
    dict(name="Iron-rich plan for women, 1700 kcal", goal="maintain", diet="vegetarian", for_women=True,
         daily_calories=1700, protein_g=90, author="Kavya Iyer",
         summary="Extra iron, calcium and folate from Indian staples, paired with vitamin C for absorption. "
                 "Useful around your period or if you've been told your iron is low.",
         meals=[
             {"name": "Breakfast", "calories": 400, "items": ["Ragi dosa (2)", "Peanut chutney", "Glass of orange juice"]},
             {"name": "Lunch", "calories": 550, "items": ["Palak paneer", "2 bajra rotis", "Beetroot salad with lemon"]},
             {"name": "Snack", "calories": 200, "items": ["Jaggery and roasted chana", "Guava"]},
             {"name": "Dinner", "calories": 550, "items": ["Masoor dal", "Brown rice", "Methi sabzi", "Curd"]},
         ]),
    dict(name="Postnatal recovery, 2100 kcal", goal="maintain", diet="vegetarian", for_women=True,
         daily_calories=2100, protein_g=100, author="Ritu Sharma",
         summary="Enough energy and protein for recovery and breastfeeding, with traditional foods like "
                 "methi, ajwain and dry fruits. Check with your doctor before cutting calories.",
         meals=[
             {"name": "Breakfast", "calories": 500, "items": ["Dalia with milk and dry fruits", "Methi thepla (1)"]},
             {"name": "Lunch", "calories": 650, "items": ["2 rotis", "Moong dal", "Lauki sabzi", "Curd"]},
             {"name": "Snack", "calories": 300, "items": ["Gond or dry-fruit laddoo (1)", "Ajwain water", "Fruit"]},
             {"name": "Dinner", "calories": 650, "items": ["Vegetable khichdi", "Ghee (1 tsp)", "Paneer (80 g)"]},
         ]),
    dict(name="Lean non-veg for women, 1500 kcal", goal="lose_fat", diet="non_vegetarian", for_women=True,
         daily_calories=1500, protein_g=110, author="Harleen Kaur",
         summary="Gentle deficit with high protein to protect muscle, built for women lifting 3-4 times a week.",
         meals=[
             {"name": "Breakfast", "calories": 350, "items": ["2 eggs + 2 whites omelette", "1 toast", "Papaya"]},
             {"name": "Lunch", "calories": 500, "items": ["Chicken tikka salad (150 g)", "1 roti", "Raita"]},
             {"name": "Snack", "calories": 150, "items": ["Hung curd with cinnamon", "Few walnuts"]},
             {"name": "Dinner", "calories": 500, "items": ["Fish curry (150 g)", "Half cup rice", "Stir-fried beans"]},
         ]),
]

# ---------------------------------------------------------------- members
# (name, gender, age, city, level, goals, time, bio)
MEMBERS = [
    ("Ananya Rao", "female", 27, "Bengaluru", "intermediate", ["get_stronger", "endurance"], "morning",
     "Training for my first half marathon in January. Looking for someone to do long runs with at Cubbon Park."),
    ("Vivek Narayan", "male", 31, "Bengaluru", "intermediate", ["build_muscle", "get_stronger"], "evening",
     "Lifting for about three years. Want a spotter and someone to keep me honest on leg day."),
    ("Ishita Bose", "female", 29, "Bengaluru", "beginner", ["lose_fat", "stay_active"], "morning",
     "New to the gym and a bit nervous. Would love a buddy to go with a couple of times a week."),
    ("Rahul Gowda", "male", 35, "Bengaluru", "advanced", ["endurance", "get_stronger"], "morning",
     "Cyclist, 200 km a week. Doing strength in the off-season and happy to share what I've learned."),
    ("Divya Krishnan", "female", 33, "Bengaluru", "intermediate", ["mobility", "get_stronger"], "evening",
     "Yoga teacher who's started lifting. Looking for a lifting partner, can trade mobility tips."),
    ("Nikhil Verma", "male", 26, "Bengaluru", "beginner", ["build_muscle"], "evening",
     "Software engineer, started working out this year. Free after 7 pm most days."),
    ("Sneha Patil", "female", 30, "Mumbai", "intermediate", ["lose_fat", "endurance"], "morning",
     "Morning runner along Marine Drive. Want company for the 6 am runs."),
    ("Aditya Joshi", "male", 28, "Mumbai", "advanced", ["get_stronger"], "evening",
     "Powerlifter, competing in the state meet. Looking for a training partner at a similar level."),
    ("Fatima Shaikh", "female", 25, "Mumbai", "beginner", ["stay_active", "mobility"], "afternoon",
     "Work from home and want an excuse to get out. Badminton, walks, anything really."),
    ("Rohan Kulkarni", "male", 38, "Mumbai", "intermediate", ["lose_fat", "stay_active"], "morning",
     "Dad of two trying to get back in shape. Mornings before work are my only window."),
    ("Priya Nair", "female", 32, "Mumbai", "intermediate", ["build_muscle", "get_stronger"], "evening",
     "Into strength training and Pilates. Would like a partner for evening sessions in Andheri."),
    ("Arjun Singh", "male", 30, "Delhi", "intermediate", ["build_muscle", "endurance"], "evening",
     "Gym five days a week, football on Sundays. Always up for a game."),
    ("Meghna Arora", "female", 27, "Delhi", "beginner", ["lose_fat", "get_stronger"], "morning",
     "Just joined the women's strength class. Want a buddy for the extra sessions."),
    ("Sahil Chopra", "male", 34, "Delhi", "advanced", ["endurance"], "morning",
     "Trail runner and triathlete. Weekend long runs in the Aravallis."),
    ("Neha Gupta", "female", 36, "Delhi", "intermediate", ["mobility", "stay_active"], "afternoon",
     "Pickleball and yoga. Looking for doubles partners in South Delhi."),
    ("Kunal Bhatia", "male", 24, "Delhi", "beginner", ["build_muscle", "lose_fat"], "evening",
     "Student, just started lifting. Happy to learn from anyone more experienced."),
]


def _member_email(name: str) -> str:
    return name.lower().replace(" ", ".") + "@members.fitbudd.app"


def seed_reference_data() -> None:
    for (name, area, city, address, rating, reviews, monthly, day_pass, wk, we, women, amenities, equipment,
         classes, description) in GYMS:
        gym = Gym(
            name=name, area=area, city=city, address=address, rating=rating, review_count=reviews,
            price_per_month=monthly, day_pass=day_pass, weekday_hours=wk, weekend_hours=we,
            women_only_hours=women, equipment=equipment, classes=classes, description=description,
        )
        gym.amenities = [GymAmenity(name=a) for a in amenities]
        db.session.add(gym)

    for (name, gender, headline, specialties, certs, languages, years, city, areas, rating, reviews, rate,
         women_focus, bio) in TRAINERS:
        db.session.add(Trainer(
            name=name, gender=gender, headline=headline, specialties=specialties, certifications=certs,
            languages=languages, experience_years=years, city=city, areas=areas, rating=rating,
            review_count=reviews, hourly_rate=rate, women_clients_focus=women_focus, bio=bio,
        ))

    for plan in DIET_PLANS:
        db.session.add(DietPlan(**plan))

    for name, gender, age, city, level, goals, when, bio in MEMBERS:
        db.session.add(User(
            name=name, email=_member_email(name), password_hash=UNUSABLE_PASSWORD,
            gender=gender, age=age, city=city, fitness_level=level, goals=goals, preferred_time=when, bio=bio,
            diet="vegetarian",
        ))
    db.session.commit()


def seed_demo_account() -> User:
    """A signed-in view with some history: past workouts, weigh-ins, partners and a booked class."""
    today = local_today()
    rng = random.Random(42)
    demo = User(
        name="Riya Kapoor", email=DEMO_EMAIL, password_hash=hash_password(DEMO_PASSWORD), gender="female", age=28,
        height_cm=164, weight_kg=63.4, city="Bengaluru", fitness_level="intermediate",
        goals=["get_stronger", "endurance"], preferred_time="morning", diet="eggetarian",
        bio="Product designer. Lifting three days a week and building up to a 10K.",
    )
    db.session.add(demo)
    db.session.flush()

    # Six weeks of history on a Mon / Wed / Fri lifting + Sat run pattern, plus this week's plan.
    plan = {
        0: ("Lower body: squat focus", "strength", 60, "07:00"),
        2: ("Upper body: press and pull", "strength", 55, "07:00"),
        4: ("Full body + carries", "strength", 50, "07:00"),
        5: ("Easy run, 6 km", "cardio", 40, "06:30"),
    }
    week_start = today - timedelta(days=today.weekday())
    for week in range(-6, 1):
        for weekday, (title, kind, minutes, start) in plan.items():
            day = week_start + timedelta(weeks=week, days=weekday)
            if day < today:
                status = "skipped" if rng.random() < 0.12 else "done"
            else:
                status = "planned"
            db.session.add(Workout(
                user_id=demo.id, title=title, kind=kind, date=day, start_time=time.fromisoformat(start),
                duration_min=minutes + (rng.choice([-5, 0, 5]) if status == "done" else 0),
                location="Ironworks Strength Club" if kind == "strength" else "Cubbon Park",
                status=status, effort=rng.randint(6, 8) if status == "done" else None,
                completed_at=datetime.combine(day, time(8)) if status == "done" else None,
            ))

    # Weekly weigh-ins drifting down slowly, with real-world noise.
    weight = 65.2
    for week in range(10, -1, -1):
        weight -= rng.uniform(0.05, 0.3)
        logged = round(weight + rng.uniform(-0.2, 0.2), 1)
        db.session.add(Measurement(
            user_id=demo.id, date=today - timedelta(weeks=week), weight_kg=logged,
            waist_cm=round(76 - (10 - week) * 0.25, 1) if week % 2 == 0 else None,
            resting_hr=rng.randint(58, 64) if week % 3 == 0 else None,
        ))
    demo.weight_kg = logged  # profile weight follows the latest weigh-in

    members = {u.name: u for u in db.session.scalars(db.select(User).where(User.id != demo.id))}
    ananya, divya, ishita, vivek = (members[n] for n in ("Ananya Rao", "Divya Krishnan", "Ishita Bose", "Vivek Narayan"))
    now = utcnow()
    db.session.add_all([
        Connection(requester_id=ananya.id, addressee_id=demo.id, status="accepted",
                   created_at=now - timedelta(days=20), responded_at=now - timedelta(days=19)),
        Connection(requester_id=demo.id, addressee_id=divya.id, status="accepted",
                   created_at=now - timedelta(days=9), responded_at=now - timedelta(days=8)),
        Connection(requester_id=ishita.id, addressee_id=demo.id, status="pending",
                   note="Hi! Saw you train at Ironworks too. Would you be up for a Wednesday session sometime?",
                   created_at=now - timedelta(hours=5)),
        Connection(requester_id=demo.id, addressee_id=vivek.id, status="pending", created_at=now - timedelta(days=1)),
    ])
    thread = [
        (ananya, now - timedelta(days=2, hours=3), "Are you running Saturday? I'm doing 10 km, can drop to 6 with you."),
        (demo, now - timedelta(days=2, hours=2), "Yes! 6:30 at the Queen's statue gate?"),
        (ananya, now - timedelta(days=2, hours=2), "Perfect, see you there."),
        (ananya, now - timedelta(hours=1), "Same time this week? Weather says it'll be cooler."),
    ]
    for sender, sent_at, body in thread:
        recipient = demo if sender is ananya else ananya
        db.session.add(Message(sender_id=sender.id, recipient_id=recipient.id, body=body, sent_at=sent_at,
                               read_at=sent_at if sender is demo or sent_at < now - timedelta(days=1) else None))
    db.session.add_all([
        Message(sender_id=demo.id, recipient_id=divya.id, body="Thanks for the hip mobility routine, it really helped my squat.",
                sent_at=now - timedelta(days=6)),
        Message(sender_id=divya.id, recipient_id=demo.id, body="Glad it helped! Do it before every lower session for a few weeks.",
                sent_at=now - timedelta(days=6) + timedelta(minutes=40), read_at=now - timedelta(days=5)),
    ])
    db.session.commit()
    return demo


def seed_if_empty() -> bool:
    if db.session.scalar(db.select(Gym.id).limit(1)) is not None:
        ensure_timetable(current_app.config["TIMETABLE_DAYS"])
        return False
    seed_reference_data()
    demo = seed_demo_account()
    ensure_timetable(current_app.config["TIMETABLE_DAYS"])

    # Book the demo account into the next Bengaluru yoga class so the dashboard isn't empty.
    upcoming = db.session.scalar(
        db.select(StudioClass)
        .where(StudioClass.city == "Bengaluru", StudioClass.category == "yoga",
               StudioClass.starts_at > datetime.combine(local_today() + timedelta(days=1), time()))
        .order_by(StudioClass.starts_at)
    )
    if upcoming and upcoming.booked < upcoming.capacity:
        db.session.add(ClassBooking(user_id=demo.id, class_id=upcoming.id, status="confirmed"))
        db.session.commit()
    current_app.logger.info("Seeded sample data. Demo login: %s", DEMO_EMAIL)
    return True


def register_cli(app: Flask) -> None:
    @app.cli.command("seed")
    def seed_command():
        """Fill an empty database with sample data."""
        click.echo("Seeded." if seed_if_empty() else "Database already has data; nothing to do.")

    @app.cli.command("reset-db")
    @click.confirmation_option(prompt="This deletes every account and booking. Continue?")
    def reset_command():
        """Drop all tables and reseed."""
        db.drop_all()
        db.create_all()
        seed_if_empty()
        click.echo("Database reset and reseeded.")
