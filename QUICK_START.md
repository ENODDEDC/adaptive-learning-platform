# ⚡ Quick Start Guide

## 🚀 Fastest Way to Start

### **Option 1: One-Click Startup** (Recommended)
```bash
.\start-all.bat
```
This opens 2 windows automatically:
- Window 1: Next.js (http://localhost:3000)
- Window 2: ML Service (http://localhost:5000)

---

### **Option 2: Manual Startup** (2 Terminals)

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
cd ml-service
.\venv\Scripts\activate
python app.py
```

---

## ✅ Quick Check

**Both services running?**
- ✅ http://localhost:3000 → See login page
- ✅ http://localhost:5000 → See `{"status": "ML Service is running"}`

---

## 🎯 For Demo

**Start:**
```bash
.\start-all.bat
```

**Test:**
1. Login
2. Go to /home → See learning style widget
3. Take questionnaire
4. Go to /courses → Open PDF → Use learning modes

**Done!** 🎉

---

## 🛑 To Stop

Close both terminal windows or press `Ctrl+C` in each.

---

## 📝 Ports

- **3000** - Next.js App
- **5000** - ML Service  
- **27017** - MongoDB

---

**That's it! You're ready!** 🚀
