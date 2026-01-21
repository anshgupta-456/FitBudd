# Adding Trainers to Database

If you're seeing an empty trainers list, follow these steps to add trainers:

## Option 1: Restart Backend Server (Recommended)

The backend automatically adds trainers when it starts if none exist. Simply:

1. Stop your backend server (Ctrl+C)
2. Restart it:
   ```bash
   cd backend
   python run.py
   ```

The `init_db()` function will automatically add trainers if the database is empty.

## Option 2: Manual Addition Script

If you need to add trainers manually:

1. **Activate virtual environment:**
   ```bash
   cd backend
   # Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   # Windows CMD:
   venv\Scripts\activate.bat
   # Mac/Linux:
   source venv/bin/activate
   ```

2. **Run the trainer addition script:**
   ```bash
   python add_trainers.py
   ```

## Option 3: Delete Database and Restart

If trainers still don't appear:

1. **Stop the backend server**

2. **Delete the database file:**
   ```bash
   # Windows:
   del backend\fitness_app.db
   # Mac/Linux:
   rm backend/fitness_app.db
   ```

3. **Restart the backend:**
   ```bash
   cd backend
   python run.py
   ```

This will recreate the database with all sample data including trainers.

## What Trainers Are Added?

The system adds:
- **11 Female Trainers** - Specialized in women's fitness, hormonal health, postnatal training, etc.
- **10 Male Trainers** - Specialized in strength training, athletic performance, bodybuilding, etc.

All trainers are marked as `is_available=True` and will appear in the trainers list.

## Verification

After adding trainers, you should see:
- Female users: 11 female-friendly trainers
- Male users: 10 male/unisex trainers

Check the trainers tab in the frontend to verify they're showing up!
