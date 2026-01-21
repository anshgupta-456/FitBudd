from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import hashlib
import jwt
import datetime
import os
from werkzeug.security import generate_password_hash, check_password_hash
import json
import random
import numpy as np
import cv2
import mediapipe as mp
import base64
from io import BytesIO
from PIL import Image
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import pandas as pd
import logging

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')
DATABASE = 'fitness_app.db'

# Database helper functions
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize MediaPipe
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)

# Enhanced Database initialization
def init_db():
    """Initialize the database with required tables"""
    conn = get_db_connection()
    
    # Users table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            age INTEGER,
            height REAL,
            weight REAL,
            fitness_level TEXT,
            goals TEXT,
            location TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Workouts table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS workouts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            type TEXT,
            duration INTEGER,
            calories_burned INTEGER,
            exercises TEXT,
            date_completed DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # User progress table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS user_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            date DATE,
            weight REAL,
            body_fat_percentage REAL,
            measurements TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Enhanced Partners table with matching scores and interaction history
    conn.execute('''
        CREATE TABLE IF NOT EXISTS partners (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            partner_id INTEGER NOT NULL,
            status TEXT CHECK(status IN ('pending', 'accepted', 'declined', 'blocked')) DEFAULT 'pending',
            compatibility_score REAL,
            match_factors TEXT, -- JSON object with detailed matching factors
            connection_type TEXT DEFAULT 'workout_buddy', -- workout_buddy, trainer, trainee, group
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_interaction TIMESTAMP,
            interaction_count INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (partner_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(user_id, partner_id)
        )
    ''')
    
    # Partner preferences table for advanced filtering
    conn.execute('''
        CREATE TABLE IF NOT EXISTS partner_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            min_age INTEGER,
            max_age INTEGER,
            preferred_fitness_levels TEXT, -- JSON array
            max_distance_km INTEGER,
            preferred_workout_times TEXT, -- JSON array
            preferred_goals TEXT, -- JSON array
            gender_preference TEXT,
            language_preferences TEXT, -- JSON array
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # Enhanced Messages table with message types and status
    conn.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            message_type TEXT DEFAULT 'text', -- text, image, workout_plan, workout_invite
            is_read BOOLEAN DEFAULT FALSE,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read_at TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # User interactions for ML recommendations
    conn.execute('''
        CREATE TABLE IF NOT EXISTS user_interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            target_user_id INTEGER NOT NULL,
            interaction_type TEXT NOT NULL, -- view, like, message, workout_together, block
            interaction_value REAL DEFAULT 1.0, -- weight of interaction
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (target_user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # Workout sessions for partner compatibility
    conn.execute('''
        CREATE TABLE IF NOT EXISTS workout_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            partner_id INTEGER,
            workout_type TEXT,
            duration INTEGER,
            intensity_level TEXT,
            satisfaction_rating INTEGER CHECK(satisfaction_rating BETWEEN 1 AND 5),
            notes TEXT,
            session_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (partner_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # Fitness partners table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS fitness_partners (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            partner_id INTEGER,
            status TEXT DEFAULT 'pending',
            connection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (partner_id) REFERENCES users (id)
        )
    ''')
    
    # Posture analysis table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS posture_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            analysis_results TEXT,
            score INTEGER,
            issues_detected TEXT,
            recommendations TEXT,
            analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Add indexes for better performance
    conn.execute('CREATE INDEX IF NOT EXISTS idx_users_location ON users(location)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_users_fitness_level ON users(fitness_level)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active, last_active)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON user_interactions(user_id)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_messages_participants ON messages(sender_id, receiver_id)')
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")

# Advanced Partner Matching Algorithm
class PartnerMatcher:
    def __init__(self):
        self.fitness_level_weights = {'beginner': 1, 'intermediate': 2, 'advanced': 3}
        self.goal_weights = {
            'weight_loss': [1, 0, 0, 0, 0],
            'muscle_gain': [0, 1, 0, 0, 0],
            'endurance': [0, 0, 1, 0, 0],
            'strength': [0, 0, 0, 1, 0],
            'general_fitness': [0, 0, 0, 0, 1]
        }
    
    def calculate_compatibility_score(self, user1, user2):
        """Calculate comprehensive compatibility score between two users"""
        scores = {}
        total_weight = 0
        weighted_score = 0
        
        # Age compatibility (20% weight)
        age_score = self._calculate_age_compatibility(user1.get('age'), user2.get('age'))
        scores['age'] = age_score
        weighted_score += age_score * 0.20
        total_weight += 0.20
        
        # Fitness level compatibility (25% weight)
        fitness_score = self._calculate_fitness_level_compatibility(
            user1.get('fitness_level'), user2.get('fitness_level')
        )
        scores['fitness_level'] = fitness_score
        weighted_score += fitness_score * 0.25
        total_weight += 0.25
        
        # Goals compatibility (30% weight)
        goals_score = self._calculate_goals_compatibility(
            user1.get('goals', []), user2.get('goals', [])
        )
        scores['goals'] = goals_score
        weighted_score += goals_score * 0.30
        total_weight += 0.30
        
        # Schedule compatibility (15% weight)
        schedule_score = self._calculate_schedule_compatibility(
            user1.get('preferred_workout_time'), user2.get('preferred_workout_time'),
            user1.get('availability_schedule'), user2.get('availability_schedule')
        )
        scores['schedule'] = schedule_score
        weighted_score += schedule_score * 0.15
        total_weight += 0.15
        
        # Location proximity (10% weight)
        location_score = self._calculate_location_compatibility(
            user1.get('location'), user2.get('location')
        )
        scores['location'] = location_score
        weighted_score += location_score * 0.10
        total_weight += 0.10
        
        # Normalize final score
        final_score = (weighted_score / total_weight) * 100 if total_weight > 0 else 0
        
        return {
            'overall_score': round(final_score, 1),
            'detailed_scores': scores,
            'match_factors': self._generate_match_factors(scores)
        }
    
    def _calculate_age_compatibility(self, age1, age2):
        """Calculate age compatibility score"""
        if not age1 or not age2:
            return 50  # neutral score if age unknown
        
        age_diff = abs(age1 - age2)
        if age_diff <= 2:
            return 100
        elif age_diff <= 5:
            return 85
        elif age_diff <= 10:
            return 70
        elif age_diff <= 15:
            return 50
        else:
            return 25
    
    def _calculate_fitness_level_compatibility(self, level1, level2):
        """Calculate fitness level compatibility"""
        if not level1 or not level2:
            return 50
        
        weight1 = self.fitness_level_weights.get(level1.lower(), 2)
        weight2 = self.fitness_level_weights.get(level2.lower(), 2)
        
        diff = abs(weight1 - weight2)
        if diff == 0:
            return 100
        elif diff == 1:
            return 80
        else:
            return 60
    
    def _calculate_goals_compatibility(self, goals1, goals2):
        """Calculate goals compatibility using vector similarity"""
        if not goals1 or not goals2:
            return 50
        
        # Convert goals to vectors
        vector1 = self._goals_to_vector(goals1)
        vector2 = self._goals_to_vector(goals2)
        
        # Calculate cosine similarity
        similarity = cosine_similarity([vector1], [vector2])[0][0]
        return max(0, similarity * 100)
    
    def _goals_to_vector(self, goals):
        """Convert goals list to numerical vector"""
        vector = [0, 0, 0, 0, 0]  # weight_loss, muscle_gain, endurance, strength, general_fitness
        
        for goal in goals:
            goal_key = goal.lower().replace(' ', '_')
            if goal_key in self.goal_weights:
                goal_vector = self.goal_weights[goal_key]
                for i in range(len(vector)):
                    vector[i] += goal_vector[i]
        
        return vector
    
    def _calculate_schedule_compatibility(self, time1, time2, schedule1, schedule2):
        """Calculate schedule compatibility"""
        if not time1 or not time2:
            return 50
        
        # Basic time preference matching
        if time1.lower() == time2.lower():
            base_score = 100
        elif 'flexible' in [time1.lower(), time2.lower()]:
            base_score = 85
        else:
            base_score = 40
        
        # TODO: Add detailed schedule analysis if available
        return base_score
    
    def _calculate_location_compatibility(self, loc1, loc2):
        """Calculate location compatibility (simplified)"""
        if not loc1 or not loc2:
            return 50
        
        # Simple string matching (in real app, use geocoding)
        if loc1.lower() == loc2.lower():
            return 100
        elif any(word in loc2.lower() for word in loc1.lower().split()):
            return 75
        else:
            return 30
    
    def _generate_match_factors(self, scores):
        """Generate human-readable match factors"""
        factors = []
        
        if scores.get('age', 0) >= 80:
            factors.append("Similar age group")
        if scores.get('fitness_level', 0) >= 80:
            factors.append("Compatible fitness levels")
        if scores.get('goals', 0) >= 70:
            factors.append("Shared fitness goals")
        if scores.get('schedule', 0) >= 80:
            factors.append("Compatible schedules")
        if scores.get('location', 0) >= 70:
            factors.append("Close location")
        
        return factors

# Machine Learning Recommendation System
class MLRecommendationSystem:
    def __init__(self):
        self.matcher = PartnerMatcher()
    
    def get_ml_recommendations(self, user_id, limit=10):
        """Get ML-based partner recommendations"""
        conn = sqlite3.connect('fitness_app.db')
        
        try:
            # Get user data
            user_data = self._get_user_data(conn, user_id)
            if not user_data:
                return []
            
            # Get interaction history
            interactions = self._get_user_interactions(conn, user_id)
            
            # Get potential partners (excluding already connected)
            potential_partners = self._get_potential_partners(conn, user_id)
            
            # Calculate scores for each potential partner
            recommendations = []
            for partner in potential_partners:
                # Base compatibility score
                compatibility = self.matcher.calculate_compatibility_score(user_data, partner)
                
                # Adjust score based on ML factors
                ml_score = self._calculate_ml_adjustment(interactions, partner, compatibility['overall_score'])
                
                recommendations.append({
                    'user_id': partner['id'],
                    'name': partner['name'],
                    'age': partner['age'],
                    'location': partner['location'],
                    'fitness_level': partner['fitness_level'],
                    'goals': json.loads(partner['goals']) if partner['goals'] else [],
                    'bio': partner['bio'],
                    'compatibility_score': ml_score,
                    'match_factors': compatibility['match_factors'],
                    'detailed_scores': compatibility['detailed_scores'],
                    'last_active': partner['last_active']
                })
            
            # Sort by ML-adjusted score
            recommendations.sort(key=lambda x: x['compatibility_score'], reverse=True)
            
            return recommendations[:limit]
            
        finally:
            conn.close()
    
    def _get_user_data(self, conn, user_id):
        """Get user data for matching"""
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, name, age, fitness_level, goals, location, 
                   preferred_workout_time, availability_schedule, bio
            FROM users WHERE id = ? AND is_active = TRUE
        ''', (user_id,))
        
        row = cursor.fetchone()
        if not row:
            return None
        
        return {
            'id': row[0],
            'name': row[1],
            'age': row[2],
            'fitness_level': row[3],
            'goals': json.loads(row[4]) if row[4] else [],
            'location': row[5],
            'preferred_workout_time': row[6],
            'availability_schedule': json.loads(row[7]) if row[7] else {},
            'bio': row[8]
        }
    
    def _get_user_interactions(self, conn, user_id):
        """Get user interaction history for ML"""
        cursor = conn.cursor()
        cursor.execute('''
            SELECT target_user_id, interaction_type, interaction_value, created_at
            FROM user_interactions 
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 100
        ''', (user_id,))
        
        return cursor.fetchall()
    
    def _get_potential_partners(self, conn, user_id):
        """Get potential partners excluding already connected users"""
        cursor = conn.cursor()
        cursor.execute('''
            SELECT u.id, u.name, u.age, u.fitness_level, u.goals, u.location,
                   u.preferred_workout_time, u.availability_schedule, u.bio, u.last_active
            FROM users u
            WHERE u.id != ? 
            AND u.is_active = TRUE
            AND u.id NOT IN (
                SELECT partner_id FROM partners 
                WHERE user_id = ? AND status IN ('accepted', 'pending', 'blocked')
            )
            AND u.last_active >= datetime('now', '-30 days')
            ORDER BY u.last_active DESC
            LIMIT 50
        ''', (user_id, user_id))
        
        columns = ['id', 'name', 'age', 'fitness_level', 'goals', 'location',
                  'preferred_workout_time', 'availability_schedule', 'bio', 'last_active']
        
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    def _calculate_ml_adjustment(self, interactions, partner, base_score):
        """Adjust compatibility score based on ML factors"""
        adjustment = 0
        
        # Analyze interaction patterns
        partner_interactions = [i for i in interactions if i[0] == partner['id']]
        
        if partner_interactions:
            # User has interacted with similar profiles
            for interaction in partner_interactions:
                interaction_type = interaction[1]
                if interaction_type == 'like':
                    adjustment += 5
                elif interaction_type == 'message':
                    adjustment += 3
                elif interaction_type == 'workout_together':
                    adjustment += 10
                elif interaction_type == 'block':
                    adjustment -= 20
        
        # Activity bonus
        if partner.get('last_active'):
            days_since_active = (datetime.now() - datetime.fromisoformat(partner['last_active'])).days
            if days_since_active <= 1:
                adjustment += 5
            elif days_since_active <= 7:
                adjustment += 2
        
        return min(100, max(0, base_score + adjustment))

# Initialize ML system
ml_system = MLRecommendationSystem()

# API Routes

# Authentication routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        conn = get_db_connection()
        
        # Check if user already exists
        existing_user = conn.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            (data['username'], data['email'])
        ).fetchone()
        
        if existing_user:
            return jsonify({'success': False, 'message': 'User already exists'}), 400
        
        # Hash password
        password_hash = generate_password_hash(data['password'])
        
        # Insert new user
        cursor = conn.execute('''
            INSERT INTO users (username, email, password_hash, first_name, last_name, age, height, weight, fitness_level, goals, location)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['username'],
            data['email'],
            password_hash,
            data['first_name'],
            data['last_name'],
            data.get('age'),
            data.get('height'),
            data.get('weight'),
            data.get('fitness_level', 'beginner'),
            json.dumps(data.get('goals', [])),
            data.get('location')
        ))
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'token': token,
            'user_id': user_id
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if 'username' not in data or 'password' not in data:
            return jsonify({'success': False, 'message': 'Username and password required'}), 400
        
        conn = get_db_connection()
        user = conn.execute(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            (data['username'], data['username'])
        ).fetchone()
        conn.close()
        
        if not user or not check_password_hash(user['password_hash'], data['password']):
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'first_name': user['first_name'],
                'last_name': user['last_name']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/users', methods=['POST'])
def create_user():
    """Create a new user"""
    data = request.json
    
    conn = sqlite3.connect('fitness_app.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO users (name, email, age, weight, height, fitness_level, goals)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['name'], data['email'], data.get('age'),
            data.get('weight'), data.get('height'),
            data.get('fitness_level'), ','.join(data.get('goals', []))
        ))
        
        user_id = cursor.lastrowid
        conn.commit()
        
        return jsonify({'success': True, 'user_id': user_id})
    
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'error': 'Email already exists'}), 400
    
    finally:
        conn.close()

# Workout routes
@app.route('/api/workouts', methods=['GET'])
def get_workouts():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': 'User ID required'}), 400
        
        conn = get_db_connection()
        workouts = conn.execute(
            'SELECT * FROM workouts WHERE user_id = ? ORDER BY created_at DESC',
            (user_id,)
        ).fetchall()
        conn.close()
        
        workout_list = []
        for workout in workouts:
            workout_list.append({
                'id': workout['id'],
                'name': workout['name'],
                'type': workout['type'],
                'duration': workout['duration'],
                'calories_burned': workout['calories_burned'],
                'exercises': json.loads(workout['exercises']) if workout['exercises'] else [],
                'date_completed': workout['date_completed'],
                'created_at': workout['created_at']
            })
        
        return jsonify({
            'success': True,
            'workouts': workout_list
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/workouts', methods=['POST'])
def create_workout():
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'name', 'type', 'duration']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.execute('''
            INSERT INTO workouts (user_id, name, type, duration, calories_burned, exercises, date_completed)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['user_id'],
            data['name'],
            data['type'],
            data['duration'],
            data.get('calories_burned', 0),
            json.dumps(data.get('exercises', [])),
            data.get('date_completed', datetime.date.today().isoformat())
        ))
        
        workout_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Workout created successfully',
            'workout_id': workout_id
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/workout-plan', methods=['POST'])
def generate_plan():
    """Generate AI workout plan"""
    data = request.json
    plan = generate_workout_plan(data)
    return jsonify(plan)

# AI Workout Plan Generation
@app.route('/api/ai/generate-plan', methods=['POST'])
def generate_workout_plan():
    try:
        data = request.get_json()
        
        # Mock AI workout plan generation
        # In a real implementation, this would use ML models
        
        goals = data.get('goals', [])
        fitness_level = data.get('fitness_level', 'beginner')
        workout_days = data.get('workout_days', [])
        duration = data.get('duration', '30-45')
        
        # Generate a sample plan based on inputs
        plan = {
            'name': f'Personalized {fitness_level.title()} Plan',
            'duration': '4 weeks',
            'difficulty': fitness_level,
            'total_workouts': len(workout_days) * 4,  # 4 weeks
            'estimated_calories': len(workout_days) * 300 * 4,
            'schedule': []
        }
        
        # Generate weekly schedule
        days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        for day in days_of_week:
            if day.lower() in workout_days:
                # Generate workout for this day
                workout_types = ['Upper Body Strength', 'Lower Body Strength', 'Cardio HIIT', 'Full Body Circuit', 'Core & Flexibility']
                workout_type = random.choice(workout_types)
                
                exercises = generate_exercises_for_type(workout_type, fitness_level)
                
                plan['schedule'].append({
                    'day': day,
                    'type': workout_type,
                    'duration': random.randint(25, 50),
                    'exercises': exercises,
                    'calories': random.randint(200, 400)
                })
            else:
                plan['schedule'].append({
                    'day': day,
                    'type': 'Rest Day',
                    'duration': 0,
                    'exercises': [],
                    'calories': 0
                })
        
        return jsonify({
            'success': True,
            'plan': plan
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

def generate_exercises_for_type(workout_type, fitness_level):
    """Generate exercises based on workout type and fitness level"""
    
    exercise_database = {
        'Upper Body Strength': [
            {'name': 'Push-ups', 'sets': 3, 'reps': '8-12', 'rest': '60s'},
            {'name': 'Pull-ups', 'sets': 3, 'reps': '5-10', 'rest': '90s'},
            {'name': 'Shoulder Press', 'sets': 3, 'reps': '10-12', 'rest': '60s'},
            {'name': 'Bicep Curls', 'sets': 3, 'reps': '12-15', 'rest': '45s'},
            {'name': 'Tricep Dips', 'sets': 3, 'reps': '8-12', 'rest': '45s'}
        ],
        'Lower Body Strength': [
            {'name': 'Squats', 'sets': 3, 'reps': '12-15', 'rest': '60s'},
            {'name': 'Lunges', 'sets': 3, 'reps': '10 each leg', 'rest': '60s'},
            {'name': 'Deadlifts', 'sets': 3, 'reps': '8-10', 'rest': '90s'},
            {'name': 'Calf Raises', 'sets': 3, 'reps': '15-20', 'rest': '45s'},
            {'name': 'Glute Bridges', 'sets': 3, 'reps': '12-15', 'rest': '45s'}
        ],
        'Cardio HIIT': [
            {'name': 'Jumping Jacks', 'sets': 4, 'reps': '30s on/30s off', 'rest': '30s'},
            {'name': 'Burpees', 'sets': 4, 'reps': '20s on/40s off', 'rest': '60s'},
            {'name': 'Mountain Climbers', 'sets': 4, 'reps': '30s on/30s off', 'rest': '30s'},
            {'name': 'High Knees', 'sets': 4, 'reps': '30s on/30s off', 'rest': '30s'}
        ],
        'Full Body Circuit': [
            {'name': 'Burpees', 'sets': 3, 'reps': '8-10', 'rest': '60s'},
            {'name': 'Push-ups', 'sets': 3, 'reps': '10-12', 'rest': '45s'},
            {'name': 'Squats', 'sets': 3, 'reps': '12-15', 'rest': '45s'},
            {'name': 'Plank', 'sets': 3, 'reps': '30-45s', 'rest': '60s'},
            {'name': 'Jump Squats', 'sets': 3, 'reps': '10-12', 'rest': '60s'}
        ],
        'Core & Flexibility': [
            {'name': 'Plank', 'sets': 3, 'reps': '30-60s', 'rest': '30s'},
            {'name': 'Russian Twists', 'sets': 3, 'reps': '20-30', 'rest': '30s'},
            {'name': 'Cat-Cow Stretch', 'sets': 2, 'reps': '10-15', 'rest': '15s'},
            {'name': 'Child\'s Pose', 'sets': 1, 'reps': '60s hold', 'rest': '0s'}
        ]
    }
    
    exercises = exercise_database.get(workout_type, [])
    
    # Adjust difficulty based on fitness level
    if fitness_level == 'beginner':
        # Reduce sets and reps for beginners
        for exercise in exercises:
            if exercise['sets'] > 2:
                exercise['sets'] = max(2, exercise['sets'] - 1)
    elif fitness_level == 'advanced':
        # Increase sets and reps for advanced
        for exercise in exercises:
            exercise['sets'] = min(5, exercise['sets'] + 1)
    
    return exercises[:5]  # Return max 5 exercises

# Posture Analysis
@app.route('/api/posture/analyze', methods=['POST'])
def analyze_posture():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        image_data = data.get('image_data')  # Base64 encoded image
        
        if not user_id or not image_data:
            return jsonify({'success': False, 'message': 'User ID and image data required'}), 400
        
        # Mock posture analysis
        # In a real implementation, this would use computer vision and ML models
        
        # Generate mock analysis results
        score = random.randint(60, 95)
        
        issues = []
        recommendations = []
        
        if score < 70:
            issues = [
                "Forward head posture detected",
                "Rounded shoulders observed",
                "Slight spinal curvature"
            ]
            recommendations = [
                "Perform neck stretches every hour",
                "Strengthen upper back muscles",
                "Adjust monitor height to eye level",
                "Use ergonomic chair support"
            ]
        elif score < 85:
            issues = [
                "Minor shoulder imbalance",
                "Slight forward head position"
            ]
            recommendations = [
                "Focus on shoulder blade squeezes",
                "Practice chin tucks throughout the day",
                "Take regular posture breaks"
            ]
        else:
            recommendations = [
                "Maintain current posture habits",
                "Continue regular exercise routine",
                "Stay mindful of posture throughout the day"
            ]
        
        analysis_result = {
            'score': score,
            'issues': issues,
            'recommendations': recommendations,
            'key_points': {
                'head': {'x': 320, 'y': 100, 'confidence': 0.95},
                'shoulders': {
                    'left': {'x': 280, 'y': 180},
                    'right': {'x': 360, 'y': 185}
                },
                'spine': {'alignment': score / 100}
            }
        }
        
        # Save analysis to database
        conn = get_db_connection()
        conn.execute('''
            INSERT INTO posture_analysis (user_id, analysis_results, score, issues_detected, recommendations)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            user_id,
            json.dumps(analysis_result),
            score,
            json.dumps(issues),
            json.dumps(recommendations)
        ))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'analysis': analysis_result
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/posture-analysis', methods=['POST'])
def posture_analysis():
    """Analyze posture from webcam image"""
    data = request.json
    image_data = data.get('image')
    exercise_type = data.get('exercise_type', 'push-ups')
    
    result = analyze_posture(image_data, exercise_type)
    return jsonify(result)

@app.route('/api/machine-posture-analysis', methods=['POST'])
def machine_posture_analysis():
    """Analyze posture for specific gym machine exercises"""
    data = request.json
    image_data = data.get('image')
    machine_name = data.get('machine_name', 'treadmill')
    exercise_type = data.get('exercise_type', 'general')
    
    # Machine-specific posture analysis
    machine_specific_analysis = {
        'treadmill': {
            'key_points': ['upright_posture', 'arm_swing', 'foot_strike'],
            'common_mistakes': ['leaning_forward', 'overstriding', 'heel_striking']
        },
        'bench_press': {
            'key_points': ['back_arch', 'shoulder_blade_position', 'bar_path'],
            'common_mistakes': ['excessive_arch', 'bouncing_bar', 'uneven_grip']
        },
        'lat_pulldown': {
            'key_points': ['upright_torso', 'shoulder_blade_squeeze', 'controlled_movement'],
            'common_mistakes': ['leaning_back', 'using_momentum', 'partial_range']
        }
    }
    
    result = analyze_posture(image_data, exercise_type)
    
    # Add machine-specific feedback
    if machine_name.lower().replace(' ', '_') in machine_specific_analysis:
        machine_data = machine_specific_analysis[machine_name.lower().replace(' ', '_')]
        result['machine_specific'] = {
            'key_points': machine_data['key_points'],
            'common_mistakes': machine_data['common_mistakes'],
            'machine_name': machine_name
        }
    
    return jsonify(result)

@app.route('/api/workout-exercise-analysis', methods=['POST'])
def workout_exercise_analysis():
    """Analyze posture for workout plan exercises"""
    data = request.json
    image_data = data.get('image')
    exercise_name = data.get('exercise_name', 'push-ups')
    workout_context = data.get('workout_context', {})
    
    result = analyze_posture(image_data, exercise_name.lower().replace('-', '_'))
    
    # Add workout-specific context
    result['workout_context'] = {
        'exercise_name': exercise_name,
        'current_set': workout_context.get('current_set', 1),
        'target_reps': workout_context.get('target_reps', 10),
        'workout_day': workout_context.get('workout_day', 1)
    }
    
    return jsonify(result)

# Partner Finding
@app.route('/api/partners/recommendations/<user_id>', methods=['GET'])
def get_partner_recommendations(user_id):
    try:
        limit = request.args.get('limit', 10)
        
        # Mock partner recommendations
        # In a real implementation, this would use ML algorithms for matching
        
        mock_partners = [
            {
                'id': 1,
                'name': 'Sarah Johnson',
                'age': 28,
                'location': 'New York, NY',
                'fitness_level': 'Intermediate',
                'goals': ['Weight Loss', 'Strength Training'],
                'compatibility': 92,
                'avatar': '/placeholder.svg?height=60&width=60'
            },
            {
                'id': 2,
                'name': 'Mike Chen',
                'age': 32,
                'location': 'San Francisco, CA',
                'fitness_level': 'Advanced',
                'goals': ['Muscle Gain', 'Powerlifting'],
                'compatibility': 87,
                'avatar': '/placeholder.svg?height=60&width=60'
            }
        ]
        
        return jsonify({
            'success': True,
            'recommendations': mock_partners[:int(limit)]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/partners/search', methods=['POST'])
def search_partners():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        filters = data.get('filters', {})
        
        # Mock partner search with filters
        # In a real implementation, this would query the database with filters
        
        mock_results = [
            {
                'id': 3,
                'name': 'Emma Rodriguez',
                'age': 25,
                'location': 'Los Angeles, CA',
                'fitness_level': 'Beginner',
                'goals': ['General Fitness', 'Flexibility'],
                'compatibility': 78,
                'avatar': '/placeholder.svg?height=60&width=60'
            }
        ]
        
        return jsonify({
            'success': True,
            'partners': mock_results
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/partners/connect', methods=['POST'])
def connect_with_partner():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        partner_id = data.get('partner_id')
        message = data.get('message', '')
        
        if not user_id or not partner_id:
            return jsonify({'success': False, 'message': 'User ID and Partner ID required'}), 400
        
        conn = get_db_connection()
        
        # Check if connection already exists
        existing = conn.execute(
            'SELECT id FROM fitness_partners WHERE user_id = ? AND partner_id = ?',
            (user_id, partner_id)
        ).fetchone()
        
        if existing:
            return jsonify({'success': False, 'message': 'Connection request already sent'}), 400
        
        # Create connection request
        conn.execute('''
            INSERT INTO fitness_partners (user_id, partner_id, status)
            VALUES (?, ?, 'pending')
        ''', (user_id, partner_id))
        
        # Send initial message if provided
        if message:
            conn.execute('''
                INSERT INTO messages (sender_id, receiver_id, message)
                VALUES (?, ?, ?)
            ''', (user_id, partner_id, message))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Connection request sent successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/fitness-tracking', methods=['POST'])
def save_fitness_data():
    """Save daily fitness tracking data"""
    data = request.json
    
    conn = sqlite3.connect('fitness_app.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO fitness_tracking 
        (user_id, date, steps, calories, workout_time, heart_rate)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        data['user_id'], data.get('date', datetime.now().date()),
        data.get('steps'), data.get('calories'),
        data.get('workout_time'), data.get('heart_rate')
    ))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/api/fitness-tracking/<int:user_id>', methods=['GET'])
def get_fitness_data(user_id):
    """Get fitness tracking data for a user"""
    days = request.args.get('days', 7, type=int)
    
    conn = sqlite3.connect('fitness_app.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM fitness_tracking 
        WHERE user_id = ? AND date >= date('now', '-{} days')
        ORDER BY date DESC
    '''.format(days), (user_id,))
    
    data = cursor.fetchall()
    conn.close()
    
    # Convert to list of dictionaries
    result = []
    for row in data:
        result.append({
            'date': row[2],
            'steps': row[3],
            'calories': row[4],
            'workout_time': row[5],
            'heart_rate': row[6]
        })
    
    return jsonify(result)

@app.route('/api/partners/recommendations/<int:user_id>', methods=['GET'])
def get_partner_recommendations(user_id):
    """Get ML-based partner recommendations"""
    try:
        limit = request.args.get('limit', 10, type=int)
        recommendations = ml_system.get_ml_recommendations(user_id, limit)
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'total': len(recommendations)
        })
    
    except Exception as e:
        logger.error(f"Error getting recommendations for user {user_id}: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/partners/search', methods=['POST'])
def search_partners():
    """Advanced partner search with filters"""
    try:
        data = request.json
        user_id = data.get('user_id')
        filters = data.get('filters', {})
        
        conn = sqlite3.connect('fitness_app.db')
        cursor = conn.cursor()
        
        # Build dynamic query based on filters
        query = '''
            SELECT u.id, u.name, u.age, u.fitness_level, u.goals, u.location,
                   u.preferred_workout_time, u.bio, u.last_active
            FROM users u
            WHERE u.id != ? AND u.is_active = TRUE
        '''
        params = [user_id]
        
        # Apply filters
        if filters.get('location'):
            query += ' AND u.location LIKE ?'
            params.append(f"%{filters['location']}%")
        
        if filters.get('fitness_level'):
            query += ' AND u.fitness_level = ?'
            params.append(filters['fitness_level'])
        
        if filters.get('min_age'):
            query += ' AND u.age >= ?'
            params.append(filters['min_age'])
        
        if filters.get('max_age'):
            query += ' AND u.age <= ?'
            params.append(filters['max_age'])
        
        if filters.get('preferred_workout_time'):
            query += ' AND (u.preferred_workout_time = ? OR u.preferred_workout_time = "flexible")'
            params.append(filters['preferred_workout_time'])
        
        query += ' ORDER BY u.last_active DESC LIMIT 20'
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        # Calculate compatibility scores
        user_data = ml_system._get_user_data(conn, user_id)
        partners = []
        
        for row in results:
            partner_data = {
                'id': row[0],
                'name': row[1],
                'age': row[2],
                'fitness_level': row[3],
                'goals': json.loads(row[4]) if row[4] else [],
                'location': row[5],
                'preferred_workout_time': row[6],
                'bio': row[7],
                'last_active': row[8]
            }
            
            compatibility = ml_system.matcher.calculate_compatibility_score(user_data, partner_data)
            
            partners.append({
                **partner_data,
                'compatibility_score': compatibility['overall_score'],
                'match_factors': compatibility['match_factors']
            })
        
        # Sort by compatibility
        partners.sort(key=lambda x: x['compatibility_score'], reverse=True)
        
        conn.close()
        
        return jsonify({
            'success': True,
            'partners': partners,
            'total': len(partners)
        })
    
    except Exception as e:
        logger.error(f"Error searching partners: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/partners/connect', methods=['POST'])
def send_connection_request():
    """Send partner connection request"""
    try:
        data = request.json
        user_id = data.get('user_id')
        partner_id = data.get('partner_id')
        message = data.get('message', '')
        
        conn = sqlite3.connect('fitness_app.db')
        cursor = conn.cursor()
        
        # Check if connection already exists
        cursor.execute('''
            SELECT id, status FROM partners 
            WHERE user_id = ? AND partner_id = ?
        ''', (user_id, partner_id))
        
        existing = cursor.fetchone()
        if existing:
            return jsonify({
                'success': False, 
                'error': f'Connection already exists with status: {existing[1]}'
            }), 400
        
        # Get user data for compatibility calculation
        user_data = ml_system._get_user_data(conn, user_id)
        partner_data = ml_system._get_user_data(conn, partner_id)
        
        if not user_data or not partner_data:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Calculate compatibility
        compatibility = ml_system.matcher.calculate_compatibility_score(user_data, partner_data)
        
        # Create connection request
        cursor.execute('''
            INSERT INTO partners (user_id, partner_id, status, compatibility_score, match_factors)
            VALUES (?, ?, 'pending', ?, ?)
        ''', (user_id, partner_id, compatibility['overall_score'], json.dumps(compatibility['match_factors'])))
        
        # Send initial message if provided
        if message:
            cursor.execute('''
                INSERT INTO messages (sender_id, receiver_id, message, message_type)
                VALUES (?, ?, ?, 'connection_request')
            ''', (user_id, partner_id, message))
        
        # Record interaction
        cursor.execute('''
            INSERT INTO user_interactions (user_id, target_user_id, interaction_type, interaction_value)
            VALUES (?, ?, 'connection_request', 1.0)
        ''', (user_id, partner_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Connection request sent successfully'})
    
    except Exception as e:
        logger.error(f"Error sending connection request: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/partners/respond', methods=['POST'])
def respond_to_connection():
    """Respond to partner connection request"""
    try:
        data = request.json
        user_id = data.get('user_id')
        partner_id = data.get('partner_id')
        response = data.get('response')  # 'accepted' or 'declined'
        
        if response not in ['accepted', 'declined']:
            return jsonify({'success': False, 'error': 'Invalid response'}), 400
        
        conn = sqlite3.connect('fitness_app.db')
        cursor = conn.cursor()
        
        # Update connection status
        cursor.execute('''
            UPDATE partners 
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND partner_id = ?
        ''', (response, partner_id, user_id))
        
        if cursor.rowcount == 0:
            return jsonify({'success': False, 'error': 'Connection request not found'}), 404
        
        # If accepted, create reverse connection
        if response == 'accepted':
            cursor.execute('''
                INSERT OR IGNORE INTO partners (user_id, partner_id, status, compatibility_score)
                SELECT ?, ?, 'accepted', compatibility_score
                FROM partners WHERE user_id = ? AND partner_id = ?
            ''', (user_id, partner_id, partner_id, user_id))
        
        # Record interaction
        cursor.execute('''
            INSERT INTO user_interactions (user_id, target_user_id, interaction_type, interaction_value)
            VALUES (?, ?, ?, ?)
        ''', (user_id, partner_id, response, 2.0 if response == 'accepted' else -1.0))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': f'Connection {response} successfully'})
    
    except Exception as e:
        logger.error(f"Error responding to connection: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/partners/matches/<int:user_id>', methods=['GET'])
def get_user_matches(user_id):
    """Get user's accepted partner matches"""
    try:
        conn = sqlite3.connect('fitness_app.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT u.id, u.name, u.age, u.location, u.fitness_level, u.goals, u.bio,
                   p.compatibility_score, p.match_factors, p.last_interaction
            FROM partners p
            JOIN users u ON p.partner_id = u.id
            WHERE p.user_id = ? AND p.status = 'accepted'
            ORDER BY p.last_interaction DESC, p.compatibility_score DESC
        ''', (user_id,))
        
        matches = []
        for row in cursor.fetchall():
            matches.append({
                'id': row[0],
                'name': row[1],
                'age': row[2],
                'location': row[3],
                'fitness_level': row[4],
                'goals': json.loads(row[5]) if row[5] else [],
                'bio': row[6],
                'compatibility_score': row[7],
                'match_factors': json.loads(row[8]) if row[8] else [],
                'last_interaction': row[9]
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'matches': matches,
            'total': len(matches)
        })
    
    except Exception as e:
        logger.error(f"Error getting matches for user {user_id}: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'success': True,
        'message': 'Fitness App API is running',
        'timestamp': datetime.datetime.utcnow().isoformat()
    }), 200

# Keep all existing routes from the previous backend...
# (workout-plan, posture-analysis, fitness-tracking, etc.)

@app.route('/api/gym-machines', methods=['GET'])
def get_gym_machines():
    """Get gym machines data"""
    machines = [
        {
            'id': 1,
            'name': 'Treadmill',
            'category': 'Cardio',
            'purpose': 'Cardiovascular fitness and weight loss',
            'exercises': ['Walking', 'Jogging', 'Running', 'Interval Training'],
            'difficulty': 'Beginner',
            'duration': '20-45 minutes',
            'calories': '200-500',
            'instructions': 'Start with a 5-minute warm-up walk, gradually increase speed, maintain proper posture.'
        },
        {
            'id': 2,
            'name': 'Bench Press',
            'category': 'Strength',
            'purpose': 'Chest, shoulders, and triceps development',
            'exercises': ['Flat Bench Press', 'Incline Press', 'Decline Press', 'Dumbbell Press'],
            'difficulty': 'Intermediate',
            'duration': '15-25 minutes',
            'calories': '150-250',
            'instructions': 'Lie flat, grip bar shoulder-width apart, lower to chest, press up explosively.'
        }
        # Add more machines as needed
    ]
    
    return jsonify(machines)

# Initialize database on startup
if __name__ == '__main__':
    init_db()
    print("Starting Enhanced Flask server with ML Partner Matching...")
    print("Features:")
    print("- Advanced compatibility scoring")
    print("- Machine learning recommendations") 
    print("- Detailed user interactions tracking")
    print("- Real-time partner matching")
    print("Database initialized successfully")
    app.run(debug=True, host='0.0.0.0', port=5000)
