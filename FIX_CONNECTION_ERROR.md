# 🔧 Fix: ERR_CONNECTION_REFUSED Error

## ❌ **The Problem:**

```
POST http://localhost:5000/verifyVC net::ERR_CONNECTION_REFUSED
```

**What this means:** The frontend (React app) is trying to connect to the backend server on port 5000, but the backend is not running.

---

## ✅ **The Solution:**

### **Quick Fix: Start the Backend Server**

**Option 1: Use the Batch File (Easiest)**

1. Double-click `start-all.bat` in the project root
2. Two terminal windows will open:
   - One for backend (port 5000)
   - One for frontend (port 3000)
3. Wait ~10 seconds for both to start
4. Go to `http://localhost:3000`

---

**Option 2: Manual Start (More Control)**

**Terminal 1 - Backend:**
```bash
cd "c:\Users\Parthiv A M\Desktop\did app\mydid\src\backend"
node server.js
```

Wait for this output:
```
============================================================
🚀 Digital Identity Management Server
============================================================
📍 Server URL: http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd "c:\Users\Parthiv A M\Desktop\did app\mydid"
npm start
```

Wait for:
```
Compiled successfully!
Local: http://localhost:3000
```

---

## 🧪 **Test It:**

### **1. Check Backend is Running:**

Open browser: `http://localhost:5000/health`

**Expected:** Any response (even error page is OK - means server is running)

### **2. Check Frontend is Running:**

Open browser: `http://localhost:3000`

**Expected:** Your app loads

### **3. Test Verification:**

1. Login as Verifier
2. Upload a QR code or enter a CID
3. Click "Verify Credential"
4. Should work now! ✅

---

## 🐛 **Still Not Working?**

### **Check 1: Is Backend Actually Running?**

Look at the backend terminal. You should see:
```
🚀 Digital Identity Management Server
📍 Server URL: http://localhost:5000
```

If you don't see this, the backend didn't start properly.

**Common causes:**
- Missing dependencies: Run `npm install` in `src/backend`
- Missing .env file: Copy `.env.example` to `.env`
- Port 5000 in use: Kill the process or use different port

---

### **Check 2: Is Port 5000 Blocked?**

Try accessing: `http://localhost:5000` in your browser

**If it doesn't load:** Port 5000 is blocked or backend isn't running

**If it loads (even with error):** Backend is running, check frontend API calls

---

### **Check 3: CORS Issues?**

Backend should have CORS enabled:
```javascript
app.use(cors({ origin: "*" }));
```

This is already in `server.js` line 25, so should be fine.

---

### **Check 4: Firewall?**

Windows Firewall might be blocking port 5000.

**Fix:**
1. Search "Windows Defender Firewall"
2. Click "Allow an app through firewall"
3. Find "Node.js" and make sure both Private and Public are checked

---

## 📊 **Expected Terminal Output:**

### **Backend Terminal:**
```
============================================================
🚀 Digital Identity Management Server
============================================================
📍 Server URL: http://localhost:5000
🔐 BBS+ Signatures: Enabled (BLS12-381)
📦 IPFS: Configured
⛓️  Blockchain: Connected (Sepolia)
============================================================

✅ BBS+ keys loaded successfully
✅ Pinata connection successful
✅ Blockchain connected: 0x1234...
```

### **Frontend Terminal:**
```
Compiled successfully!

You can now view mydid in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled successfully
```

---

## 🎯 **Summary:**

**Problem:** Backend not running → Frontend can't connect → ERR_CONNECTION_REFUSED

**Solution:** Start backend server on port 5000

**How:** 
1. Use `start-all.bat` (easiest)
2. Or manually start backend with `node server.js` in `src/backend`

**Verify:** 
- Backend: `http://localhost:5000/health` should respond
- Frontend: `http://localhost:3000` should load app
- Verification: Should work without connection errors

---

## ✅ **After Fix:**

Once both servers are running:

1. ✅ No more "ERR_CONNECTION_REFUSED"
2. ✅ Verification works
3. ✅ QR upload works
4. ✅ History saves
5. ✅ All features functional

---

**Still having issues?** Check the terminal output for specific error messages and share them!
