# 🐛 Debugging Guide - Verifier Dashboard

## Issue: 500 Internal Server Error on /verifyVC

### ✅ Fixes Applied

1. **Better Error Handling**
   - Added early return if IPFS retrieval fails
   - Added detailed error logging with stack traces
   - Added null checks for vcData.credentialSubject

2. **Enhanced Logging**
   - Log request parameters
   - Log documentHash extraction
   - Log each verification step
   - Log full error stack traces

3. **Frontend Improvements**
   - Better error message extraction
   - Display technical details in collapsible sections
   - Show raw error response for debugging

---

## 🔍 How to Debug

### **Step 1: Check Backend Logs**

When you click "Verify Credential", check your backend terminal for logs like:

```
🔍 Starting VC verification...
📋 Request params: { cid: 'QmXXXXXX...', documentHash: 'none' }
📥 Step 1: Retrieving VC from IPFS...
✅ VC retrieved from IPFS
📋 Step 2: Validating VC structure...
✅ VC structure is valid
📋 Extracted documentHash from VC: abc123...
📋 DocumentHash for blockchain verification: abc123...
⛓️ Step 3: Verifying on blockchain...
```

### **Step 2: Check for Specific Errors**

#### **Error: "Failed to retrieve VC from IPFS"**

**Cause:** Invalid CID or IPFS gateway issue

**Solution:**
- Verify the CID is correct (starts with "Qm" or "bafy")
- Check Pinata gateway is accessible
- Try the CID in browser: `https://gateway.pinata.cloud/ipfs/YOUR_CID`

#### **Error: "Cannot read properties of undefined"**

**Cause:** VC structure is missing expected fields

**Solution:**
- Check VC has `credentialSubject.documentHash`
- Verify VC structure matches expected format
- Look at backend logs for structure validation

#### **Error: "Blockchain verification failed"**

**Cause:** Contract not accessible or VC not on-chain

**Solution:**
- Check backend is connected to Sepolia
- Verify contract address is correct
- Ensure VC was actually stored on blockchain

---

## 🧪 Testing Steps

### **Test 1: Valid VC from Your System**

1. **Issue a new VC:**
   ```
   http://localhost:3000/vc-form
   ```

2. **Note the IPFS CID** from the response

3. **Verify it:**
   ```
   http://localhost:3000/verifier
   ```
   - Enter the CID
   - Enter the public key (from VC response)
   - Click "Verify Credential"

4. **Expected Result:**
   ```
   ✅ Structure Valid
   ✅ IPFS Retrieved
   ✅ BBS+ Signature Valid
   ✅ Blockchain Record
   ✅ Not Revoked
   ✅ Hash Match
   ```

### **Test 2: Valid CID Without Public Key**

1. **Enter only CID** (no public key)

2. **Expected Result:**
   ```
   ✅ Structure Valid
   ✅ IPFS Retrieved
   ℹ️ BBS+ verification skipped (no public key)
   ✅ Blockchain Record
   ✅ Not Revoked
   ✅ Hash Match
   ```

### **Test 3: Invalid CID**

1. **Enter:** `QmInvalidCID123`

2. **Expected Result:**
   ```
   ❌ Failed to retrieve VC from IPFS
   Error: Invalid CID or not found
   ```

---

## 🔧 Common Issues & Solutions

### **Issue 1: CORS Error**

**Symptom:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
Backend already has CORS enabled. If issue persists:
```javascript
// In server.js, ensure:
app.use(cors());
```

### **Issue 2: Port Already in Use**

**Symptom:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Kill existing Node processes
taskkill /F /IM node.exe

# Then restart
npm start
```

### **Issue 3: Camera Not Working**

**Symptom:**
QR scanner shows black screen or permission denied

**Solution:**
- Grant camera permissions in browser
- Use HTTPS (camera requires secure context)
- Try different browser (Chrome recommended)
- Check camera is not used by another app

### **Issue 4: QR Code Not Scanning**

**Symptom:**
Scanner active but doesn't detect QR code

**Solution:**
- Ensure good lighting
- Hold QR code steady
- Adjust distance (try 6-12 inches)
- Ensure QR code is clear and not blurry
- Try manual CID entry instead

---

## 📊 Backend Verification Flow

```
POST /verifyVC
    ↓
Validate Input (CID or documentHash)
    ↓
Step 1: Retrieve from IPFS
    ├─ Success → Continue
    └─ Fail → Return 400 error
    ↓
Step 2: Validate Structure
    ├─ Check W3C VC format
    ├─ Verify BBS+ signature (if publicKey provided)
    └─ Extract documentHash
    ↓
Step 3: Blockchain Verification
    ├─ Query smart contract
    ├─ Check revocation status
    └─ Verify hash match
    ↓
Return Results
    ├─ success: true/false
    ├─ verified: true/false
    ├─ bbsProofValid: true/false
    ├─ Individual check results
    └─ Full VC data
```

---

## 🔍 Debugging Checklist

Before reporting an issue, check:

- [ ] Backend server is running on port 5000
- [ ] Frontend is running on port 3000
- [ ] No CORS errors in browser console
- [ ] Backend logs show the verification request
- [ ] CID is valid and accessible
- [ ] Blockchain connection is working
- [ ] Contract address is correct in .env
- [ ] Pinata API keys are valid

---

## 📝 Getting More Information

### **Enable Detailed Logging**

Backend already logs detailed information. To see more:

1. **Check backend terminal** for full logs
2. **Check browser console** (F12) for frontend errors
3. **Click "Show technical details"** in error message
4. **Click "Show raw error"** to see full error response

### **Example Error Output**

```json
{
  "success": false,
  "message": "Failed to retrieve VC from IPFS",
  "error": "Error: Request failed with status code 404",
  "stack": "Error: Request failed...\n    at createError..."
}
```

---

## 🚀 Next Steps

If error persists after fixes:

1. **Restart both servers:**
   ```bash
   # Kill all Node processes
   taskkill /F /IM node.exe
   
   # Start backend
   cd "c:\Users\Parthiv A M\Desktop\did app\mydid\src\backend"
   npm start
   
   # Start frontend (new terminal)
   cd "c:\Users\Parthiv A M\Desktop\did app\mydid"
   npm start
   ```

2. **Test with a fresh VC:**
   - Issue a new VC
   - Copy the CID from response
   - Try verifying immediately

3. **Check the actual error:**
   - Look at backend terminal logs
   - Check browser console
   - Click "Show technical details" in UI

4. **Share the error:**
   - Copy backend error logs
   - Copy browser console errors
   - Note the exact CID you're testing with

---

## ✅ Expected Behavior

### **Successful Verification:**

**Backend Logs:**
```
🔍 Starting VC verification...
📋 Request params: { cid: 'QmXXX...', documentHash: 'none' }
📥 Step 1: Retrieving VC from IPFS...
✅ VC retrieved from IPFS
📋 Step 2: Validating VC structure...
✅ VC structure is valid
🔐 Verifying BBS+ signature...
✅ BBS+ signature verification: VALID
📋 Extracted documentHash from VC: abc123...
⛓️ Step 3: Verifying on blockchain...
✅ Blockchain verification complete
✅ Verification PASSED
```

**Frontend Display:**
- Green "✅ Credential Verified" banner
- All 6 checks showing ✅
- Credential details displayed
- Blockchain record shown

---

## 🎯 Quick Fix Summary

The fixes applied should resolve the 500 error by:

1. ✅ Adding null checks for VC structure
2. ✅ Better error handling for IPFS failures
3. ✅ Detailed logging at each step
4. ✅ Early returns for failures
5. ✅ Improved error messages in UI

**Try verifying again and check the backend logs for specific error details!**
