from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import json
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Database configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "fitness_app.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')

db = SQLAlchemy(app)

# Models
class Gym(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(200), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    rating = db.Column(db.Float, default=0.0)
    review_count = db.Column(db.Integer, default=0)
    distance = db.Column(db.Float, default=0.0)
    price_per_month = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(200))
    phone = db.Column(db.String(20))
    website = db.Column(db.String(200))
    description = db.Column(db.Text)
    is_open = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    amenities = db.relationship('GymAmenity', backref='gym', lazy=True, cascade='all, delete-orphan')
    operating_hours = db.relationship('GymOperatingHours', backref='gym', lazy=True, cascade='all, delete-orphan')
    equipment = db.relationship('GymEquipment', backref='gym', lazy=True, cascade='all, delete-orphan')
    classes = db.relationship('GymClass', backref='gym', lazy=True, cascade='all, delete-orphan')

class GymAmenity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    gym_id = db.Column(db.Integer, db.ForeignKey('gym.id'), nullable=False)
    name = db.Column(db.String(50), nullable=False)

class GymOperatingHours(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    gym_id = db.Column(db.Integer, db.ForeignKey('gym.id'), nullable=False)
    day_of_week = db.Column(db.String(10), nullable=False)  # 'weekdays' or 'weekends'
    open_time = db.Column(db.String(10), nullable=False)  # 'HH:MM' format
    close_time = db.Column(db.String(10), nullable=False)  # 'HH:MM' format

class GymEquipment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    gym_id = db.Column(db.Integer, db.ForeignKey('gym.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)

class GymClass(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    gym_id = db.Column(db.Integer, db.ForeignKey('gym.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(100), unique=True)
    password_hash = db.Column(db.String(255))
    age = db.Column(db.Integer)
    gender = db.Column(db.String(20))
    height = db.Column(db.Float)
    weight = db.Column(db.Float)
    fitness_level = db.Column(db.String(20))  # 'beginner', 'intermediate', 'advanced'
    location = db.Column(db.String(200))
    bio = db.Column(db.Text)
    avatar_url = db.Column(db.String(200))
    goals = db.Column(db.Text)  # JSON array string
    preferred_workout_time = db.Column(db.String(50))
    availability_schedule = db.Column(db.Text)  # JSON object string
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_active = db.Column(db.DateTime, default=datetime.utcnow)

class ScheduledWorkout(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    duration = db.Column(db.Integer, nullable=False)  # in minutes
    workout_type = db.Column(db.String(50), nullable=False)
    partner_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    location = db.Column(db.String(200))
    notes = db.Column(db.Text)
    status = db.Column(db.String(20), default='scheduled')  # 'scheduled', 'completed', 'cancelled'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='scheduled_workouts')
    partner = db.relationship('User', foreign_keys=[partner_id], backref='partner_workouts')

class Exercise(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # 'strength', 'cardio', 'flexibility'
    duration = db.Column(db.Integer, nullable=False)  # in minutes
    difficulty = db.Column(db.String(20), nullable=False)  # 'beginner', 'intermediate', 'advanced'
    description = db.Column(db.Text)
    equipment = db.Column(db.Text)  # JSON string of equipment list
    muscle_groups = db.Column(db.Text)  # JSON string of muscle groups
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Partner/Connections models
class FitnessPartner(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    partner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, declined, blocked
    compatibility_score = db.Column(db.Float)
    match_factors = db.Column(db.Text)  # JSON array string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_interaction = db.Column(db.DateTime)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'partner_id', name='uq_user_partner'),
    )

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(50), default='text')
    is_read = db.Column(db.Boolean, default=False)
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)
    read_at = db.Column(db.DateTime)

class PartnerPreference(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    min_age = db.Column(db.Integer)
    max_age = db.Column(db.Integer)
    preferred_fitness_levels = db.Column(db.Text)  # JSON array
    max_distance_km = db.Column(db.Integer)
    preferred_workout_times = db.Column(db.Text)  # JSON array
    preferred_goals = db.Column(db.Text)  # JSON array
    gender_preference = db.Column(db.String(20))
    language_preferences = db.Column(db.Text)  # JSON array
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Sports Activity Models
class StudioClass(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    sport_type = db.Column(db.String(50), nullable=False)  # 'yoga', 'pilates', 'aerial', 'dance_fitness'
    instructor_name = db.Column(db.String(100))
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    duration = db.Column(db.Integer, nullable=False)  # in minutes
    level = db.Column(db.String(50))  # 'beginner', 'intermediate', 'advanced', 'all_levels'
    intensity = db.Column(db.String(50))  # 'gentle', 'moderate', 'high'
    max_spots = db.Column(db.Integer, default=12)
    spots_booked = db.Column(db.Integer, default=0)
    location = db.Column(db.String(200))
    description = db.Column(db.Text)
    price = db.Column(db.Float, default=0.0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SportsVenue(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    sport_type = db.Column(db.String(50), nullable=False)  # 'pickleball', 'badminton', 'tennis', 'basketball', 'volleyball', 'multi_sport'
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    location = db.Column(db.String(200), nullable=False)
    court_number = db.Column(db.String(50))
    price_per_hour = db.Column(db.Float, default=0.0)
    is_available = db.Column(db.Boolean, default=True)
    equipment_included = db.Column(db.Boolean, default=True)
    lights_included = db.Column(db.Boolean, default=True)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ClassBooking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('studio_class.id'), nullable=False)
    booking_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='confirmed')  # 'confirmed', 'cancelled', 'completed'
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = db.relationship('User', foreign_keys=[user_id], backref='class_bookings')
    studio_class = db.relationship('StudioClass', foreign_keys=[class_id])

class VenueBooking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    venue_id = db.Column(db.Integer, db.ForeignKey('sports_venue.id'), nullable=False)
    booking_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='confirmed')  # 'confirmed', 'cancelled', 'completed'
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = db.relationship('User', foreign_keys=[user_id], backref='venue_bookings')
    sports_venue = db.relationship('SportsVenue', foreign_keys=[venue_id])

# Professional Training Models
class ProfessionalTrainer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    gender = db.Column(db.String(20), nullable=False)  # 'male', 'female'
    specialization = db.Column(db.String(200))  # e.g., "Weight Loss", "Strength Training", "Yoga"
    experience_years = db.Column(db.Integer, default=0)
    certification = db.Column(db.Text)  # JSON array of certifications
    bio = db.Column(db.Text)
    avatar_url = db.Column(db.String(200))
    rating = db.Column(db.Float, default=0.0)
    review_count = db.Column(db.Integer, default=0)
    hourly_rate = db.Column(db.Float, nullable=False)
    is_available = db.Column(db.Boolean, default=True)
    female_friendly = db.Column(db.Boolean, default=False)  # True for female trainers or trainers comfortable with female clients
    location = db.Column(db.String(200))
    languages = db.Column(db.Text)  # JSON array
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DietPlan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    gender_target = db.Column(db.String(20), nullable=False)  # 'unisex', 'female', 'male'
    description = db.Column(db.Text)
    duration_weeks = db.Column(db.Integer, default=4)
    daily_calories = db.Column(db.Integer)
    meal_plan = db.Column(db.Text)  # JSON object with meals
    goals = db.Column(db.Text)  # JSON array: ["weight_loss", "muscle_gain", "maintenance"]
    difficulty = db.Column(db.String(20))  # 'beginner', 'intermediate', 'advanced'
    created_by_trainer_id = db.Column(db.Integer, db.ForeignKey('professional_trainer.id'))
    price = db.Column(db.Float, default=0.0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    trainer = db.relationship('ProfessionalTrainer', foreign_keys=[created_by_trainer_id])

class HomeSessionBooking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    trainer_id = db.Column(db.Integer, db.ForeignKey('professional_trainer.id'), nullable=False)
    session_date = db.Column(db.Date, nullable=False)
    session_time = db.Column(db.Time, nullable=False)
    duration_hours = db.Column(db.Float, default=1.0)
    location = db.Column(db.String(200), nullable=False)  # User's address
    session_type = db.Column(db.String(50))  # 'personal_training', 'nutrition_consultation', 'both'
    status = db.Column(db.String(20), default='pending')  # 'pending', 'confirmed', 'completed', 'cancelled'
    notes = db.Column(db.Text)
    total_price = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = db.relationship('User', foreign_keys=[user_id], backref='home_session_bookings')
    trainer = db.relationship('ProfessionalTrainer', foreign_keys=[trainer_id])

# API Routes

@app.route('/')
def index():
    return jsonify({
        'message': 'FitSanskriti API',
        'version': '1.0.0',
        'endpoints': {
            'gyms': '/api/gyms',
            'workouts': '/api/workouts',
            'exercises': '/api/exercises',
            'users': '/api/users',
            'auth_register': '/api/auth/register',
            'auth_login': '/api/auth/login',
            'profile': '/api/profile',
            'partners_recommendations': '/api/partners/recommendations',
            'partners_search': '/api/partners/search',
            'partners_connect': '/api/partners/connect'
        }
    })

# -------- AUTH ---------
def _generate_token(user_id: int):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    required = ['name', 'email', 'password']
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({'success': False, 'error': f'Missing fields: {", ".join(missing)}'}), 400

    # Optional smart-connection fields
    username = data.get('username') or data['email']
    if User.query.filter((User.email == data['email']) | (User.username == username)).first():
        return jsonify({'success': False, 'error': 'User already exists'}), 400

    user = User(
        name=data['name'],
        email=data['email'],
        username=username,
        password_hash=generate_password_hash(data['password']),
        gender=data.get('gender'),
        height=data.get('height'),
        weight=data.get('weight'),
        age=data.get('age'),
        fitness_level=data.get('fitness_level'),
        location=data.get('location'),
        bio=data.get('bio'),
        avatar_url=data.get('avatar_url'),
        goals=json.dumps(data.get('goals', [])) if isinstance(data.get('goals'), list) else data.get('goals'),
        preferred_workout_time=data.get('preferred_workout_time'),
        availability_schedule=json.dumps(data.get('availability_schedule', {})) if isinstance(data.get('availability_schedule'), dict) else data.get('availability_schedule'),
        last_active=datetime.utcnow(),
    )
    db.session.add(user)
    db.session.commit()

    token = _generate_token(user.id)
    return jsonify({'success': True, 'token': token, 'user_id': user.id})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = data.get('email') or data.get('username')
    password = data.get('password')
    if not identifier or not password:
        return jsonify({'success': False, 'error': 'Email/username and password required'}), 400

    user = User.query.filter((User.email == identifier) | (User.username == identifier)).first()
    if not user or not user.password_hash or not check_password_hash(user.password_hash, password):
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

    user.last_active = datetime.utcnow()
    db.session.commit()
    token = _generate_token(user.id)
    return jsonify({'success': True, 'token': token, 'user': {
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'username': user.username,
        'fitness_level': user.fitness_level,
    }})

@app.route('/api/profile', methods=['GET', 'PUT'])
def profile():
    # Simple token in Authorization: Bearer <token>
    auth_header = request.headers.get('Authorization', '')
    token = auth_header.replace('Bearer ', '') if auth_header.startswith('Bearer ') else None
    if not token:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
    except Exception:
        return jsonify({'success': False, 'error': 'Invalid token'}), 401

    user = User.query.get(payload.get('user_id'))
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    if request.method == 'GET':
        return jsonify({'success': True, 'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'username': user.username,
            'age': user.age,
            'gender': user.gender,
            'height': user.height,
            'weight': user.weight,
            'fitness_level': user.fitness_level,
            'location': user.location,
            'bio': user.bio,
            'avatar_url': user.avatar_url,
            'goals': json.loads(user.goals) if user.goals else [],
            'preferred_workout_time': user.preferred_workout_time,
            'availability_schedule': json.loads(user.availability_schedule) if user.availability_schedule else {},
        }})

    # PUT update
    data = request.get_json() or {}
    for field in ['name','age','gender','height','weight','fitness_level','location','bio','avatar_url','preferred_workout_time']:
        if field in data:
            setattr(user, field, data[field])
    if 'goals' in data:
        user.goals = json.dumps(data['goals']) if isinstance(data['goals'], list) else data['goals']
    if 'availability_schedule' in data:
        user.availability_schedule = json.dumps(data['availability_schedule']) if isinstance(data['availability_schedule'], dict) else data['availability_schedule']
    user.last_active = datetime.utcnow()
    db.session.commit()
    return jsonify({'success': True})

# -------- PARTNERS ---------
@app.route('/api/partners/search', methods=['GET'])
def partners_search():
    # filters: q, fitness_level, min_age, max_age, location
    q = request.args.get('q', '').strip().lower()
    fitness_level = request.args.get('fitness_level')
    min_age = request.args.get('min_age', type=int)
    max_age = request.args.get('max_age', type=int)
    location = request.args.get('location')

    query = User.query.filter(User.is_active == True)
    if q:
        query = query.filter(db.or_(User.name.ilike(f"%{q}%"), User.username.ilike(f"%{q}%"), User.email.ilike(f"%{q}%")))
    if fitness_level:
        query = query.filter(User.fitness_level == fitness_level)
    if min_age is not None:
        query = query.filter(User.age >= min_age)
    if max_age is not None:
        query = query.filter(User.age <= max_age)
    if location:
        query = query.filter(User.location.ilike(f"%{location}%"))

    users = query.order_by(User.last_active.desc()).limit(50).all()
    results = []
    for u in users:
        results.append({
            'id': u.id,
            'name': u.name,
            'username': u.username,
            'fitness_level': u.fitness_level,
            'goals': json.loads(u.goals) if u.goals else [],
            'location': u.location,
            'bio': u.bio,
            'last_active': u.last_active.isoformat() if u.last_active else None,
            'avatar_url': u.avatar_url,
        })
    return jsonify({'success': True, 'partners': results})

@app.route('/api/partners/connect', methods=['POST'])
def partners_connect():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    partner_id = data.get('partner_id')
    if not user_id or not partner_id or user_id == partner_id:
        return jsonify({'success': False, 'error': 'Invalid user/partner'}), 400

    existing = FitnessPartner.query.filter_by(user_id=user_id, partner_id=partner_id).first()
    if existing:
        return jsonify({'success': False, 'error': f'Connection already {existing.status}'}), 400

    fp = FitnessPartner(user_id=user_id, partner_id=partner_id, status='pending')
    db.session.add(fp)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Connection request sent'})

@app.route('/api/partners/recommendations', methods=['GET'])
def partners_recommendations():
    # Simple recommendations: top recent active users
    limit = request.args.get('limit', 10, type=int)
    users = User.query.filter_by(is_active=True).order_by(User.last_active.desc()).limit(limit).all()
    recs = []
    for u in users:
        recs.append({
            'id': u.id,
            'name': u.name,
            'username': u.username,
            'fitness_level': u.fitness_level,
            'goals': json.loads(u.goals) if u.goals else [],
            'location': u.location,
            'bio': u.bio,
            'last_active': u.last_active.isoformat() if u.last_active else None,
            'avatar_url': u.avatar_url,
        })
    return jsonify({'success': True, 'recommendations': recs})

@app.route('/api/partners/connections', methods=['GET'])
def partners_connections():
    try:
        user_id = request.args.get('user_id', type=int)
        status = request.args.get('status', 'accepted')
        if not user_id:
            return jsonify({'success': False, 'error': 'user_id is required'}), 400

        # Fetch connections where the user is either requester or partner
        q = FitnessPartner.query.filter(
            db.or_(
                FitnessPartner.user_id == user_id,
                FitnessPartner.partner_id == user_id
            )
        )
        if status:
            q = q.filter(FitnessPartner.status == status)

        fps = q.order_by(FitnessPartner.updated_at.desc()).limit(100).all()

        partners = []
        for fp in fps:
            # Determine the other user's id
            other_id = fp.partner_id if fp.user_id == user_id else fp.user_id
            other = User.query.get(other_id)
            if not other:
                continue
            partners.append({
                'id': other.id,
                'name': other.name,
                'username': other.username,
                'fitness_level': other.fitness_level,
                'goals': json.loads(other.goals) if other.goals else [],
                'location': other.location,
                'bio': other.bio,
                'last_active': other.last_active.isoformat() if other.last_active else None,
                'avatar_url': other.avatar_url,
            })

        return jsonify({'success': True, 'connections': partners})
    except Exception as e:
        logger.error(f"Error fetching connections: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/partners/requests', methods=['GET'])
def partners_requests():
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({'success': False, 'error': 'user_id is required'}), 400

        # Pending requests sent TO this user
        fps = FitnessPartner.query.filter_by(partner_id=user_id, status='pending').order_by(FitnessPartner.created_at.desc()).all()
        reqs = []
        for fp in fps:
            sender = User.query.get(fp.user_id)
            if not sender:
                continue
            reqs.append({
                'id': fp.id,
                'from': {
                    'id': sender.id,
                    'name': sender.name,
                    'username': sender.username,
                    'avatar_url': sender.avatar_url,
                    'fitness_level': sender.fitness_level,
                },
                'message': 'Wants to connect',
                'timestamp': fp.created_at.isoformat(),
            })

        return jsonify({'success': True, 'requests': reqs})
    except Exception as e:
        logger.error(f"Error fetching partner requests: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/partners/accept', methods=['POST'])
def partners_accept():
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        partner_id = data.get('partner_id')
        if not user_id or not partner_id:
            return jsonify({'success': False, 'error': 'user_id and partner_id are required'}), 400

        fp = FitnessPartner.query.filter_by(user_id=partner_id, partner_id=user_id, status='pending').first()
        if not fp:
            return jsonify({'success': False, 'error': 'No pending request found'}), 404

        fp.status = 'accepted'
        fp.updated_at = datetime.utcnow()

        # Optional: ensure reciprocal record exists for easier querying
        reciprocal = FitnessPartner.query.filter_by(user_id=user_id, partner_id=partner_id).first()
        if not reciprocal:
            reciprocal = FitnessPartner(user_id=user_id, partner_id=partner_id, status='accepted', created_at=datetime.utcnow(), updated_at=datetime.utcnow())
            db.session.add(reciprocal)
        else:
            reciprocal.status = 'accepted'
            reciprocal.updated_at = datetime.utcnow()

        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Error accepting partner request: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/partners/decline', methods=['POST'])
def partners_decline():
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        partner_id = data.get('partner_id')
        if not user_id or not partner_id:
            return jsonify({'success': False, 'error': 'user_id and partner_id are required'}), 400

        fp = FitnessPartner.query.filter_by(user_id=partner_id, partner_id=user_id, status='pending').first()
        if not fp:
            return jsonify({'success': False, 'error': 'No pending request found'}), 404

        fp.status = 'declined'
        fp.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Error declining partner request: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# Gym endpoints
@app.route('/api/gyms', methods=['GET'])
def get_gyms():
    try:
        # Get query parameters
        search = request.args.get('search', '')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        min_rating = request.args.get('min_rating', type=float)
        amenity = request.args.get('amenity', '')
        sort_by = request.args.get('sort_by', 'distance')
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)

        # Build query
        query = Gym.query

        # Apply filters
        if search:
            query = query.filter(
                db.or_(
                    Gym.name.contains(search),
                    Gym.city.contains(search),
                    Gym.address.contains(search)
                )
            )

        if min_price is not None:
            query = query.filter(Gym.price_per_month >= min_price)

        if max_price is not None:
            query = query.filter(Gym.price_per_month <= max_price)

        if min_rating is not None:
            query = query.filter(Gym.rating >= min_rating)

        if amenity:
            query = query.join(GymAmenity).filter(GymAmenity.name == amenity)

        # Apply sorting
        if sort_by == 'rating':
            query = query.order_by(Gym.rating.desc())
        elif sort_by == 'price':
            query = query.order_by(Gym.price_per_month.asc())
        elif sort_by == 'name':
            query = query.order_by(Gym.name.asc())
        else:  # distance
            query = query.order_by(Gym.distance.asc())

        # Apply pagination
        total = query.count()
        gyms = query.offset(offset).limit(limit).all()

        # Format response
        gyms_data = []
        for gym in gyms:
            gym_data = {
                'id': gym.id,
                'name': gym.name,
                'address': gym.address,
                'city': gym.city,
                'rating': gym.rating,
                'review_count': gym.review_count,
                'distance': gym.distance,
                'price_per_month': gym.price_per_month,
                'image_url': gym.image_url,
                'phone': gym.phone,
                'website': gym.website,
                'description': gym.description,
                'is_open': gym.is_open,
                'amenities': [amenity.name for amenity in gym.amenities],
                'operating_hours': {
                    'weekdays': next((h.open_time + ' - ' + h.close_time for h in gym.operating_hours if h.day_of_week == 'weekdays'), ''),
                    'weekends': next((h.open_time + ' - ' + h.close_time for h in gym.operating_hours if h.day_of_week == 'weekends'), '')
                },
                'equipment': [eq.name for eq in gym.equipment],
                'classes': [cls.name for cls in gym.classes]
            }
            gyms_data.append(gym_data)

        return jsonify({
            'success': True,
            'gyms': gyms_data,
            'total': total,
            'offset': offset,
            'limit': limit
        })

    except Exception as e:
        logger.error(f"Error fetching gyms: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/gyms/<int:gym_id>', methods=['GET'])
def get_gym(gym_id):
    try:
        gym = Gym.query.get_or_404(gym_id)
        
        gym_data = {
            'id': gym.id,
            'name': gym.name,
            'address': gym.address,
            'city': gym.city,
            'rating': gym.rating,
            'review_count': gym.review_count,
            'distance': gym.distance,
            'price_per_month': gym.price_per_month,
            'image_url': gym.image_url,
            'phone': gym.phone,
            'website': gym.website,
            'description': gym.description,
            'is_open': gym.is_open,
            'amenities': [amenity.name for amenity in gym.amenities],
            'operating_hours': {
                'weekdays': next((h.open_time + ' - ' + h.close_time for h in gym.operating_hours if h.day_of_week == 'weekdays'), ''),
                'weekends': next((h.open_time + ' - ' + h.close_time for h in gym.operating_hours if h.day_of_week == 'weekends'), '')
            },
            'equipment': [eq.name for eq in gym.equipment],
            'classes': [cls.name for cls in gym.classes]
        }

        return jsonify({
            'success': True,
            'gym': gym_data
        })

    except Exception as e:
        logger.error(f"Error fetching gym {gym_id}: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Workout scheduling endpoints
@app.route('/api/workouts', methods=['GET'])
def get_workouts():
    try:
        user_id = request.args.get('user_id', type=int)
        date = request.args.get('date')
        
        query = ScheduledWorkout.query
        
        if user_id:
            query = query.filter(ScheduledWorkout.user_id == user_id)
        
        if date:
            query = query.filter(ScheduledWorkout.date == datetime.strptime(date, '%Y-%m-%d').date())
        
        workouts = query.order_by(ScheduledWorkout.date, ScheduledWorkout.time).all()
        
        workouts_data = []
        for workout in workouts:
            workout_data = {
                'id': workout.id,
                'title': workout.title,
                'date': workout.date.isoformat(),
                'time': workout.time.strftime('%H:%M'),
                'duration': workout.duration,
                'workout_type': workout.workout_type,
                'partner_id': workout.partner_id,
                'partner_name': workout.partner.name if workout.partner else None,
                'location': workout.location,
                'notes': workout.notes,
                'status': workout.status,
                'created_at': workout.created_at.isoformat()
            }
            workouts_data.append(workout_data)
        
        return jsonify({
            'success': True,
            'workouts': workouts_data
        })
        
    except Exception as e:
        logger.error(f"Error fetching workouts: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/workouts', methods=['POST'])
def create_workout():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'title', 'date', 'time', 'duration', 'workout_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        # Create new workout
        workout = ScheduledWorkout(
            user_id=data['user_id'],
            title=data['title'],
            date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
            time=datetime.strptime(data['time'], '%H:%M').time(),
            duration=data['duration'],
            workout_type=data['workout_type'],
            partner_id=data.get('partner_id'),
            location=data.get('location'),
            notes=data.get('notes'),
            status=data.get('status', 'scheduled')
        )
        
        db.session.add(workout)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Workout scheduled successfully',
            'workout_id': workout.id
        })
        
    except Exception as e:
        logger.error(f"Error creating workout: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/workouts/<int:workout_id>', methods=['PUT'])
def update_workout(workout_id):
    try:
        workout = ScheduledWorkout.query.get_or_404(workout_id)
        data = request.get_json()
        
        # Update fields
        if 'title' in data:
            workout.title = data['title']
        if 'date' in data:
            workout.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        if 'time' in data:
            workout.time = datetime.strptime(data['time'], '%H:%M').time()
        if 'duration' in data:
            workout.duration = data['duration']
        if 'workout_type' in data:
            workout.workout_type = data['workout_type']
        if 'partner_id' in data:
            workout.partner_id = data['partner_id']
        if 'location' in data:
            workout.location = data['location']
        if 'notes' in data:
            workout.notes = data['notes']
        if 'status' in data:
            workout.status = data['status']
        
        workout.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Workout updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error updating workout {workout_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/workouts/<int:workout_id>', methods=['DELETE'])
def delete_workout(workout_id):
    try:
        workout = ScheduledWorkout.query.get_or_404(workout_id)
        db.session.delete(workout)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Workout deleted successfully'
        })
        
    except Exception as e:
        logger.error(f"Error deleting workout {workout_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# Sports Activity endpoints
@app.route('/api/sports/classes', methods=['GET'])
def get_studio_classes():
    try:
        sport_type = request.args.get('sport_type')  # filter by sport type
        date = request.args.get('date')  # filter by date
        level = request.args.get('level')
        limit = request.args.get('limit', 50, type=int)  # limit results
        
        query = StudioClass.query.filter(StudioClass.is_active == True)
        
        if sport_type:
            query = query.filter(StudioClass.sport_type == sport_type)
        if date:
            try:
                filter_date = datetime.strptime(date, '%Y-%m-%d').date()
                query = query.filter(StudioClass.date == filter_date)
            except ValueError:
                pass  # Invalid date format, ignore
        if level:
            query = query.filter(StudioClass.level == level)
        
        # Only show future or today's classes (even if time passed, show today's classes)
        today = datetime.utcnow().date()
        query = query.filter(StudioClass.date >= today)
        
        # Limit and order
        classes = query.order_by(StudioClass.date, StudioClass.time).limit(limit).all()
        
        classes_data = []
        for cls in classes:
            classes_data.append({
                'id': cls.id,
                'name': cls.name,
                'sport_type': cls.sport_type,
                'instructor_name': cls.instructor_name,
                'date': cls.date.isoformat(),
                'time': cls.time.strftime('%H:%M'),
                'duration': cls.duration,
                'level': cls.level,
                'intensity': cls.intensity,
                'max_spots': cls.max_spots,
                'spots_booked': cls.spots_booked,
                'spots_left': cls.max_spots - cls.spots_booked,
                'location': cls.location,
                'description': cls.description,
                'price': cls.price,
            })
        
        return jsonify({'success': True, 'classes': classes_data})
    except Exception as e:
        logger.error(f"Error fetching studio classes: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/sports/venues', methods=['GET'])
def get_sports_venues():
    try:
        sport_type = request.args.get('sport_type')  # filter by sport type
        date = request.args.get('date')  # filter by date
        limit = request.args.get('limit', 50, type=int)  # limit results
        
        query = SportsVenue.query.filter(SportsVenue.is_available == True)
        
        if sport_type:
            query = query.filter(SportsVenue.sport_type == sport_type)
        if date:
            try:
                filter_date = datetime.strptime(date, '%Y-%m-%d').date()
                query = query.filter(SportsVenue.date == filter_date)
            except ValueError:
                pass  # Invalid date format, ignore
        
        # Only show future or today's venues (even if time passed, show today's venues)
        today = datetime.utcnow().date()
        query = query.filter(SportsVenue.date >= today)
        
        # Limit and order
        venues = query.order_by(SportsVenue.date, SportsVenue.start_time).limit(limit).all()
        
        venues_data = []
        for venue in venues:
            venues_data.append({
                'id': venue.id,
                'name': venue.name,
                'sport_type': venue.sport_type,
                'date': venue.date.isoformat(),
                'start_time': venue.start_time.strftime('%H:%M'),
                'end_time': venue.end_time.strftime('%H:%M'),
                'location': venue.location,
                'court_number': venue.court_number,
                'price_per_hour': venue.price_per_hour,
                'equipment_included': venue.equipment_included,
                'lights_included': venue.lights_included,
                'description': venue.description,
            })
        
        return jsonify({'success': True, 'venues': venues_data})
    except Exception as e:
        logger.error(f"Error fetching sports venues: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/sports/classes/book', methods=['POST'])
def book_class():
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        class_id = data.get('class_id')
        
        if not user_id or not class_id:
            return jsonify({'success': False, 'error': 'user_id and class_id are required'}), 400
        
        # Check if class exists and has spots
        studio_class = StudioClass.query.get(class_id)
        if not studio_class:
            return jsonify({'success': False, 'error': 'Class not found'}), 404
        
        if studio_class.spots_booked >= studio_class.max_spots:
            return jsonify({'success': False, 'error': 'Class is full'}), 400
        
        # Check if user already booked this class
        existing = ClassBooking.query.filter_by(user_id=user_id, class_id=class_id, status='confirmed').first()
        if existing:
            return jsonify({'success': False, 'error': 'You have already booked this class'}), 400
        
        # Create booking
        booking = ClassBooking(
            user_id=user_id,
            class_id=class_id,
            notes=data.get('notes'),
            status='confirmed'
        )
        db.session.add(booking)
        
        # Update spots booked
        studio_class.spots_booked += 1
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Class booked successfully', 'booking_id': booking.id})
    except Exception as e:
        logger.error(f"Error booking class: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/sports/venues/book', methods=['POST'])
def book_venue():
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        venue_id = data.get('venue_id')
        
        if not user_id or not venue_id:
            return jsonify({'success': False, 'error': 'user_id and venue_id are required'}), 400
        
        # Check if venue exists and is available
        venue = SportsVenue.query.get(venue_id)
        if not venue:
            return jsonify({'success': False, 'error': 'Venue not found'}), 404
        
        if not venue.is_available:
            return jsonify({'success': False, 'error': 'Venue is not available'}), 400
        
        # Check if venue is already booked
        existing = VenueBooking.query.filter_by(venue_id=venue_id, status='confirmed').first()
        if existing:
            return jsonify({'success': False, 'error': 'Venue is already booked'}), 400
        
        # Create booking
        booking = VenueBooking(
            user_id=user_id,
            venue_id=venue_id,
            notes=data.get('notes'),
            status='confirmed'
        )
        db.session.add(booking)
        
        # Mark venue as unavailable
        venue.is_available = False
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Venue booked successfully', 'booking_id': booking.id})
    except Exception as e:
        logger.error(f"Error booking venue: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# Professional Training endpoints
@app.route('/api/trainers', methods=['GET'])
def get_trainers():
    try:
        user_gender = request.args.get('user_gender')  # Filter based on user's gender
        specialization = request.args.get('specialization')
        min_rating = request.args.get('min_rating', type=float)
        limit = request.args.get('limit', 50, type=int)
        
        base_query = ProfessionalTrainer.query.filter(ProfessionalTrainer.is_available == True)
        
        # Gender-based filtering (with fallback if no matches)
        query = base_query
        if user_gender:
            if user_gender.lower() == 'female':
                # For female users: only show female trainers or trainers marked as female_friendly
                gender_query = base_query.filter(
                    db.or_(
                        ProfessionalTrainer.gender == 'female',
                        ProfessionalTrainer.female_friendly == True
                    )
                )
                # Check if any trainers match, if not, show all available
                if gender_query.count() > 0:
                    query = gender_query
                else:
                    logger.warning(f"No female-friendly trainers found, showing all trainers")
            elif user_gender.lower() == 'male':
                # For male users: show male trainers (they are unisex)
                # Male trainers work with all genders
                gender_query = base_query.filter(ProfessionalTrainer.gender == 'male')
                # Check if any trainers match, if not, show all available
                if gender_query.count() > 0:
                    query = gender_query
                else:
                    logger.warning(f"No male trainers found, showing all trainers")
        # If no gender specified, show all available trainers
        
        if specialization:
            query = query.filter(ProfessionalTrainer.specialization.contains(specialization))
        
        if min_rating:
            query = query.filter(ProfessionalTrainer.rating >= min_rating)
        
        trainers = query.order_by(ProfessionalTrainer.rating.desc(), ProfessionalTrainer.review_count.desc()).limit(limit).all()
        
        trainers_data = []
        for trainer in trainers:
            try:
                trainers_data.append({
                    'id': trainer.id,
                    'name': trainer.name,
                    'gender': trainer.gender,
                    'specialization': trainer.specialization or '',
                    'experience_years': trainer.experience_years or 0,
                    'certification': json.loads(trainer.certification) if trainer.certification else [],
                    'bio': trainer.bio or '',
                    'avatar_url': trainer.avatar_url or '',
                    'rating': float(trainer.rating) if trainer.rating else 0.0,
                    'review_count': trainer.review_count or 0,
                    'hourly_rate': float(trainer.hourly_rate) if trainer.hourly_rate else 0.0,
                    'location': trainer.location or '',
                    'languages': json.loads(trainer.languages) if trainer.languages else [],
                    'female_friendly': bool(trainer.female_friendly),
                    'is_available': bool(trainer.is_available),
                })
            except Exception as e:
                logger.error(f"Error serializing trainer {trainer.id}: {e}")
                continue
        
        total_in_db = ProfessionalTrainer.query.count()
        logger.info(f"Returning {len(trainers_data)} trainers (user_gender: {user_gender or 'not specified'}, total in DB: {total_in_db})")
        
        # Log warning if no trainers found
        if len(trainers_data) == 0:
            if total_in_db == 0:
                logger.warning("⚠️ No trainers in database! Database may need initialization. Restart backend server.")
            else:
                logger.warning(f"⚠️ No trainers match the current filters (user_gender={user_gender}, specialization={specialization}, min_rating={min_rating}). Total trainers in DB: {total_in_db}")
        
        return jsonify({'success': True, 'trainers': trainers_data})
    except Exception as e:
        logger.error(f"Error fetching trainers: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/trainers/init', methods=['POST'])
def init_trainers_manual():
    """Manual endpoint to initialize trainers if they're missing"""
    try:
        with app.app_context():
            trainers_count = ProfessionalTrainer.query.count()
            if trainers_count < 10:
                logger.info(f"Manually initializing trainers (current count: {trainers_count})")
                init_db()
                new_count = ProfessionalTrainer.query.count()
                return jsonify({
                    'success': True, 
                    'message': f'Initialized trainers. Now have {new_count} trainers.',
                    'trainers_count': new_count
                })
            else:
                return jsonify({
                    'success': True,
                    'message': f'Already have {trainers_count} trainers. No initialization needed.',
                    'trainers_count': trainers_count
                })
    except Exception as e:
        logger.error(f"Error manually initializing trainers: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/diet-plans', methods=['GET'])
def get_diet_plans():
    try:
        user_gender = request.args.get('user_gender')  # Filter based on user's gender
        goal = request.args.get('goal')
        difficulty = request.args.get('difficulty')
        limit = request.args.get('limit', 50, type=int)
        
        query = DietPlan.query.filter(DietPlan.is_active == True)
        
        # Gender-based filtering
        if user_gender:
            if user_gender.lower() == 'female':
                # For female users: only show female-specific or unisex plans
                query = query.filter(
                    db.or_(
                        DietPlan.gender_target == 'female',
                        DietPlan.gender_target == 'unisex'
                    )
                )
            elif user_gender.lower() == 'male':
                # For male users: only show unisex plans (not female-specific)
                query = query.filter(DietPlan.gender_target == 'unisex')
        
        if goal:
            query = query.filter(DietPlan.goals.contains(goal))
        
        if difficulty:
            query = query.filter(DietPlan.difficulty == difficulty)
        
        plans = query.order_by(DietPlan.created_at.desc()).limit(limit).all()
        
        plans_data = []
        for plan in plans:
            plans_data.append({
                'id': plan.id,
                'name': plan.name,
                'gender_target': plan.gender_target,
                'description': plan.description,
                'duration_weeks': plan.duration_weeks,
                'daily_calories': plan.daily_calories,
                'meal_plan': json.loads(plan.meal_plan) if plan.meal_plan else {},
                'goals': json.loads(plan.goals) if plan.goals else [],
                'difficulty': plan.difficulty,
                'created_by_trainer_id': plan.created_by_trainer_id,
                'trainer_name': plan.trainer.name if plan.trainer else None,
                'price': plan.price,
            })
        
        return jsonify({'success': True, 'diet_plans': plans_data})
    except Exception as e:
        logger.error(f"Error fetching diet plans: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/diet-plans/custom', methods=['POST'])
def create_custom_diet_plan():
    """Generate a custom diet plan based on user preferences"""
    try:
        data = request.get_json() or {}
        user_gender = data.get('user_gender', '').lower()
        goals = data.get('goals', [])
        difficulty = data.get('difficulty', 'beginner')
        duration_weeks = data.get('duration_weeks', 4)
        dietary_restrictions = data.get('dietary_restrictions', [])
        menstrual_cycle_phase = data.get('menstrual_cycle_phase')  # 'menstrual', 'follicular', 'ovulation', 'luteal'
        activity_level = data.get('activity_level', 'moderate')
        age = data.get('age', 30)
        weight = data.get('weight', 65)
        height = data.get('height', 165)
        
        # Calculate BMR and daily calories
        if user_gender == 'female':
            bmr = 655 + (9.6 * weight) + (1.8 * height) - (4.7 * age)
        else:
            bmr = 66 + (13.7 * weight) + (5 * height) - (6.8 * age)
        
        # Activity multiplier
        activity_multipliers = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'active': 1.725,
            'very_active': 1.9
        }
        tdee = bmr * activity_multipliers.get(activity_level, 1.55)
        
        # Adjust calories based on goals
        if 'weight_loss' in goals:
            daily_calories = int(tdee * 0.85)  # 15% deficit
        elif 'muscle_gain' in goals:
            daily_calories = int(tdee * 1.15)  # 15% surplus
        else:
            daily_calories = int(tdee)
        
        # Adjust for menstrual cycle (women only)
        if user_gender == 'female' and menstrual_cycle_phase:
            cycle_adjustments = {
                'menstrual': {'calories': -100, 'iron': 'high', 'magnesium': 'high', 'vitamin_b6': 'high'},
                'follicular': {'calories': 0, 'protein': 'normal', 'carbs': 'normal'},
                'ovulation': {'calories': 0, 'protein': 'normal', 'carbs': 'normal'},
                'luteal': {'calories': 100, 'magnesium': 'high', 'vitamin_b6': 'high', 'carbs': 'moderate'}
            }
            adjustment = cycle_adjustments.get(menstrual_cycle_phase, {})
            daily_calories += adjustment.get('calories', 0)
        
        # Generate meal plan based on preferences
        meal_plan = generate_meal_plan(
            daily_calories=daily_calories,
            goals=goals,
            dietary_restrictions=dietary_restrictions,
            user_gender=user_gender,
            menstrual_phase=menstrual_cycle_phase if user_gender == 'female' else None
        )
        
        # Create plan name
        goal_str = ', '.join([g.replace('_', ' ').title() for g in goals[:2]])
        plan_name = f"Custom {goal_str} Plan"
        if user_gender == 'female' and menstrual_cycle_phase:
            phase_name = menstrual_cycle_phase.replace('_', ' ').title()
            plan_name += f" - {phase_name} Phase"
        
        custom_plan = {
            'name': plan_name,
            'gender_target': user_gender if user_gender in ['male', 'female'] else 'unisex',
            'description': f"Personalized {duration_weeks}-week nutrition plan tailored to your goals and preferences.",
            'duration_weeks': duration_weeks,
            'daily_calories': daily_calories,
            'meal_plan': meal_plan,
            'goals': goals,
            'difficulty': difficulty,
            'price': 0,  # Custom plans are free
            'dietary_restrictions': dietary_restrictions,
            'menstrual_cycle_phase': menstrual_cycle_phase if user_gender == 'female' else None
        }
        
        return jsonify({'success': True, 'diet_plan': custom_plan})
    except Exception as e:
        logger.error(f"Error creating custom diet plan: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

def generate_meal_plan(daily_calories, goals, dietary_restrictions, user_gender, menstrual_phase=None):
    """Generate a meal plan based on calories and preferences"""
    # Macro distribution
    protein_pct = 0.30 if 'muscle_gain' in goals else 0.25
    carbs_pct = 0.45 if 'weight_loss' not in goals else 0.35
    fat_pct = 1 - protein_pct - carbs_pct
    
    protein_cals = int(daily_calories * protein_pct)
    carbs_cals = int(daily_calories * carbs_pct)
    fat_cals = int(daily_calories * fat_pct)
    
    protein_grams = int(protein_cals / 4)
    carbs_grams = int(carbs_cals / 4)
    fat_grams = int(fat_cals / 9)
    
    # Adjust for menstrual cycle
    cycle_foods = {}
    if user_gender == 'female' and menstrual_phase:
        if menstrual_phase == 'menstrual':
            cycle_foods = {
                'iron_rich': ['spinach', 'lentils', 'lean beef', 'dark chocolate'],
                'magnesium_rich': ['almonds', 'bananas', 'dark leafy greens', 'pumpkin seeds'],
                'vitamin_b6': ['chicken', 'salmon', 'chickpeas', 'potatoes']
            }
        elif menstrual_phase == 'luteal':
            cycle_foods = {
                'magnesium_rich': ['almonds', 'dark chocolate', 'avocado', 'whole grains'],
                'complex_carbs': ['sweet potatoes', 'brown rice', 'oats', 'quinoa'],
                'vitamin_b6': ['salmon', 'chicken', 'bananas', 'sunflower seeds']
            }
    
    # Sample meal structure
    breakfast_cals = int(daily_calories * 0.25)
    lunch_cals = int(daily_calories * 0.35)
    dinner_cals = int(daily_calories * 0.30)
    snacks_cals = int(daily_calories * 0.10)
    
    meal_plan = {
        'breakfast': {
            'calories': breakfast_cals,
            'protein': f"{int(breakfast_cals * protein_pct / 4)}g",
            'carbs': f"{int(breakfast_cals * carbs_pct / 4)}g",
            'fat': f"{int(breakfast_cals * fat_pct / 9)}g",
            'suggestions': generate_meal_suggestions('breakfast', breakfast_cals, dietary_restrictions, cycle_foods)
        },
        'lunch': {
            'calories': lunch_cals,
            'protein': f"{int(lunch_cals * protein_pct / 4)}g",
            'carbs': f"{int(lunch_cals * carbs_pct / 4)}g",
            'fat': f"{int(lunch_cals * fat_pct / 9)}g",
            'suggestions': generate_meal_suggestions('lunch', lunch_cals, dietary_restrictions, cycle_foods)
        },
        'dinner': {
            'calories': dinner_cals,
            'protein': f"{int(dinner_cals * protein_pct / 4)}g",
            'carbs': f"{int(dinner_cals * carbs_pct / 4)}g",
            'fat': f"{int(dinner_cals * fat_pct / 9)}g",
            'suggestions': generate_meal_suggestions('dinner', dinner_cals, dietary_restrictions, cycle_foods)
        },
        'snacks': {
            'calories': snacks_cals,
            'suggestions': generate_meal_suggestions('snacks', snacks_cals, dietary_restrictions, cycle_foods)
        },
        'macros': {
            'protein': f"{protein_grams}g ({protein_pct*100:.0f}%)",
            'carbs': f"{carbs_grams}g ({carbs_pct*100:.0f}%)",
            'fat': f"{fat_grams}g ({fat_pct*100:.0f}%)",
            'total_calories': daily_calories
        },
        'cycle_specific_nutrition': cycle_foods if cycle_foods else None
    }
    
    return meal_plan

def generate_meal_suggestions(meal_type, calories, dietary_restrictions, cycle_foods):
    """Generate meal suggestions based on meal type and restrictions"""
    suggestions = []
    
    if meal_type == 'breakfast':
        base_suggestions = [
            "Oatmeal with berries and Greek yogurt",
            "Scrambled eggs with whole grain toast and avocado",
            "Protein smoothie with banana and spinach",
            "Greek yogurt parfait with granola and fruits",
            "Whole grain pancakes with eggs"
        ]
        if cycle_foods:
            if 'iron_rich' in cycle_foods:
                base_suggestions.insert(0, "Spinach and egg scramble with whole grain toast")
            if 'magnesium_rich' in cycle_foods:
                base_suggestions.insert(0, "Oatmeal with almonds, banana, and pumpkin seeds")
    elif meal_type == 'lunch':
        base_suggestions = [
            "Grilled chicken salad with mixed vegetables",
            "Quinoa bowl with roasted vegetables and chickpeas",
            "Salmon with sweet potato and steamed broccoli",
            "Lentil soup with whole grain bread",
            "Turkey wrap with vegetables and hummus"
        ]
        if cycle_foods:
            if 'iron_rich' in cycle_foods:
                base_suggestions.insert(0, "Lean beef stir-fry with dark leafy greens")
            if 'vitamin_b6' in cycle_foods:
                base_suggestions.insert(0, "Chicken breast with chickpeas and vegetables")
    elif meal_type == 'dinner':
        base_suggestions = [
            "Baked salmon with quinoa and roasted vegetables",
            "Grilled chicken with brown rice and steamed broccoli",
            "Lean beef with sweet potato and green beans",
            "Turkey meatballs with whole grain pasta and marinara",
            "Baked cod with roasted vegetables and quinoa"
        ]
        if cycle_foods:
            if 'iron_rich' in cycle_foods:
                base_suggestions.insert(0, "Lean beef with spinach and lentils")
            if 'complex_carbs' in cycle_foods:
                base_suggestions.insert(0, "Salmon with sweet potato and quinoa")
    else:  # snacks
        base_suggestions = [
            "Greek yogurt with berries",
            "Apple with almond butter",
            "Mixed nuts and dried fruits",
            "Protein bar",
            "Hummus with vegetable sticks"
        ]
        if cycle_foods:
            if 'magnesium_rich' in cycle_foods:
                base_suggestions.insert(0, "Dark chocolate with almonds")
            if 'vitamin_b6' in cycle_foods:
                base_suggestions.insert(0, "Banana with sunflower seeds")
    
    # Filter based on dietary restrictions
    for restriction in dietary_restrictions:
        if 'vegetarian' in restriction.lower():
            base_suggestions = [s for s in base_suggestions if 'chicken' not in s.lower() and 'beef' not in s.lower() and 'turkey' not in s.lower() and 'salmon' not in s.lower() and 'cod' not in s.lower()]
        if 'vegan' in restriction.lower():
            base_suggestions = [s for s in base_suggestions if 'egg' not in s.lower() and 'yogurt' not in s.lower() and 'chicken' not in s.lower() and 'beef' not in s.lower()]
        if 'gluten' in restriction.lower():
            base_suggestions = [s for s in base_suggestions if 'bread' not in s.lower() and 'pasta' not in s.lower() and 'wheat' not in s.lower()]
    
    return base_suggestions[:3]  # Return top 3 suggestions

@app.route('/api/home-sessions/book', methods=['POST'])
def book_home_session():
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        trainer_id = data.get('trainer_id')
        session_date = data.get('session_date')
        session_time = data.get('session_time')
        duration_hours = data.get('duration_hours', 1.0)
        location = data.get('location')
        session_type = data.get('session_type', 'personal_training')
        notes = data.get('notes')
        
        if not all([user_id, trainer_id, session_date, session_time, location]):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        # Get trainer to calculate price
        trainer = ProfessionalTrainer.query.get(trainer_id)
        if not trainer:
            return jsonify({'success': False, 'error': 'Trainer not found'}), 404
        
        if not trainer.is_available:
            return jsonify({'success': False, 'error': 'Trainer is not available'}), 400
        
        # Calculate total price
        total_price = trainer.hourly_rate * duration_hours
        
        booking = HomeSessionBooking(
            user_id=user_id,
            trainer_id=trainer_id,
            session_date=datetime.strptime(session_date, '%Y-%m-%d').date(),
            session_time=datetime.strptime(session_time, '%H:%M').time(),
            duration_hours=duration_hours,
            location=location,
            session_type=session_type,
            notes=notes,
            total_price=total_price,
            status='pending'
        )
        
        db.session.add(booking)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Home session booked successfully', 'booking_id': booking.id})
    except Exception as e:
        logger.error(f"Error booking home session: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/home-sessions', methods=['GET'])
def get_home_sessions():
    try:
        user_id = request.args.get('user_id', type=int)
        status = request.args.get('status')
        
        query = HomeSessionBooking.query
        
        if user_id:
            query = query.filter(HomeSessionBooking.user_id == user_id)
        
        if status:
            query = query.filter(HomeSessionBooking.status == status)
        
        bookings = query.order_by(HomeSessionBooking.session_date.desc(), HomeSessionBooking.session_time.desc()).all()
        
        bookings_data = []
        for booking in bookings:
            bookings_data.append({
                'id': booking.id,
                'user_id': booking.user_id,
                'trainer_id': booking.trainer_id,
                'trainer_name': booking.trainer.name if booking.trainer else None,
                'session_date': booking.session_date.isoformat(),
                'session_time': booking.session_time.strftime('%H:%M'),
                'duration_hours': booking.duration_hours,
                'location': booking.location,
                'session_type': booking.session_type,
                'status': booking.status,
                'notes': booking.notes,
                'total_price': booking.total_price,
                'created_at': booking.created_at.isoformat(),
            })
        
        return jsonify({'success': True, 'bookings': bookings_data})
    except Exception as e:
        logger.error(f"Error fetching home sessions: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Exercise endpoints
@app.route('/api/exercises', methods=['GET'])
def get_exercises():
    try:
        exercise_type = request.args.get('type')
        difficulty = request.args.get('difficulty')
        
        query = Exercise.query
        
        if exercise_type:
            query = query.filter(Exercise.type == exercise_type)
        
        if difficulty:
            query = query.filter(Exercise.difficulty == difficulty)
        
        exercises = query.all()
        
        exercises_data = []
        for exercise in exercises:
            exercise_data = {
                'id': exercise.id,
                'name': exercise.name,
                'type': exercise.type,
                'duration': exercise.duration,
                'difficulty': exercise.difficulty,
                'description': exercise.description,
                'equipment': exercise.equipment.split(',') if exercise.equipment else [],
                'muscle_groups': exercise.muscle_groups.split(',') if exercise.muscle_groups else []
            }
            exercises_data.append(exercise_data)
        
        return jsonify({
            'success': True,
            'exercises': exercises_data
        })
        
    except Exception as e:
        logger.error(f"Error fetching exercises: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Initialize database
def init_db():
    """Initialize the database with sample data and ensure columns exist"""
    with app.app_context():
        # Create all tables including new sports activity tables
        db.create_all()

        # Lightweight column additions for existing SQLite DBs
        def _ensure_column(table: str, column: str, type_sql: str):
            try:
                res = db.session.execute(text(f"PRAGMA table_info({table})"))
                cols = [row[1] for row in res.fetchall()]
                if column not in cols:
                    db.session.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {type_sql}"))
                    db.session.commit()
                    logger.info(f"Added column {table}.{column}")
            except Exception as e:
                logger.warning(f"Skip adding column {table}.{column}: {e}")

        _ensure_column('user', 'username', 'VARCHAR(100)')
        _ensure_column('user', 'password_hash', 'VARCHAR(255)')
        _ensure_column('user', 'goals', 'TEXT')
        _ensure_column('user', 'preferred_workout_time', 'VARCHAR(50)')
        _ensure_column('user', 'availability_schedule', 'TEXT')
        _ensure_column('user', 'last_active', 'DATETIME')
        _ensure_column('user', 'gender', 'VARCHAR(20)')
        _ensure_column('user', 'height', 'FLOAT')
        _ensure_column('user', 'weight', 'FLOAT')
        
        # Check if gym data exists (for backward compatibility)
        gyms_exist = Gym.query.first() is not None
        
        # Check if sports activity data exists
        classes_exist = StudioClass.query.first() is not None
        
        # Check trainers separately - always ensure trainers exist
        trainers_count = ProfessionalTrainer.query.count()
        logger.info(f"Current trainers in database: {trainers_count}")
        
        # Only skip gym/class creation if both exist, but always check trainers
        if gyms_exist and classes_exist:
            logger.info("Gyms and classes already exist, skipping their creation")
            # Don't return - continue to check and add trainers if needed
        # If gyms exist but classes don't, we'll add classes only
        elif gyms_exist and not classes_exist:
            logger.info("Adding sports activity data to existing database")
            # Skip gym creation, go straight to classes
        elif not gyms_exist:
            # Create sample gyms only if they don't exist
            gym1 = Gym(
                name="FitZone Premium",
                address="123 Main Street",
                city="New York, NY",
                rating=4.8,
                review_count=1247,
                distance=0.8,
                price_per_month=89.0,
                phone="+1 (555) 123-4567",
                website="www.fitzonepremium.com",
                description="Premium fitness center with state-of-the-art equipment and expert trainers.",
                is_open=True
            )
            
            gym2 = Gym(
                name="PowerFit Gym",
                address="456 Oak Avenue",
                city="San Francisco, CA",
                rating=4.6,
                review_count=892,
                distance=1.2,
                price_per_month=65.0,
                phone="+1 (555) 987-6543",
                website="www.powerfitgym.com",
                description="Community-focused gym with friendly atmosphere and affordable membership.",
                is_open=True
            )
            
            db.session.add(gym1)
            db.session.add(gym2)
            db.session.commit()
            
            # Add amenities
            amenities1 = [
                GymAmenity(gym_id=gym1.id, name="Parking"),
                GymAmenity(gym_id=gym1.id, name="Locker Rooms"),
                GymAmenity(gym_id=gym1.id, name="Showers"),
                GymAmenity(gym_id=gym1.id, name="WiFi"),
                GymAmenity(gym_id=gym1.id, name="Cafe")
            ]
            
            amenities2 = [
                GymAmenity(gym_id=gym2.id, name="Parking"),
                GymAmenity(gym_id=gym2.id, name="Locker Rooms"),
                GymAmenity(gym_id=gym2.id, name="Showers"),
                GymAmenity(gym_id=gym2.id, name="WiFi")
            ]
            
            for amenity in amenities1 + amenities2:
                db.session.add(amenity)
            
            # Add operating hours
            hours1 = [
                GymOperatingHours(gym_id=gym1.id, day_of_week="weekdays", open_time="05:00", close_time="23:00"),
                GymOperatingHours(gym_id=gym1.id, day_of_week="weekends", open_time="06:00", close_time="22:00")
            ]
            
            hours2 = [
                GymOperatingHours(gym_id=gym2.id, day_of_week="weekdays", open_time="06:00", close_time="22:00"),
                GymOperatingHours(gym_id=gym2.id, day_of_week="weekends", open_time="07:00", close_time="21:00")
            ]
            
            for hour in hours1 + hours2:
                db.session.add(hour)
            
            # Add equipment
            equipment1 = [
                GymEquipment(gym_id=gym1.id, name="Cardio Machines"),
                GymEquipment(gym_id=gym1.id, name="Weight Training"),
                GymEquipment(gym_id=gym1.id, name="Functional Training"),
                GymEquipment(gym_id=gym1.id, name="Swimming Pool")
            ]
            
            equipment2 = [
                GymEquipment(gym_id=gym2.id, name="Cardio Machines"),
                GymEquipment(gym_id=gym2.id, name="Weight Training"),
                GymEquipment(gym_id=gym2.id, name="Functional Training")
            ]
            
            for eq in equipment1 + equipment2:
                db.session.add(eq)
            
            # Add classes
            classes1 = [
                GymClass(gym_id=gym1.id, name="Yoga"),
                GymClass(gym_id=gym1.id, name="Pilates"),
                GymClass(gym_id=gym1.id, name="HIIT"),
                GymClass(gym_id=gym1.id, name="CrossFit"),
                GymClass(gym_id=gym1.id, name="Zumba")
            ]
            
            classes2 = [
                GymClass(gym_id=gym2.id, name="Yoga"),
                GymClass(gym_id=gym2.id, name="HIIT"),
                GymClass(gym_id=gym2.id, name="Strength Training")
            ]
            
            for cls in classes1 + classes2:
                db.session.add(cls)
        
        # Add sample exercises (always add if they don't exist)
        exercises = [
            Exercise(
                name="Push-ups",
                type="strength",
                duration=10,
                difficulty="beginner",
                description="Classic bodyweight exercise for chest, shoulders, and triceps",
                equipment="None",
                muscle_groups="Chest,Shoulders,Triceps"
            ),
            Exercise(
                name="Squats",
                type="strength",
                duration=15,
                difficulty="beginner",
                description="Fundamental lower body exercise",
                equipment="None",
                muscle_groups="Quadriceps,Glutes,Hamstrings"
            ),
            Exercise(
                name="Running",
                type="cardio",
                duration=30,
                difficulty="intermediate",
                description="Cardiovascular exercise for endurance",
                equipment="None",
                muscle_groups="Legs,Core"
            ),
            Exercise(
                name="Deadlifts",
                type="strength",
                duration=20,
                difficulty="advanced",
                description="Compound movement for posterior chain",
                equipment="Barbell,Weight Plates",
                muscle_groups="Hamstrings,Glutes,Back"
            )
        ]
        
        for exercise in exercises:
            db.session.add(exercise)
        
        # Add sample studio classes
        today = datetime.utcnow().date()
        tomorrow = today + timedelta(days=1)
        
        studio_classes = [
            # Yoga classes
            StudioClass(name="Glow Flow Yoga", sport_type="yoga", instructor_name="Sarah Chen", 
                       date=today, time=datetime.strptime("19:00", "%H:%M").time(), duration=45,
                       level="all_levels", intensity="gentle", max_spots=12, spots_booked=8,
                       location="Rooftop Studio • City Center", price=2075.0,  # ₹2075 (~$25)
                       description="Soft, breath-led flows with a calm but elevated studio vibe."),
            StudioClass(name="Power Vinyasa", sport_type="yoga", instructor_name="Mike Johnson",
                       date=tomorrow, time=datetime.strptime("18:00", "%H:%M").time(), duration=60,
                       level="intermediate", intensity="high", max_spots=15, spots_booked=5,
                       location="Zen Studio • Downtown", price=2490.0,  # ₹2490 (~$30)
                       description="Dynamic flow sequences building strength and flexibility."),
            StudioClass(name="Yin & Restore", sport_type="yoga", instructor_name="Emma Davis",
                       date=tomorrow, time=datetime.strptime("20:00", "%H:%M").time(), duration=75,
                       level="all_levels", intensity="gentle", max_spots=10, spots_booked=3,
                       location="Serenity Room • Wellness Hub", price=1826.0,  # ₹1826 (~$22)
                       description="Deep stretches and relaxation for body and mind."),
            
            # Pilates classes
            StudioClass(name="Core Reform Pilates", sport_type="pilates", instructor_name="Lisa Martinez",
                       date=today, time=datetime.strptime("20:15", "%H:%M").time(), duration=50,
                       level="intermediate", intensity="moderate", max_spots=10, spots_booked=7,
                       location="Reform Studio • Level 2", price=2905.0,  # ₹2905 (~$35)
                       description="Targeted core work using reformer machines."),
            StudioClass(name="Mat Pilates Flow", sport_type="pilates", instructor_name="David Kim",
                       date=tomorrow, time=datetime.strptime("17:30", "%H:%M").time(), duration=45,
                       level="beginner", intensity="moderate", max_spots=20, spots_booked=12,
                       location="Main Studio • Fitness Center", price=1660.0,  # ₹1660 (~$20)
                       description="Classic pilates movements on the mat."),
            StudioClass(name="Advanced Pilates", sport_type="pilates", instructor_name="Rachel Green",
                       date=tomorrow, time=datetime.strptime("19:00", "%H:%M").time(), duration=55,
                       level="advanced", intensity="high", max_spots=8, spots_booked=4,
                       location="Elite Studio • Premium Floor", price=3320.0,  # ₹3320 (~$40)
                       description="Challenging sequences for experienced practitioners."),
            
            # Aerial classes
            StudioClass(name="Aerial Dance Fusion", sport_type="aerial", instructor_name="Zoe Williams",
                       date=tomorrow, time=datetime.strptime("18:30", "%H:%M").time(), duration=60,
                       level="beginner", intensity="moderate", max_spots=8, spots_booked=6,
                       location="Aerial Studio • Arts Center", price=3735.0,  # ₹3735 (~$45)
                       description="Graceful movements combining dance and aerial silks."),
            StudioClass(name="Aerial Yoga Flow", sport_type="aerial", instructor_name="Alex Taylor",
                       date=today, time=datetime.strptime("19:30", "%H:%M").time(), duration=50,
                       level="intermediate", intensity="moderate", max_spots=6, spots_booked=2,
                       location="Hammock Studio • Yoga Loft", price=3154.0,  # ₹3154 (~$38)
                       description="Yoga poses suspended in aerial hammocks."),
            
            # Dance fitness classes
            StudioClass(name="Dance Burn Session", sport_type="dance_fitness", instructor_name="Maria Rodriguez",
                       date=today, time=datetime.strptime("20:15", "%H:%M").time(), duration=50,
                       level="intermediate", intensity="high", max_spots=25, spots_booked=22,
                       location="Neon Studio • Level 2", price=2324.0,  # ₹2324 (~$28)
                       description="High-energy choreography to bass-driven pop & Bollywood."),
            StudioClass(name="Zumba Party", sport_type="dance_fitness", instructor_name="Carlos Mendez",
                       date=tomorrow, time=datetime.strptime("19:00", "%H:%M").time(), duration=60,
                       level="all_levels", intensity="high", max_spots=30, spots_booked=15,
                       location="Party Room • Dance Hall", price=2075.0,  # ₹2075 (~$25)
                       description="Latin-inspired dance fitness party."),
            StudioClass(name="Hip Hop Cardio", sport_type="dance_fitness", instructor_name="Jamie Park",
                       date=tomorrow, time=datetime.strptime("20:00", "%H:%M").time(), duration=45,
                       level="beginner", intensity="moderate", max_spots=20, spots_booked=10,
                       location="Urban Studio • Street Level", price=1826.0,  # ₹1826 (~$22)
                       description="Fun hip-hop moves that get your heart pumping."),
        ]
        
        for cls in studio_classes:
            db.session.add(cls)
        
        # Add sample sports venues
        venues = [
            # Pickleball
            SportsVenue(name="Pickleball Court A", sport_type="pickleball", date=today,
                       start_time=datetime.strptime("18:00", "%H:%M").time(),
                       end_time=datetime.strptime("19:00", "%H:%M").time(),
                       location="Club Arena", court_number="Court A", price_per_hour=30.0,
                       equipment_included=True, lights_included=True, is_available=True,
                       description="Premium pickleball court with professional-grade equipment."),
            SportsVenue(name="Pickleball Court B", sport_type="pickleball", date=today,
                       start_time=datetime.strptime("19:30", "%H:%M").time(),
                       end_time=datetime.strptime("20:30", "%H:%M").time(),
                       location="Club Arena", court_number="Court B", price_per_hour=30.0,
                       equipment_included=True, lights_included=True, is_available=True,
                       description="Well-maintained court perfect for evening play."),
            SportsVenue(name="Pickleball Court 1", sport_type="pickleball", date=tomorrow,
                       start_time=datetime.strptime("17:00", "%H:%M").time(),
                       end_time=datetime.strptime("18:00", "%H:%M").time(),
                       location="Sports Complex", court_number="Court 1", price_per_hour=25.0,
                       equipment_included=True, lights_included=False, is_available=True,
                       description="Outdoor court with excellent surface quality."),
            
            # Badminton
            SportsVenue(name="Badminton Court 2", sport_type="badminton", date=today,
                       start_time=datetime.strptime("19:30", "%H:%M").time(),
                       end_time=datetime.strptime("20:30", "%H:%M").time(),
                       location="Indoor Sports Hub", court_number="Court 2", price_per_hour=20.0,
                       equipment_included=True, lights_included=True, is_available=True,
                       description="Professional badminton court with proper lighting."),
            SportsVenue(name="Badminton Court 3", sport_type="badminton", date=tomorrow,
                       start_time=datetime.strptime("18:00", "%H:%M").time(),
                       end_time=datetime.strptime("19:00", "%H:%M").time(),
                       location="Indoor Sports Hub", court_number="Court 3", price_per_hour=20.0,
                       equipment_included=True, lights_included=True, is_available=True,
                       description="Spacious court ideal for doubles play."),
            SportsVenue(name="Badminton Court 5", sport_type="badminton", date=tomorrow,
                       start_time=datetime.strptime("20:00", "%H:%M").time(),
                       end_time=datetime.strptime("21:00", "%H:%M").time(),
                       location="Community Center", court_number="Court 5", price_per_hour=18.0,
                       equipment_included=False, lights_included=True, is_available=True,
                       description="Affordable option with good lighting."),
            
            # Tennis
            SportsVenue(name="Tennis Court 1", sport_type="tennis", date=today,
                       start_time=datetime.strptime("18:00", "%H:%M").time(),
                       end_time=datetime.strptime("19:30", "%H:%M").time(),
                       location="Tennis Club", court_number="Court 1", price_per_hour=50.0,
                       equipment_included=False, lights_included=True, is_available=True,
                       description="Premium hard court with professional lighting."),
            SportsVenue(name="Tennis Court 2", sport_type="tennis", date=tomorrow,
                       start_time=datetime.strptime("17:00", "%H:%M").time(),
                       end_time=datetime.strptime("18:30", "%H:%M").time(),
                       location="Tennis Club", court_number="Court 2", price_per_hour=50.0,
                       equipment_included=False, lights_included=True, is_available=True,
                       description="Clay court option for different playing style."),
            
            # Basketball
            SportsVenue(name="Basketball Court A", sport_type="basketball", date=today,
                       start_time=datetime.strptime("19:00", "%H:%M").time(),
                       end_time=datetime.strptime("20:00", "%H:%M").time(),
                       location="Sports Arena", court_number="Court A", price_per_hour=40.0,
                       equipment_included=True, lights_included=True, is_available=True,
                       description="Full-size court with basketballs provided."),
            SportsVenue(name="Basketball Court B", sport_type="basketball", date=tomorrow,
                       start_time=datetime.strptime("18:00", "%H:%M").time(),
                       end_time=datetime.strptime("19:00", "%H:%M").time(),
                       location="Sports Arena", court_number="Court B", price_per_hour=40.0,
                       equipment_included=True, lights_included=True, is_available=True,
                       description="Indoor court perfect for evening games."),
            
            # Volleyball
            SportsVenue(name="Volleyball Court 1", sport_type="volleyball", date=today,
                       start_time=datetime.strptime("19:00", "%H:%M").time(),
                       end_time=datetime.strptime("20:00", "%H:%M").time(),
                       location="Beach Sports Center", court_number="Court 1", price_per_hour=35.0,
                       equipment_included=True, lights_included=True, is_available=True,
                       description="Sand court for beach volleyball experience."),
            SportsVenue(name="Volleyball Court 2", sport_type="volleyball", date=tomorrow,
                       start_time=datetime.strptime("18:00", "%H:%M").time(),
                       end_time=datetime.strptime("19:00", "%H:%M").time(),
                       location="Indoor Sports Hub", court_number="Court 2", price_per_hour=30.0,
                       equipment_included=True, lights_included=True, is_available=True,
                       description="Indoor hard court with net and balls included."),
            
            # Multi-sport
            SportsVenue(name="Multi-sport Arena", sport_type="multi_sport", date=tomorrow,
                       start_time=datetime.strptime("18:00", "%H:%M").time(),
                       end_time=datetime.strptime("20:00", "%H:%M").time(),
                       location="City Center", court_number="Main Arena", price_per_hour=60.0,
                       equipment_included=True, lights_included=True, is_available=True,
                       description="Flexible space for various sports activities."),
        ]
        
        for venue in venues:
            db.session.add(venue)
        
        # Always add trainers if we have less than 10 (ensures we have both genders and variety)
        # Note: trainers_count was already checked at the beginning of init_db()
        if trainers_count < 10:
            logger.info(f"Adding trainers to database (current count: {trainers_count})")
            # Add sample professional trainers
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
                    hourly_rate=625.0,  # ₹625/hr (~$7.5/hr)
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
                    hourly_rate=540.0,  # ₹540/hr (~$6.5/hr)
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
                    hourly_rate=705.0,  # ₹705/hr (~$8.5/hr)
                    is_available=True,
                    female_friendly=True,
                    location="Fitness Hub",
                    languages=json.dumps(["English", "Hindi"])
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
                    hourly_rate=580.0,  # ₹580/hr (~$7/hr)
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
                    hourly_rate=500.0,  # ₹500/hr (~$6/hr)
                    is_available=True,
                    female_friendly=False,
                    location="City Center",
                    languages=json.dumps(["English", "Korean"])
                ),
                # More female trainers
                ProfessionalTrainer(
                    name="Jessica Martinez",
                    gender="female",
                    specialization="Prenatal Fitness, Core Strength, Low Impact Training",
                    experience_years=5,
                    certification=json.dumps(["AFAA-CPT", "Prenatal Fitness Specialist", "Yoga Instructor"]),
                    bio="Dedicated to supporting women through all life stages. Safe, effective training for expecting and new mothers.",
                    rating=4.85,
                    review_count=68,
                    hourly_rate=580.0,  # ₹580/hr (~$7/hr)
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
                    hourly_rate=665.0,  # ₹665/hr (~$8/hr)
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
                    hourly_rate=540.0,  # ₹540/hr (~$6.5/hr)
                    is_available=True,
                    female_friendly=True,
                    location="Dance & Fitness Studio",
                    languages=json.dumps(["English", "French"])
                ),
                # More unisex male trainers
                ProfessionalTrainer(
                    name="James Anderson",
                    gender="male",
                    specialization="Bodybuilding, Powerlifting, Strength Training",
                    experience_years=15,
                    certification=json.dumps(["CSCS", "USAPL Coach", "Nutrition Specialist"]),
                    bio="Veteran strength coach specializing in powerlifting and bodybuilding. Unisex training approach.",
                    rating=4.75,
                    review_count=198,
                    hourly_rate=750.0,  # ₹750/hr (~$9/hr)
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
                    hourly_rate=625.0,  # ₹625/hr (~$7.5/hr)
                    is_available=True,
                    female_friendly=False,
                    location="Rehabilitation Center",
                    languages=json.dumps(["English", "Mandarin"])
                ),
                # Additional Female Trainers
                ProfessionalTrainer(
                    name="Sofia Patel",
                    gender="female",
                    specialization="PCOS Fitness, Hormonal Health, Weight Management",
                    experience_years=7,
                    certification=json.dumps(["NASM-CPT", "Hormonal Health Specialist", "PCOS Fitness Expert"]),
                    bio="Specialized in helping women with PCOS and hormonal imbalances achieve their fitness goals safely and effectively.",
                    rating=4.9,
                    review_count=156,
                    hourly_rate=650.0,  # ₹650/hr (~$7.8/hr)
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
                    hourly_rate=600.0,  # ₹600/hr (~$7.2/hr)
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
                    hourly_rate=455.0,  # ₹455/hr (~$5.5/hr)
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
                    hourly_rate=630.0,  # ₹630/hr (~$7.6/hr)
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
                    hourly_rate=565.0,  # ₹565/hr (~$6.8/hr)
                    is_available=True,
                    female_friendly=True,
                    location="Yoga & Wellness Studio",
                    languages=json.dumps(["English", "Hindi", "Punjabi"])
                ),
                # Additional Male Trainers
                ProfessionalTrainer(
                    name="Alex Thompson",
                    gender="male",
                    specialization="Athletic Performance, Sports Training, Speed & Agility",
                    experience_years=13,
                    certification=json.dumps(["CSCS", "Sports Performance Specialist", "Speed & Agility Coach"]),
                    bio="Elite performance coach working with athletes and active individuals to maximize their potential.",
                    rating=4.8,
                    review_count=167,
                    hourly_rate=705.0,  # ₹705/hr (~$8.5/hr)
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
                    hourly_rate=680.0,  # ₹680/hr (~$8.2/hr)
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
                    hourly_rate=540.0,  # ₹540/hr (~$6.5/hr)
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
                    hourly_rate=580.0,  # ₹580/hr (~$7/hr)
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
                    hourly_rate=625.0,  # ₹625/hr (~$7.5/hr)
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
                    hourly_rate=730.0,  # ₹730/hr (~$8.8/hr)
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
                logger.info(f"Successfully added {len(trainers)} trainers to database")
            except Exception as e:
                db.session.rollback()
                logger.error(f"Error adding trainers: {e}")
                raise
            
            # Add sample diet plans
            diet_plans = [
                # Female-specific diet plans
                DietPlan(
                    name="Women's Hormone Balance Meal Plan",
                    gender_target="female",
                    description="Designed specifically for women to support hormonal health, metabolism, and energy levels.",
                    duration_weeks=4,
                    daily_calories=1800,
                    meal_plan=json.dumps({
                        "breakfast": "Oatmeal with berries and Greek yogurt",
                        "lunch": "Grilled chicken salad with avocado",
                        "dinner": "Salmon with quinoa and vegetables",
                        "snacks": "Nuts, fruits, protein smoothie"
                    }),
                    goals=json.dumps(["hormone_balance", "weight_loss", "energy"]),
                    difficulty="intermediate",
                    created_by_trainer_id=trainers[0].id if trainers else None,
                    price=49.99
                ),
                DietPlan(
                    name="Postnatal Recovery Nutrition Plan",
                    gender_target="female",
                    description="Nutrient-dense meal plan for postpartum recovery and breastfeeding support.",
                    duration_weeks=6,
                    daily_calories=2200,
                    meal_plan=json.dumps({
                        "breakfast": "Whole grain toast with eggs and vegetables",
                        "lunch": "Lean protein with sweet potato and greens",
                        "dinner": "Fish with brown rice and steamed vegetables",
                        "snacks": "Nutrient-dense smoothies, trail mix"
                    }),
                    goals=json.dumps(["recovery", "nutrition", "energy"]),
                    difficulty="beginner",
                    created_by_trainer_id=trainers[0].id if trainers else None,
                    price=4980.0  # ₹4980 (~$60)
                ),
                DietPlan(
                    name="Women's Strength Building Nutrition",
                    gender_target="female",
                    description="High-protein meal plan designed for women building muscle and strength.",
                    duration_weeks=8,
                    daily_calories=2000,
                    meal_plan=json.dumps({
                        "breakfast": "Protein pancakes with Greek yogurt",
                        "lunch": "Lean beef with quinoa and vegetables",
                        "dinner": "Chicken breast with sweet potato and broccoli",
                        "snacks": "Protein bars, cottage cheese, fruits"
                    }),
                    goals=json.dumps(["muscle_gain", "strength", "performance"]),
                    difficulty="advanced",
                    created_by_trainer_id=trainers[2].id if len(trainers) > 2 else None,
                    price=5810.0  # ₹5810 (~$70)
                ),
                # Unisex diet plans (for male users)
                DietPlan(
                    name="Balanced Nutrition Plan",
                    gender_target="unisex",
                    description="Well-rounded meal plan suitable for all genders focusing on balanced macros.",
                    duration_weeks=4,
                    daily_calories=2000,
                    meal_plan=json.dumps({
                        "breakfast": "Whole grain cereal with milk and fruits",
                        "lunch": "Grilled chicken wrap with vegetables",
                        "dinner": "Lean protein with rice and vegetables",
                        "snacks": "Nuts, yogurt, fruits"
                    }),
                    goals=json.dumps(["maintenance", "health", "energy"]),
                    difficulty="beginner",
                    created_by_trainer_id=trainers[3].id if len(trainers) > 3 else None,
                    price=3320.0  # ₹3320 (~$40)
                ),
                DietPlan(
                    name="Weight Loss Meal Plan",
                    gender_target="unisex",
                    description="Calorie-controlled meal plan for sustainable weight loss.",
                    duration_weeks=6,
                    daily_calories=1600,
                    meal_plan=json.dumps({
                        "breakfast": "Scrambled eggs with vegetables",
                        "lunch": "Grilled fish with salad",
                        "dinner": "Lean protein with steamed vegetables",
                        "snacks": "Fruits, vegetables, protein shake"
                    }),
                    goals=json.dumps(["weight_loss", "health", "energy"]),
                    difficulty="intermediate",
                    created_by_trainer_id=trainers[4].id if len(trainers) > 4 else None,
                    price=3735.0  # ₹3735 (~$45)
                ),
                DietPlan(
                    name="Muscle Building Nutrition Plan",
                    gender_target="unisex",
                    description="High-protein meal plan for muscle growth and recovery.",
                    duration_weeks=8,
                    daily_calories=2500,
                    meal_plan=json.dumps({
                        "breakfast": "Protein-rich breakfast bowl",
                        "lunch": "Lean meat with complex carbs",
                        "dinner": "Protein with rice and vegetables",
                        "snacks": "Protein bars, nuts, protein shake"
                    }),
                    goals=json.dumps(["muscle_gain", "strength", "performance"]),
                    difficulty="advanced",
                    created_by_trainer_id=trainers[3].id if len(trainers) > 3 else None,
                    price=4565.0  # ₹4565 (~$55)
                ),
                # More female-specific plans
                DietPlan(
                    name="PCOS-Friendly Nutrition Plan",
                    gender_target="female",
                    description="Specially designed meal plan to support hormonal balance and insulin sensitivity for women with PCOS.",
                    duration_weeks=12,
                    daily_calories=1600,
                    meal_plan=json.dumps({
                        "breakfast": "Low-GI oatmeal with protein",
                        "lunch": "Lean protein with non-starchy vegetables",
                        "dinner": "Fish with quinoa and leafy greens",
                        "snacks": "Nuts, seeds, Greek yogurt"
                    }),
                    goals=json.dumps(["hormone_balance", "weight_loss", "insulin_sensitivity"]),
                    difficulty="intermediate",
                    created_by_trainer_id=trainers[0].id if trainers else None,
                    price=6640.0  # ₹6640 (~$80)
                ),
                DietPlan(
                    name="Menopause Support Meal Plan",
                    gender_target="female",
                    description="Nutrition plan to support women through menopause with bone health and metabolism focus.",
                    duration_weeks=8,
                    daily_calories=1800,
                    meal_plan=json.dumps({
                        "breakfast": "Calcium-rich smoothie with greens",
                        "lunch": "Salmon with vegetables and whole grains",
                        "dinner": "Lean protein with calcium-rich vegetables",
                        "snacks": "Dairy products, nuts, fruits"
                    }),
                    goals=json.dumps(["bone_health", "metabolism", "hormone_support"]),
                    difficulty="intermediate",
                    created_by_trainer_id=trainers[1].id if len(trainers) > 1 else None,
                    price=5395.0  # ₹5395 (~$65)
                ),
                DietPlan(
                    name="Women's Athletic Performance Plan",
                    gender_target="female",
                    description="High-performance nutrition for active women athletes and fitness enthusiasts.",
                    duration_weeks=6,
                    daily_calories=2200,
                    meal_plan=json.dumps({
                        "breakfast": "Protein pancakes with fruits",
                        "lunch": "Lean meat with complex carbs",
                        "dinner": "Fish with sweet potato and vegetables",
                        "snacks": "Protein bars, recovery smoothies"
                    }),
                    goals=json.dumps(["performance", "recovery", "energy"]),
                    difficulty="advanced",
                    created_by_trainer_id=trainers[2].id if len(trainers) > 2 else None,
                    price=6220.0  # ₹6220 (~$75)
                ),
                # More unisex plans
                DietPlan(
                    name="Mediterranean Lifestyle Plan",
                    gender_target="unisex",
                    description="Heart-healthy Mediterranean diet approach for long-term wellness.",
                    duration_weeks=4,
                    daily_calories=2000,
                    meal_plan=json.dumps({
                        "breakfast": "Greek yogurt with honey and nuts",
                        "lunch": "Mediterranean salad with olive oil",
                        "dinner": "Grilled fish with vegetables",
                        "snacks": "Olives, fruits, nuts"
                    }),
                    goals=json.dumps(["heart_health", "wellness", "longevity"]),
                    difficulty="beginner",
                    created_by_trainer_id=trainers[3].id if len(trainers) > 3 else None,
                    price=49.99
                ),
                DietPlan(
                    name="Intermittent Fasting Guide",
                    gender_target="unisex",
                    description="Structured intermittent fasting protocol with meal timing guidance.",
                    duration_weeks=4,
                    daily_calories=1800,
                    meal_plan=json.dumps({
                        "eating_window": "12:00 PM - 8:00 PM",
                        "meals": "Two main meals + one snack",
                        "breakfast": "Skipped (fasting period)",
                        "lunch": "Balanced meal with protein and vegetables",
                        "dinner": "Nutrient-dense meal",
                        "snacks": "Nuts, fruits during eating window"
                    }),
                    goals=json.dumps(["weight_loss", "metabolism", "health"]),
                    difficulty="intermediate",
                    created_by_trainer_id=trainers[4].id if len(trainers) > 4 else None,
                    price=3320.0  # ₹3320 (~$40)
                ),
            ]
            
            for plan in diet_plans:
                db.session.add(plan)
        
        db.session.commit()
        
        # Log final counts
        final_trainer_count = ProfessionalTrainer.query.count()
        final_diet_count = DietPlan.query.count()
        logger.info(f"✅ Database initialized: {final_trainer_count} trainers, {final_diet_count} diet plans")

# Initialize database on app startup
with app.app_context():
    try:
        init_db()
    except Exception as e:
        logger.error(f"Error initializing database: {e}")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)

