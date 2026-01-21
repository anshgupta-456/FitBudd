#!/usr/bin/env python3
"""
Quick script to initialize trainers immediately
Run: python init_trainers_now.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, ProfessionalTrainer
from app import init_db

def main():
    with app.app_context():
        print("Checking trainers in database...")
        trainers_count = ProfessionalTrainer.query.count()
        print(f"Current trainers: {trainers_count}")
        
        if trainers_count < 10:
            print("\nInitializing trainers...")
            try:
                init_db()
                new_count = ProfessionalTrainer.query.count()
                print(f"\n✅ Success! Now have {new_count} trainers in database.")
                
                # List all trainers
                trainers = ProfessionalTrainer.query.all()
                print(f"\nTrainers added:")
                for trainer in trainers:
                    print(f"  - {trainer.name} ({trainer.gender}) - ${trainer.hourly_rate}/hr")
            except Exception as e:
                print(f"\n❌ Error: {e}")
                import traceback
                traceback.print_exc()
        else:
            print(f"\n✅ Already have {trainers_count} trainers. No action needed.")

if __name__ == '__main__':
    main()
