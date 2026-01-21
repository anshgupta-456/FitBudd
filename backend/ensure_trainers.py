#!/usr/bin/env python3
"""
Quick script to ensure trainers exist in the database
Run: python ensure_trainers.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, ProfessionalTrainer
import json

def ensure_trainers():
    """Ensure trainers exist in the database"""
    with app.app_context():
        trainers_count = ProfessionalTrainer.query.count()
        print(f"Current trainers in database: {trainers_count}")
        
        if trainers_count < 10:
            print("Adding trainers to database...")
            from app import init_db
            try:
                init_db()
                new_count = ProfessionalTrainer.query.count()
                print(f"✅ Successfully initialized database. Now have {new_count} trainers.")
            except Exception as e:
                print(f"❌ Error: {e}")
        else:
            print(f"✅ Database already has {trainers_count} trainers.")
        
        # List all trainers
        trainers = ProfessionalTrainer.query.all()
        print(f"\nTrainers in database:")
        for trainer in trainers:
            print(f"  - {trainer.name} ({trainer.gender}) - ${trainer.hourly_rate}/hr - Available: {trainer.is_available}")

if __name__ == '__main__':
    ensure_trainers()
