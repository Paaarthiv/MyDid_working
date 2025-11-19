# 🚀 DID Exchange System - Quick Start Guide

## 📋 Prerequisites
- Backend server running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- MetaMask installed and configured

---

## 🎯 Step-by-Step Testing

### **Step 1: Holder Shares DID**

1. **Login as Holder:**
   - Go to `http://localhost:3000`
   - Click "Holder Portal"
   - Connect MetaMask
   - You'll be redirected to Holder Dashboard

2. **Share Your DID:**
   - Scroll down to see the green "Share Your DID" card
   - (Optional) Enter your name in the input field
   - Click "Share DID with Issuers"
   - Wait for success message: "✅ DID Shared Successfully!"

3. **Verify:**
   - Status should show "Shared" badge
   - Your DID is now visible to issuers

---

### **Step 2: Issuer Issues VC to Holder**

1. **Logout and Login as Issuer:**
   - Click "Back to Home" (confirm logout)
   - Select "Issuer Portal"
   - Connect MetaMask (can use same or different wallet)

2. **Navigate to Issue VC:**
   - Click "Issue New Credential" from dashboard
   - You'll see the VC issuance form

3. **Select Holder:**
   - At the top of the form, you'll see "🎯 Select Holder (Recipient)"
   - Click the dropdown
   - You should see the holder you registered (e.g., "John Doe (0x123...abc)")
   - Select the holder

4. **Fill Credential Details:**
   - Name: Enter student name
   - Roll Number: Enter roll number
   - Date of Birth: Select date
   - Department: Enter department
   - Photo: Upload a photo

5. **Submit:**
   - Click "Issue VC to Selected Holder"
   - Wait for processing (IPFS upload, BBS+ signing, blockchain anchoring)
   - You'll be redirected to the VC view page

6. **Verify:**
   - Check that the VC shows the holder's DID in the credential subject
   - Note the IPFS CID (QmXXX...)

---

### **Step 3: Verify VC-Holder Mapping**

1. **Check Backend Logs:**
   - Look for: `✅ VC linked to holder: did:ethr:0x... -> QmXXX...`

2. **Check Data Files:**
   - Navigate to `src/backend/data/`
   - Open `registeredHolders.json` - should contain holder info
   - Open `vcHolderMap.json` - should map DID to VC CID

3. **Test API Directly (Optional):**
   ```bash
   # Get holder's VCs
   curl http://localhost:5000/getHolderVCs/did:ethr:0xYOUR_HOLDER_ADDRESS
   
   # Should return:
   {
     "success": true,
     "holderDID": "did:ethr:0x...",
     "vcCIDs": ["QmXXX..."],
     "count": 1
   }
   ```

---

### **Step 4: Holder Views Received VC**

1. **Logout and Login as Holder Again:**
   - Back to Home → Holder Portal
   - Connect with the same MetaMask account used in Step 1

2. **View Credentials:**
   - Go to "My Credentials" (from navbar or dashboard)
   - You should see the VC issued by the issuer
   - Click to view full details

3. **Verify VC Content:**
   - Check that `credentialSubject.id` matches your DID
   - Verify all credential details are correct
   - Test selective disclosure if needed

---

## 🎨 Visual Indicators

### **Holder Dashboard:**
```
✅ DID Shared Successfully!
┌─────────────────────────────────────────────────────┐
│ 🔗 Share Your DID                    [✅ Shared]   │
│ Issuers can now send verifiable credentials        │
│ directly to your DID                                │
│                                                     │
│ [Update Information]                                │
└─────────────────────────────────────────────────────┘
```

### **Issuer VC Form:**
```
🎯 Select Holder (Recipient) *
┌─────────────────────────────────────────────────────┐
│ John Doe (0x123...abc)                        ▼    │
└─────────────────────────────────────────────────────┘
✅ Credential will be issued to: John Doe
```

---

## 🔍 Troubleshooting

### **Issue: Dropdown shows "No holders have shared their DID yet"**
**Solution:**
- Ensure holder has clicked "Share DID with Issuers"
- Check backend logs for registration confirmation
- Verify `registeredHolders.json` exists and contains data
- Try refreshing the issuer page

### **Issue: VC not appearing in holder's credentials**
**Solution:**
- Check that VC was successfully issued (check IPFS CID)
- Verify `vcHolderMap.json` contains the mapping
- Check backend logs for linking confirmation
- Try manually adding the CID in holder dashboard

### **Issue: "Failed to share DID" error**
**Solution:**
- Check backend server is running
- Verify `/registerHolderDID` endpoint is accessible
- Check browser console for detailed error
- Ensure MetaMask is connected

---

## 📊 Expected Data Flow

```
Holder Shares DID
    ↓
registeredHolders.json updated
    ↓
Issuer sees holder in dropdown
    ↓
Issuer issues VC with holder's DID
    ↓
VC uploaded to IPFS (CID: QmXXX...)
    ↓
vcHolderMap.json updated
    {
      "did:ethr:0xHOLDER": ["QmXXX..."]
    }
    ↓
Holder can fetch VC by DID
```

---

## 🧪 Test Scenarios

### **Scenario 1: Single Holder, Single Issuer**
1. Holder shares DID
2. Issuer issues 1 VC
3. Holder views VC
✅ **Expected:** VC appears with correct DID

### **Scenario 2: Multiple Holders**
1. Holder A shares DID
2. Holder B shares DID
3. Issuer sees both in dropdown
4. Issuer issues VC to Holder A
5. Issuer issues VC to Holder B
✅ **Expected:** Each holder sees only their VC

### **Scenario 3: Multiple VCs to Same Holder**
1. Holder shares DID
2. Issuer issues VC #1
3. Issuer issues VC #2
4. Issuer issues VC #3
✅ **Expected:** Holder sees all 3 VCs

### **Scenario 4: Update Holder Information**
1. Holder shares DID with name "John"
2. Holder clicks "Update Information"
3. Changes name to "John Doe"
4. Shares again
✅ **Expected:** Issuer sees updated name

---

## 📝 Quick Reference

### **Holder Actions:**
- ✅ Share DID: Holder Dashboard → "Share DID with Issuers"
- ✅ Update Info: Click "Update Information" button
- ✅ View VCs: Navigate to "My Credentials"

### **Issuer Actions:**
- ✅ View Holders: Issue VC Form → Dropdown
- ✅ Issue VC: Select holder → Fill form → Submit
- ✅ View Issued: "View Issued Credentials"

### **Backend Files:**
- 📄 `src/backend/data/registeredHolders.json` - Holder registrations
- 📄 `src/backend/data/vcHolderMap.json` - DID to VC CID mappings

### **API Endpoints:**
- `POST /registerHolderDID` - Register holder
- `GET /getRegisteredHolders` - List holders
- `POST /linkVCToHolder` - Link VC to holder
- `GET /getHolderVCs/:did` - Get holder's VCs
- `GET /resolveDID/:did` - Resolve DID

---

## ✅ Success Criteria

**You'll know it's working when:**
1. ✅ Holder can share DID and see "Shared" status
2. ✅ Issuer sees holder in dropdown
3. ✅ VC is issued with holder's DID in `credentialSubject.id`
4. ✅ VC-holder mapping is created automatically
5. ✅ Holder can view the issued VC
6. ✅ Data persists after server restart

---

## 🎉 Next Steps

Once basic flow is working:
1. Test with multiple holders
2. Test with multiple issuers
3. Test selective disclosure with issued VCs
4. Test verification flow
5. Implement auto-fetch VCs on holder login (optional)

---

**Happy Testing!** 🚀

For detailed implementation docs, see `DID_EXCHANGE_IMPLEMENTATION.md`
