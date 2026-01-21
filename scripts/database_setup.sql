-- Create database for fitness app
CREATE DATABASE IF NOT EXISTS fitness_app;
USE fitness_app;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    age INT,
    gender ENUM('male', 'female', 'other'),
    height DECIMAL(5,2), -- in cm
    weight DECIMAL(5,2), -- in kg
    fitness_level ENUM('beginner', 'intermediate', 'advanced'),
    goals TEXT,
    location VARCHAR(100),
    timezone VARCHAR(50),
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User preferences table
CREATE TABLE user_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    workout_schedule JSON, -- preferred workout times
    exercise_types JSON, -- preferred exercise types
    intensity_preference ENUM('low', 'medium', 'high'),
    equipment_access JSON, -- available equipment
    injuries_limitations TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Workouts table
CREATE TABLE workouts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    name VARCHAR(100) NOT NULL,
    type ENUM('cardio', 'strength', 'flexibility', 'sports', 'mixed'),
    duration INT, -- in minutes
    calories_burned INT,
    difficulty ENUM('beginner', 'intermediate', 'advanced'),
    exercises JSON, -- exercise details
    notes TEXT,
    date_completed DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Exercises table
CREATE TABLE exercises (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    category ENUM('cardio', 'strength', 'flexibility', 'sports'),
    muscle_groups JSON,
    equipment_needed JSON,
    difficulty ENUM('beginner', 'intermediate', 'advanced'),
    instructions TEXT,
    video_url VARCHAR(255),
    image_url VARCHAR(255),
    calories_per_minute DECIMAL(4,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User progress tracking
CREATE TABLE user_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    date DATE,
    weight DECIMAL(5,2),
    body_fat_percentage DECIMAL(4,2),
    muscle_mass DECIMAL(5,2),
    measurements JSON, -- chest, waist, hips, etc.
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, date)
);

-- Daily activity tracking
CREATE TABLE daily_activity (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    date DATE,
    steps INT DEFAULT 0,
    calories_burned INT DEFAULT 0,
    active_minutes INT DEFAULT 0,
    sleep_hours DECIMAL(3,1),
    water_intake DECIMAL(4,1), -- in liters
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, date)
);

-- Fitness partners and connections
CREATE TABLE fitness_partners (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    partner_id INT,
    status ENUM('pending', 'accepted', 'declined', 'blocked') DEFAULT 'pending',
    connection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_connection (user_id, partner_id)
);

-- Partner matching preferences
CREATE TABLE partner_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    age_range_min INT,
    age_range_max INT,
    preferred_gender ENUM('male', 'female', 'any') DEFAULT 'any',
    fitness_level_preference JSON,
    location_radius INT DEFAULT 50, -- in km
    workout_schedule_preference JSON,
    goals_preference JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages between partners
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT,
    receiver_id INT,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Posture analysis results
CREATE TABLE posture_analysis (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    image_url VARCHAR(255),
    analysis_results JSON, -- AI analysis results
    score INT, -- overall posture score 0-100
    issues_detected JSON,
    recommendations JSON,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User achievements
CREATE TABLE achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    criteria JSON, -- achievement criteria
    badge_icon VARCHAR(255),
    points INT DEFAULT 0
);

-- User earned achievements
CREATE TABLE user_achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    achievement_id INT,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id)
);

-- Workout plans
CREATE TABLE workout_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration_weeks INT,
    difficulty ENUM('beginner', 'intermediate', 'advanced'),
    goals JSON,
    plan_data JSON, -- weekly workout structure
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample exercises
INSERT INTO exercises (name, category, muscle_groups, equipment_needed, difficulty, instructions, calories_per_minute) VALUES
('Push-ups', 'strength', '["chest", "shoulders", "triceps"]', '["none"]', 'beginner', 'Start in plank position, lower body to ground, push back up', 8.0),
('Squats', 'strength', '["quadriceps", "glutes", "hamstrings"]', '["none"]', 'beginner', 'Stand with feet shoulder-width apart, lower hips back and down, return to standing', 7.5),
('Plank', 'strength', '["core", "shoulders"]', '["none"]', 'beginner', 'Hold body in straight line from head to heels', 5.0),
('Burpees', 'cardio', '["full body"]', '["none"]', 'intermediate', 'Squat down, jump back to plank, do push-up, jump feet forward, jump up', 12.0),
('Mountain Climbers', 'cardio', '["core", "shoulders", "legs"]', '["none"]', 'intermediate', 'Start in plank, alternate bringing knees to chest rapidly', 10.0),
('Jumping Jacks', 'cardio', '["full body"]', '["none"]', 'beginner', 'Jump feet apart while raising arms overhead, return to start', 8.5),
('Lunges', 'strength', '["quadriceps", "glutes", "hamstrings"]', '["none"]', 'beginner', 'Step forward, lower hips until both knees at 90 degrees, return to start', 6.0),
('Deadlifts', 'strength', '["hamstrings", "glutes", "back"]', '["barbell", "dumbbells"]', 'intermediate', 'Lift weight from ground by extending hips and knees', 8.0),
('Bench Press', 'strength', '["chest", "shoulders", "triceps"]', '["barbell", "bench"]', 'intermediate', 'Lie on bench, lower bar to chest, press up', 7.0),
('Running', 'cardio', '["legs", "cardiovascular"]', '["none"]', 'beginner', 'Maintain steady pace, focus on breathing and form', 12.0);

-- Insert sample achievements
INSERT INTO achievements (name, description, criteria, points) VALUES
('First Workout', 'Complete your first workout', '{"workouts_completed": 1}', 10),
('Week Warrior', 'Complete 5 workouts in a week', '{"workouts_per_week": 5}', 25),
('Step Master', 'Walk 10,000 steps in a day', '{"daily_steps": 10000}', 15),
('Consistency King', 'Work out for 30 days straight', '{"consecutive_workout_days": 30}', 50),
('Calorie Crusher', 'Burn 3000 calories in a day', '{"daily_calories_burned": 3000}', 30),
('Strength Builder', 'Complete 50 strength training workouts', '{"strength_workouts": 50}', 40),
('Cardio Champion', 'Complete 100 cardio sessions', '{"cardio_workouts": 100}', 60),
('Social Butterfly', 'Connect with 10 fitness partners', '{"partner_connections": 10}', 20);
