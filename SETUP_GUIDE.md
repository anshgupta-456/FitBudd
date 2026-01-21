# FitSanskriti - Setup & Running Guide

This guide will help you set up and run both the **Frontend (Next.js)** and **Backend (Flask)** of the FitSanskriti fitness application.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm/pnpm
- **Python** 3.8+ 
- **pip** (Python package manager)

## 🚀 Quick Start

### Option 1: Run Both Services (Recommended)

#### Windows (PowerShell)
```powershell
# Terminal 1 - Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py

# Terminal 2 - Frontend
cd ..
npm install
npm run dev
```

#### Mac/Linux
```bash
# Terminal 1 - Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py

# Terminal 2 - Frontend
cd ..
npm install
npm run dev
```

### Option 2: Using Helper Scripts

We've created helper scripts to make this easier (see below).

---

## 📦 Step-by-Step Setup

### Step 1: Backend Setup (Flask)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   # Windows
   python -m venv venv
   
   # Mac/Linux
   python3 -m venv venv
   ```

3. **Activate virtual environment:**
   ```bash
   # Windows (PowerShell)
   .\venv\Scripts\Activate.ps1
   
   # Windows (CMD)
   venv\Scripts\activate.bat
   
   # Mac/Linux
   source venv/bin/activate
   ```

4. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the backend server:**
   ```bash
   python run.py
   ```
   
   The backend will start on **http://localhost:5001**
   
   You should see:
   ```
   Starting FitSanskriti Backend Server on port 5001
   API Documentation available at: http://localhost:5001/
   ```

### Step 2: Frontend Setup (Next.js)

1. **Navigate to project root** (if you're in backend, go back):
   ```bash
   cd ..
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   # OR if you prefer pnpm
   pnpm install
   ```

3. **Create environment file** (optional, defaults to localhost:5001):
   ```bash
   # Create .env.local file
   echo "NEXT_PUBLIC_API_BASE=http://localhost:5001" > .env.local
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   # OR
   pnpm dev
   ```
   
   The frontend will start on **http://localhost:3000**

---

## 🌐 Accessing the Application

Once both servers are running:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5001
- **API Documentation:** http://localhost:5001/

---

## 🔧 Configuration

### Environment Variables

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE=http://localhost:5001
```

#### Backend
The backend uses environment variables for configuration:
- `PORT` - Backend port (default: 5001)
- `SECRET_KEY` - JWT secret key (default: 'dev-secret-key')

You can set these in your shell:
```bash
# Windows PowerShell
$env:PORT=5001
$env:SECRET_KEY="your-secret-key"

# Mac/Linux
export PORT=5001
export SECRET_KEY="your-secret-key"
```

---

## 🗄️ Database

The backend uses SQLite database (`fitness_app.db`) which is automatically created in the `backend/` directory when you first run the server.

The database is initialized with sample data including:
- Sample gyms
- Sample exercises
- Sample studio classes
- Sample sports venues
- Sample trainers
- Sample diet plans

---

## 🐛 Troubleshooting

### Backend Issues

**Problem: Port 5001 already in use**
```bash
# Change the port
$env:PORT=5002  # Windows PowerShell
export PORT=5002  # Mac/Linux
python run.py
```

**Problem: Module not found errors**
```bash
# Make sure virtual environment is activated
# Reinstall dependencies
pip install -r requirements.txt
```

**Problem: Database errors**
```bash
# Delete the database file and restart
rm backend/fitness_app.db  # Mac/Linux
del backend\fitness_app.db  # Windows
python run.py  # Will recreate database
```

### Frontend Issues

**Problem: Port 3000 already in use**
```bash
# Next.js will automatically use the next available port
# Or specify a port:
npm run dev -- -p 3001
```

**Problem: Cannot connect to backend**
- Ensure backend is running on port 5001
- Check `NEXT_PUBLIC_API_BASE` in `.env.local`
- Check CORS settings in backend (should be enabled)

**Problem: npm install fails**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Development Workflow

1. **Start Backend First:**
   ```bash
   cd backend
   source venv/bin/activate  # or .\venv\Scripts\Activate.ps1 on Windows
   python run.py
   ```

2. **Then Start Frontend:**
   ```bash
   # In a new terminal
   npm run dev
   ```

3. **Make Changes:**
   - Frontend: Changes hot-reload automatically
   - Backend: Restart the Flask server to see changes

---

## 🚢 Production Deployment

### Backend Deployment Options:
- **Heroku:** Use `Procfile` with `web: python run.py`
- **Railway:** Auto-deploys from GitHub
- **DigitalOcean App Platform:** Configure build commands
- **PythonAnywhere:** Upload and configure WSGI

### Frontend Deployment Options:
- **Vercel:** Best for Next.js (recommended)
- **Netlify:** Easy deployment
- **AWS Amplify:** Full-stack deployment

See `DEPLOYMENT.md` for detailed deployment instructions.

---

## 📚 API Endpoints

The backend provides the following main endpoints:

- `GET /` - API documentation
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `GET /api/gyms` - List gyms
- `GET /api/partners/search` - Search workout partners
- `GET /api/partners/recommendations` - Get partner recommendations
- `POST /api/partners/connect` - Connect with a partner
- `GET /api/sports/classes` - Get studio classes
- `GET /api/sports/venues` - Get sports venues
- `GET /api/trainers` - Get professional trainers
- `GET /api/diet-plans` - Get diet plans
- And more...

See http://localhost:5001/ for full API documentation.

---

## ✅ Verification Checklist

- [ ] Python 3.8+ installed
- [ ] Node.js 18+ installed
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Backend running on http://localhost:5001
- [ ] Frontend running on http://localhost:3000
- [ ] Can access API documentation at http://localhost:5001/
- [ ] Can access frontend at http://localhost:3000

---

## 🆘 Need Help?

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Ensure both servers are running
4. Check console/terminal for error messages
5. Verify environment variables are set correctly

---

## 📄 License

This project is licensed under the MIT License.
