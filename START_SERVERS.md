# 🚀 How to Start the Servers

## ❌ **Current Issue:**
```
POST http://localhost:5000/verifyVC net::ERR_CONNECTION_REFUSED
```

**Cause:** Backend server is not running on port 5000.

---

## ✅ **Solution: Start Both Servers**

### **Step 1: Start Backend Server**

Open a **NEW terminal** and run:

```bash
cd "c:\Users\Parthiv A M\Desktop\did app\mydid\src\backend"
node server.js
```

**Expected Output:**
```
============================================================
🚀 Digital Identity Management Server
============================================================
📍 Server URL: http://localhost:5000
🔐 BBS+ Signatures: Enabled (BLS12-381)
📦 IPFS: Configured
⛓️  Blockchain: Connected (Sepolia)
============================================================
```

**If you see this, the backend is running! ✅**

---

### **Step 2: Start Frontend (React)**

Open **ANOTHER terminal** and run:

```bash
cd "c:\Users\Parthiv A M\Desktop\did app\mydid"
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view mydid in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

---

## 🔍 **Verify Both Are Running:**

### **Backend Check:**
Open browser and go to: `http://localhost:5000/health`

**Expected:** Some response (even an error is OK, means server is running)

### **Frontend Check:**
Open browser and go to: `http://localhost:3000`

**Expected:** Your app loads

---

## 🐛 **Troubleshooting:**

### **Issue 1: Backend won't start**

**Error:** `Cannot find module '@digitalbazaar/bbs-signatures'`

**Fix:**
```bash
cd "c:\Users\Parthiv A M\Desktop\did app\mydid\src\backend"
npm install
```

---

### **Issue 2: Port 5000 already in use**

**Error:** `EADDRINUSE: address already in use :::5000`

**Fix Option A - Kill the process:**
```bash
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill it (replace PID with the number from above)
taskkill /PID <PID> /F
```

**Fix Option B - Use different port:**
1. Edit `src/backend/.env` and add:
   ```
   PORT=5001
   ```
2. Update frontend API calls to use `http://localhost:5001` instead of `5000`

---

### **Issue 3: Frontend can't connect to backend**

**Error:** `ERR_CONNECTION_REFUSED`

**Checklist:**
- [ ] Is backend running? (Check terminal for "Server URL: http://localhost:5000")
- [ ] Is it on port 5000? (Check backend terminal output)
- [ ] Can you access `http://localhost:5000/health` in browser?
- [ ] Is CORS enabled? (Should be by default in server.js)

---

### **Issue 4: Missing .env file**

**Error:** Various errors about missing configuration

**Fix:**
1. Copy `.env.example` to `.env`:
   ```bash
   cd "c:\Users\Parthiv A M\Desktop\did app\mydid\src\backend"
   copy .env.example .env
   ```

2. Edit `.env` and add your keys:
   ```
   PINATA_API_KEY=your_key_here
   PINATA_SECRET_KEY=your_secret_here
   PRIVATE_KEY=your_wallet_private_key
   SEPOLIA_RPC_URL=your_rpc_url
   ```

---

## 📝 **Quick Start Script (Windows)**

Create a file `start-all.bat` in the project root:

```batch
@echo off
echo Starting Backend Server...
start cmd /k "cd src\backend && node server.js"

timeout /t 3

echo Starting Frontend...
start cmd /k "npm start"

echo.
echo ✅ Both servers starting...
echo ✅ Backend: http://localhost:5000
echo ✅ Frontend: http://localhost:3000
```

Then just double-click `start-all.bat` to start both servers!

---

## ✅ **Once Both Are Running:**

1. Go to `http://localhost:3000`
2. Login as Verifier
3. Try verifying a credential
4. Should work now! ✨

---

## 🔄 **To Stop Servers:**

- Press `Ctrl + C` in each terminal window
- Or close the terminal windows

---

## 📊 **Server Status Check:**

| Server | URL | Status Check |
|--------|-----|--------------|
| Backend | http://localhost:5000 | Visit `/health` endpoint |
| Frontend | http://localhost:3000 | App loads in browser |

---

**Need help?** Check the terminal output for error messages!
