#  AI Fitness App – Inclusive, Intelligent, and Adaptive Training
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
- [Contact](#contact)

## Features

👤 User Profile - Manage your personal fitness profile  

![ss7](https://github.com/NISHANT-GUPTA1/Fitness_Health_Monitoring_AI/blob/289d9f6fcee79ae83ff904cc67a3f4a7c2a630c8/public/images/Screenshot%202025-07-06%20174307.png)


🌍 Internationalization - Multi-language support  

![ss8](https://github.com/NISHANT-GUPTA1/Fitness_Health_Monitoring_AI/blob/3c4e748ed0c7d61dd5b09ea0b823de45759ca728/public/images/image.png)

🏋 Workout Planner - Create personalized workout routines  

![ss1](https://github.com/user-attachments/assets/da0e9c58-91f3-4f1b-97b6-69ec4ff9416d)


📊 Fitness Tracker - Monitor your progress and fitness metrics  

![ss2](https://github.com/user-attachments/assets/e166a4fd-1d47-4da4-b742-0bd77d56b24b)

🏃 Daily Exercises - Track daily exercise activities 

![ss3](https://github.com/user-attachments/assets/3ce409fb-0782-452e-b868-4bc5a216d948)

🧘 Posture Checker - AI-powered posture analysis  

![ss4](https://github.com/NISHANT-GUPTA1/Fitness_Health_Monitoring_AI/blob/61ee8096585d7e0e437a656cb8fc4656fb4f00a2/public/images/Screenshot%202025-07-06%20174603.png)

🤝 Partner Finder - Find workout partners in your area  

![ss5](https://github.com/user-attachments/assets/c9e584f7-0699-47ff-88df-8cfda9a4e77f)

💪 Gym Machine Guide - Learn how to use gym equipment properly  

![ss6](https://github.com/user-attachments/assets/04bd67eb-d922-4181-a8d3-0f2aa4fd6bbb)


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
# Make scripts executable (first time only)
chmod +x start-*.sh

# Start both servers at once
./start-all.sh

# OR start them separately:
./start-backend.sh    # Terminal 1
./start-frontend.sh    # Terminal 2
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



