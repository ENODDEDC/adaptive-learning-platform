# 🚀 How to Start Your Complete System

## You Need to Run 2 Services

Your system has **2 parts** that need to run simultaneously:

1. **Next.js Frontend/Backend** (Node.js)
2. **ML Service** (Python Flask)

---

## 🎯 Quick Start (2 Terminals)

### **Terminal 1: Next.js App**
```bash
npm run dev
```
- Runs on: http://localhost:3000
- This is your main application

### **Terminal 2: ML Service**
```bash
cd ml-service
.\venv\Scripts\activate
python app.py
```
- Runs on: http://localhost:5000
- This is your ML classification service

---

## 📋 Detailed Step-by-Step

### **Step 1: Start MongoDB**
Make sure MongoDB is running (if not already):
```bash
# Check if MongoDB is running
# It should already be running as a service
```

### **Step 2: Open Terminal 1 - Next.js**
```bash
# In project root
npm run dev
```

**Expected output:**
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2.5s
```

### **Step 3: Open Terminal 2 - ML Service**
```bash
# Navigate to ml-service folder
cd ml-service

# Activate virtual environment
.\venv\Scripts\activate

# Start Flask server
python app.py
```

**Expected output:**
```
📦 Loading models...
✅ Scaler loaded
✅ Model loaded: active_reflective
✅ Model loaded: sensing_intuitive
✅ Model loaded: visual_verbal
✅ Model loaded: sequential_global
✅ All models loaded successfully!

🚀 ML Service running on http://localhost:5000
 * Running on http://127.0.0.1:5000
```

---

## ✅ Verification

### **Check if both services are running:**

**1. Next.js (Terminal 1):**
- Open browser: http://localhost:3000
- Should see your login page

**2. ML Service (Terminal 2):**
- Open browser: http://localhost:5000
- Should see: `{"status": "ML Service is running"}`

**3. Test ML endpoint:**
```bash
# In a third terminal (optional)
curl http://localhost:5000/classify -X POST -H "Content-Type: application/json" -d "{\"features\": [0.5, 10, 5, 0.5, 5, 2, 0.6, 15, 10, 0.4, 20, 8, 0.7, 30, 15, 0.3, 10, 5, 0.6, 25, 20, 0.4, 10, 15]}"
```

Should return learning style predictions!

---

## 🎯 For Capstone Demo

### **Before Demo Day:**

**1. Test Everything:**
```bash
# Terminal 1
npm run dev

# Terminal 2
cd ml-service
.\venv\Scripts\activate
python app.py
```

**2. Keep Both Running:**
- Don't close either terminal
- Both services must be active

**3. Test the Flow:**
- Login → Home page → Take questionnaire → View profile
- Go to courses → Open PDF → Use 8 learning modes
- Check if tracking works (console logs)

---

## 🔧 Troubleshooting

### **Problem: ML Service won't start**

**Solution:**
```bash
cd ml-service
.\venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### **Problem: "Models not found"**

**Solution:**
```bash
# Check if models exist
dir ml-service\models

# Should see:
# - scaler_improved.pkl
# - active_reflective_improved.pkl
# - sensing_intuitive_improved.pkl
# - visual_verbal_improved.pkl
# - sequential_global_improved.pkl

# If missing, train again:
python training\train_models_improved.py
```

### **Problem: Port 3000 or 5000 already in use**

**Solution:**
```bash
# For port 3000 (Next.js)
# Kill the process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# For port 5000 (ML Service)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### **Problem: MongoDB not connected**

**Solution:**
```bash
# Check MongoDB status
# Start MongoDB service if needed
net start MongoDB
```

---

## 📝 Quick Reference

### **Services Overview:**

| Service | Port | Command | Purpose |
|---------|------|---------|---------|
| **Next.js** | 3000 | `npm run dev` | Main application |
| **ML Service** | 5000 | `python app.py` | ML classification |
| **MongoDB** | 27017 | (service) | Database |

### **URLs:**

- **Main App:** http://localhost:3000
- **ML Service:** http://localhost:5000
- **ML Health:** http://localhost:5000/health
- **ML Classify:** http://localhost:5000/classify (POST)

---

## 🎬 Demo Day Checklist

**30 minutes before:**
- [ ] Start MongoDB (if not running)
- [ ] Start Next.js: `npm run dev`
- [ ] Start ML Service: `python app.py`
- [ ] Test login
- [ ] Test questionnaire
- [ ] Test learning modes
- [ ] Check console for tracking logs

**During demo:**
- [ ] Keep both terminals visible (optional)
- [ ] Show both services running
- [ ] Demonstrate the complete flow
- [ ] Show ML classification working

---

## 💡 Pro Tips

**1. Use VS Code Split Terminal:**
- Split your terminal in VS Code
- Left side: `npm run dev`
- Right side: `python app.py`
- See both running simultaneously!

**2. Create Startup Script:**
I'll create a batch file for you to start both services easily!

**3. Keep Logs Visible:**
- Watch Terminal 1 for Next.js requests
- Watch Terminal 2 for ML classification calls
- Shows system is working!

---

## 🚀 One-Command Startup (Optional)

Create `start-all.bat`:
```batch
@echo off
echo Starting Complete System...
echo.

echo Starting Next.js...
start cmd /k "npm run dev"

timeout /t 5

echo Starting ML Service...
start cmd /k "cd ml-service && .\venv\Scripts\activate && python app.py"

echo.
echo ✅ Both services starting!
echo Next.js: http://localhost:3000
echo ML Service: http://localhost:5000
```

Then just run:
```bash
.\start-all.bat
```

---

## ✅ Summary

**To run your complete system:**

1. **Terminal 1:** `npm run dev` (Next.js)
2. **Terminal 2:** `cd ml-service && .\venv\Scripts\activate && python app.py` (ML)
3. **Browser:** http://localhost:3000

**Both must be running for full functionality!**

**Your system is ready for demo!** 🎉🚀
