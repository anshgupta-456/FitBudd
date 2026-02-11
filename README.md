#  FitBudd – Inclusive, Intelligent, and Adaptive Training
This AI-powered fitness app is designed to break common barriers in digital fitness. It supports multiple languages, making fitness accessible to users from diverse backgrounds. The app offers personalized workout plans based on user goals, including home workouts, yoga, and cultural fitness styles. Real-time motion feedback via the phone camera ensures correct form and reduces injury risk. An integrated AI chatbot provides 24/7 support, personalized tips, and day-specific guidance, creating a truly smart and inclusive fitness companion.



## 📑 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Backend Setup](#backend-setup)
- [Project Structure](#project-structure)
- [Components](#components)
- [Contributing](#contributing)
- [License](#license)


## Features

👤 User Profile - Manage your personal fitness profile  




🌍 Internationalization -- Multi-language support  



🏋 Workout Planner - Create personalized workout routines  



📊 Fitness Tracker - Monitor your progress and fitness metrics  


🏃 Daily Exercises - Track daily exercise activities 


🧘 Posture Checker - AI-powered posture analysis  


🤝 Partner Finder - Find workout partners in your area . 


💪 Gym Machine Guide - Learn how to use gym equipment properly  



## Tech Stack

- *Frontend*: Next.js 14, React, TypeScript
- *Styling*: Tailwind CSS
- *UI Components*: Custom component library with shadcn/ui
- *Backend*: Flask (Python) for AI processing
- *Database*: SQL database setup included

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm/pnpm
- **Python** 3.8+ (for AI backend)
- **pip** (Python package manager)

### Quick Start

#### Option 1: Using Helper Scripts (Easiest)

**Windows (PowerShell):**
```powershell
# Start both servers at once
.\start-all.ps1

# OR start them separately:
.\start-backend.ps1    # Terminal 1
.\start-frontend.ps1    # Terminal 2
```

**Mac/Linux:**
```bash
## Terminal 1 - Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py

# Terminal 2 - Frontend
npm install
npm run dev
```

#### Option 2: Manual Setup

**Backend (Terminal 1):**
```bash
cd backend
python -m venv venv
# Windows: .\venv\Scripts\Activate.ps1
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python run.py
```

**Frontend (Terminal 2):**
```bash
npm install
npm run dev
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

📖 **For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)**



## Project Structure

```bash
├── app/                  # Next.js app directory
│   ├── components/       # React components
│   ├── contexts/         # React contexts
│   ├── i18n/             # Internationalization configs
│   └── globals.css       # Global styles
├── components/           # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── public/               # Static assets
│   └── images/           # Gym equipment images
├── scripts/              # Backend and database scripts
└── styles/               # Additional styling
```


## Components

- *DailyExercises*: Track and log daily workouts
- *FitnessTracker*: Monitor fitness metrics and progress
- *GymMachineGuide*: Visual guide for gym equipment
- *PostureChecker*: AI-powered posture analysis
- *PartnerFinder*: Connect with workout partners
- *UserProfile*: Manage user information and preferences
- *WorkoutPlanner*: Create and schedule workout routines



## License

This project is licensed under the MIT License - see the LICENSE file for details.



