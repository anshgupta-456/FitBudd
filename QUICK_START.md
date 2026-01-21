# 🚀 Quick Start Guide

## One-Command Start (Easiest)

### Windows
```powershell
.\start-all.ps1
```

### Mac/Linux
```bash
chmod +x start-all.sh && ./start-all.sh
```

This will start both backend and frontend automatically!

---

## Manual Start (Two Terminals)

### Terminal 1 - Backend
```bash
cd backend
python -m venv venv
# Windows PowerShell: .\venv\Scripts\Activate.ps1
# Windows CMD: venv\Scripts\activate.bat
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python run.py
```

✅ Backend running on **http://localhost:5001**

### Terminal 2 - Frontend
```bash
npm install
npm run dev
```

✅ Frontend running on **http://localhost:3000**

---

## Verify It's Working

1. Open http://localhost:3000 in your browser
2. You should see the FitSanskriti homepage
3. Check http://localhost:5001/ for API documentation

---

## Troubleshooting

**Backend won't start?**
- Make sure Python 3.8+ is installed: `python --version`
- Activate virtual environment before running
- Install dependencies: `pip install -r requirements.txt`

**Frontend won't start?**
- Make sure Node.js 18+ is installed: `node --version`
- Install dependencies: `npm install`
- Check if port 3000 is available

**Can't connect to backend?**
- Make sure backend is running on port 5001
- Check that backend shows: "Starting FitSanskriti Backend Server on port 5001"

---

For detailed instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)
