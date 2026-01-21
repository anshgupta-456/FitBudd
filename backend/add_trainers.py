#!/usr/bin/env python3
"""
Script to add trainers to the database
Run this if trainers are missing from the database
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import app, db, ProfessionalTrainer
import json

def add_trainers():
    """Add trainers to the database"""
    with app.app_context():
        # Check if trainers already exist
        existing_count = ProfessionalTrainer.query.count()
        print(f"Current trainers in database: {existing_count}")
        
        if existing_count > 0:
            response = input(f"Found {existing_count} existing trainers. Do you want to add more? (y/n): ")
            if response.lower() != 'y':
                print("Skipping trainer addition.")
                return
        
        # Add trainers
        trainers = [
            # Female trainers (for female users)
            ProfessionalTrainer(
                name="Sarah Johnson",
                gender="female",
                specialization="Weight Loss, Women's Fitness, Postnatal Training",
                experience_years=8,
                certification=json.dumps(["NASM-CPT", "Pre & Postnatal Specialist", "Nutrition Coach"]),
                bio="Specialized in women's fitness with focus on sustainable weight loss and body confidence. Female-friendly environment.",
                rating=4.9,
                review_count=127,
                hourly_rate=75.0,
                is_available=True,
                female_friendly=True,
                location="Downtown Area",
                languages=json.dumps(["English", "Spanish"])
            ),
            ProfessionalTrainer(
                name="Emily Chen",
                gender="female",
                specialization="Yoga, Pilates, Flexibility Training",
                experience_years=6,
                certification=json.dumps(["RYT-500", "Pilates Instructor", "Women's Health Specialist"]),
                bio="Expert in women's wellness through yoga and pilates. Creating safe spaces for female clients.",
                rating=4.8,
                review_count=89,
                hourly_rate=65.0,
                is_available=True,
                female_friendly=True,
                location="Wellness District",
                languages=json.dumps(["English", "Mandarin"])
            ),
            ProfessionalTrainer(
                name="Priya Sharma",
                gender="female",
                specialization="Strength Training, Bodybuilding, Nutrition",
                experience_years=10,
                certification=json.dumps(["CSCS", "ISSA Nutrition", "Women's Strength Coach"]),
                bio="Empowering women through strength training. Specialized in female-specific training protocols.",
                rating=4.95,
                review_count=203,
                hourly_rate=85.0,
                is_available=True,
                female_friendly=True,
                location="Fitness Hub",
                languages=json.dumps(["English", "Hindi"])
            ),
            ProfessionalTrainer(
                name="Jessica Martinez",
                gender="female",
                specialization="Prenatal Fitness, Core Strength, Low Impact Training",
                experience_years=5,
                certification=json.dumps(["AFAA-CPT", "Prenatal Fitness Specialist", "Yoga Instructor"]),
                bio="Dedicated to supporting women through all life stages. Safe, effective training for expecting and new mothers.",
                rating=4.85,
                review_count=68,
                hourly_rate=70.0,
                is_available=True,
                female_friendly=True,
                location="Wellness District",
                languages=json.dumps(["English", "Spanish"])
            ),
            ProfessionalTrainer(
                name="Amanda Wilson",
                gender="female",
                specialization="Metabolic Conditioning, Fat Loss, Women's Strength",
                experience_years=9,
                certification=json.dumps(["ACSM-CPT", "Metabolic Specialist", "Women's Health Coach"]),
                bio="Expert in metabolic training and women's strength. Creating empowering fitness experiences.",
                rating=4.92,
                review_count=145,
                hourly_rate=80.0,
                is_available=True,
                female_friendly=True,
                location="Fitness Hub",
                languages=json.dumps(["English"])
            ),
            ProfessionalTrainer(
                name="Lisa Thompson",
                gender="female",
                specialization="Barre, Pilates, Flexibility, Posture Correction",
                experience_years=6,
                certification=json.dumps(["Barre Certified", "Pilates Instructor", "Posture Specialist"]),
                bio="Specialized in barre and pilates for women. Focus on flexibility, posture, and graceful strength.",
                rating=4.88,
                review_count=112,
                hourly_rate=65.0,
                is_available=True,
                female_friendly=True,
                location="Dance & Fitness Studio",
                languages=json.dumps(["English", "French"])
            ),
            ProfessionalTrainer(
                name="Sofia Patel",
                gender="female",
                specialization="PCOS Fitness, Hormonal Health, Weight Management",
                experience_years=7,
                certification=json.dumps(["NASM-CPT", "Hormonal Health Specialist", "PCOS Fitness Expert"]),
                bio="Specialized in helping women with PCOS and hormonal imbalances achieve their fitness goals safely and effectively.",
                rating=4.9,
                review_count=156,
                hourly_rate=78.0,
                is_available=True,
                female_friendly=True,
                location="Health & Wellness Center",
                languages=json.dumps(["English", "Gujarati", "Hindi"])
            ),
            ProfessionalTrainer(
                name="Maya Kumar",
                gender="female",
                specialization="Menopause Fitness, Bone Health, Strength Training",
                experience_years=9,
                certification=json.dumps(["ACSM-CPT", "Menopause Fitness Specialist", "Bone Health Expert"]),
                bio="Expert in supporting women through menopause with strength training and bone health focus.",
                rating=4.87,
                review_count=132,
                hourly_rate=72.0,
                is_available=True,
                female_friendly=True,
                location="Senior Fitness Center",
                languages=json.dumps(["English", "Hindi", "Tamil"])
            ),
            ProfessionalTrainer(
                name="Rachel Kim",
                gender="female",
                specialization="Dance Fitness, Cardio, Women's Empowerment",
                experience_years=5,
                certification=json.dumps(["Zumba Instructor", "Dance Fitness Specialist", "Group Fitness"]),
                bio="Energetic dance fitness instructor creating fun, empowering workouts for women of all fitness levels.",
                rating=4.83,
                review_count=98,
                hourly_rate=55.0,
                is_available=True,
                female_friendly=True,
                location="Dance Studio",
                languages=json.dumps(["English", "Korean"])
            ),
            ProfessionalTrainer(
                name="Aisha Hassan",
                gender="female",
                specialization="Postnatal Recovery, Core Rehabilitation, Women's Health",
                experience_years=8,
                certification=json.dumps(["Postnatal Specialist", "Core Rehabilitation Expert", "Women's Health Coach"]),
                bio="Dedicated to helping new mothers recover strength and confidence through safe, effective postnatal training.",
                rating=4.91,
                review_count=178,
                hourly_rate=76.0,
                is_available=True,
                female_friendly=True,
                location="Maternity Wellness Center",
                languages=json.dumps(["English", "Arabic", "Urdu"])
            ),
            ProfessionalTrainer(
                name="Nina Singh",
                gender="female",
                specialization="Yoga Therapy, Stress Management, Women's Wellness",
                experience_years=10,
                certification=json.dumps(["RYT-500", "Yoga Therapy", "Stress Management Specialist"]),
                bio="Therapeutic yoga instructor focusing on women's mental and physical wellness through mindful movement.",
                rating=4.86,
                review_count=145,
                hourly_rate=68.0,
                is_available=True,
                female_friendly=True,
                location="Yoga & Wellness Studio",
                languages=json.dumps(["English", "Hindi", "Punjabi"])
            ),
            # Male trainers (unisex, available to all)
            ProfessionalTrainer(
                name="Michael Rodriguez",
                gender="male",
                specialization="Strength Training, Athletic Performance",
                experience_years=12,
                certification=json.dumps(["CSCS", "USAW", "CPT"]),
                bio="Expert in strength and conditioning for all fitness levels. Unisex training approach.",
                rating=4.7,
                review_count=156,
                hourly_rate=70.0,
                is_available=True,
                female_friendly=False,
                location="Sports Complex",
                languages=json.dumps(["English", "Spanish"])
            ),
            ProfessionalTrainer(
                name="David Kim",
                gender="male",
                specialization="HIIT, Cardio, Weight Loss",
                experience_years=7,
                certification=json.dumps(["NASM-CPT", "HIIT Specialist"]),
                bio="High-intensity training specialist. Effective workouts for all genders.",
                rating=4.6,
                review_count=94,
                hourly_rate=60.0,
                is_available=True,
                female_friendly=False,
                location="City Center",
                languages=json.dumps(["English", "Korean"])
            ),
            ProfessionalTrainer(
                name="James Anderson",
                gender="male",
                specialization="Bodybuilding, Powerlifting, Strength Training",
                experience_years=15,
                certification=json.dumps(["CSCS", "USAPL Coach", "Nutrition Specialist"]),
                bio="Veteran strength coach specializing in powerlifting and bodybuilding. Unisex training approach.",
                rating=4.75,
                review_count=198,
                hourly_rate=90.0,
                is_available=True,
                female_friendly=False,
                location="Powerlifting Gym",
                languages=json.dumps(["English"])
            ),
            ProfessionalTrainer(
                name="Robert Chen",
                gender="male",
                specialization="Functional Training, Mobility, Injury Prevention",
                experience_years=11,
                certification=json.dumps(["FMS Certified", "Corrective Exercise Specialist", "Mobility Coach"]),
                bio="Functional movement specialist helping clients move better and prevent injuries. Suitable for all.",
                rating=4.7,
                review_count=134,
                hourly_rate=75.0,
                is_available=True,
                female_friendly=False,
                location="Rehabilitation Center",
                languages=json.dumps(["English", "Mandarin"])
            ),
            ProfessionalTrainer(
                name="Alex Thompson",
                gender="male",
                specialization="Athletic Performance, Sports Training, Speed & Agility",
                experience_years=13,
                certification=json.dumps(["CSCS", "Sports Performance Specialist", "Speed & Agility Coach"]),
                bio="Elite performance coach working with athletes and active individuals to maximize their potential.",
                rating=4.8,
                review_count=167,
                hourly_rate=85.0,
                is_available=True,
                female_friendly=False,
                location="Sports Performance Center",
                languages=json.dumps(["English"])
            ),
            ProfessionalTrainer(
                name="Marcus Williams",
                gender="male",
                specialization="Body Transformation, Fat Loss, Muscle Building",
                experience_years=10,
                certification=json.dumps(["NASM-CPT", "Body Transformation Specialist", "Nutrition Coach"]),
                bio="Results-driven trainer specializing in complete body transformations through strength and nutrition.",
                rating=4.72,
                review_count=189,
                hourly_rate=82.0,
                is_available=True,
                female_friendly=False,
                location="Transformation Fitness",
                languages=json.dumps(["English"])
            ),
            ProfessionalTrainer(
                name="Kevin Park",
                gender="male",
                specialization="Calisthenics, Bodyweight Training, Functional Strength",
                experience_years=6,
                certification=json.dumps(["Calisthenics Specialist", "Bodyweight Training Expert", "CPT"]),
                bio="Calisthenics expert teaching bodyweight mastery and functional strength for all levels.",
                rating=4.65,
                review_count=112,
                hourly_rate=65.0,
                is_available=True,
                female_friendly=False,
                location="Calisthenics Park",
                languages=json.dumps(["English", "Korean"])
            ),
            ProfessionalTrainer(
                name="Daniel Martinez",
                gender="male",
                specialization="Boxing Fitness, Cardio Conditioning, Self-Defense",
                experience_years=8,
                certification=json.dumps(["Boxing Coach", "Fitness Trainer", "Self-Defense Instructor"]),
                bio="Boxing fitness coach combining martial arts techniques with high-intensity cardio workouts.",
                rating=4.68,
                review_count=134,
                hourly_rate=70.0,
                is_available=True,
                female_friendly=False,
                location="Boxing Gym",
                languages=json.dumps(["English", "Spanish"])
            ),
            ProfessionalTrainer(
                name="Chris Johnson",
                gender="male",
                specialization="CrossFit, Functional Fitness, Endurance Training",
                experience_years=9,
                certification=json.dumps(["CrossFit L2", "Functional Fitness Specialist", "Endurance Coach"]),
                bio="CrossFit coach specializing in functional movements and high-intensity training for all fitness levels.",
                rating=4.74,
                review_count=156,
                hourly_rate=75.0,
                is_available=True,
                female_friendly=False,
                location="CrossFit Box",
                languages=json.dumps(["English"])
            ),
            ProfessionalTrainer(
                name="Ryan O'Connor",
                gender="male",
                specialization="Rehabilitation, Injury Recovery, Corrective Exercise",
                experience_years=12,
                certification=json.dumps(["Physical Therapy Assistant", "Corrective Exercise Specialist", "Injury Recovery Expert"]),
                bio="Rehabilitation specialist helping clients recover from injuries and prevent future problems through targeted exercise.",
                rating=4.79,
                review_count=201,
                hourly_rate=88.0,
                is_available=True,
                female_friendly=False,
                location="Rehabilitation Clinic",
                languages=json.dumps(["English"])
            ),
        ]
        
        for trainer in trainers:
            db.session.add(trainer)
        
        try:
            db.session.commit()
            print(f"✓ Successfully added {len(trainers)} trainers to the database!")
            print(f"  - {sum(1 for t in trainers if t.gender == 'female')} female trainers")
            print(f"  - {sum(1 for t in trainers if t.gender == 'male')} male trainers")
        except Exception as e:
            db.session.rollback()
            print(f"✗ Error adding trainers: {e}")
            return False
        
        return True

if __name__ == '__main__':
    print("Adding trainers to database...")
    add_trainers()
    print("Done!")
