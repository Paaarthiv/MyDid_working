# 🎓 Academic Certificate - Complete Request-to-Issue Flow

## ✅ **COMPLETE IMPLEMENTATION**

The Academic Certificate feature now works through the **complete request-approval flow**, just like Student ID!

---

## 🔄 **Complete Workflow**

### **Step 1: Holder Requests Academic Certificate**

```
1. Holder logs in
   ↓
2. Goes to "Request VC"
   ↓
3. Selects "Academic Certificate" from dropdown
   ↓
4. Form updates to show:
   ✅ Your DID (auto-filled)
   ✅ Your Name (optional)
   ✅ Credential Type: Academic Certificate
   ✅ Education Govt ID * (required)
   ✅ Upload Student ID Document * (NEW - required)
   ✅ Request Message * (required)
   ↓
5. Fills in all fields:
   - Education Govt ID: "EDU2024001234"
   - Uploads Student ID document (image/PDF)
   - Message: "Requesting academic certificate for B.Tech graduation 2024"
   ↓
6. Clicks "Submit Request"
   ↓
7. MetaMask popup appears for signature
   ↓
8. Signs the challenge
   ↓
9. ✅ Success: "Request Verified & Submitted!"
   ↓
10. Request appears in "My Requests" with status "Verified"
```

---

### **Step 2: Issuer Receives Request**

```
1. Issuer logs in
   ↓
2. Goes to "Handle Requests"
   ↓
3. Sees the Academic Certificate request:
   📋 Request Card shows:
   - Holder Name
   - Credential Type: Academic Certificate
   - Education Govt ID
   - Status: Verified (blue badge)
   - Message from holder
   ↓
4. Clicks "Approve & Issue"
```

---

### **Step 3: Issuer Fills Academic Details**

```
Modal opens with form:

1. Credential Type Selector:
   [Academic Certificate ▼]  ← Issuer can see/change type
   
2. Common Fields:
   ✅ Student Name * (pre-filled with holder name)
   ✅ Photo * (upload)

3. Academic Certificate Specific Fields:
   ✅ Register Number *
   ✅ Degree * (e.g., Bachelor of Technology)
   ✅ Branch * (e.g., Computer Science)
   ✅ University *
   ✅ Location * (e.g., Bangalore, Karnataka)
   ✅ CGPA * (e.g., 8.75)
   ✅ Class * (dropdown: First Class with Distinction, etc.)
   ✅ Exam Held In * (e.g., May 2024)
   ✅ Issue Date * (date picker)
   
4. Issuer fills all fields
   ↓
5. Clicks "Issue Credential"
   ↓
6. Backend processes:
   - Validates all fields
   - Uploads photo to IPFS
   - Creates Academic Certificate VC
   - Generates BBS+ signature (14 messages)
   - Uploads VC JSON to IPFS
   - Anchors hash on blockchain
   ↓
7. ✅ Success! Certificate issued
   ↓
8. Request status changes to "Approved"
   ↓
9. Holder can view certificate in dashboard
```

---

## 📋 **What Shows When**

### **Holder Request Form:**

#### **When "Student ID" is selected:**
```
✅ Your DID
✅ Your Name (optional)
✅ Credential Type: Student ID
✅ Admission Number *
✅ Request Message *
```

#### **When "Academic Certificate" is selected:**
```
✅ Your DID
✅ Your Name (optional)
✅ Credential Type: Academic Certificate
✅ Education Govt ID *
✅ Upload Student ID Document * ← NEW!
✅ Request Message *
```

---

### **Issuer Approval Form:**

#### **When "Student ID" is selected:**
```
✅ Credential Type: Student ID
✅ Student Name *
✅ Roll Number *
✅ Date of Birth *
✅ Department *
✅ Photo *
```

#### **When "Academic Certificate" is selected:**
```
✅ Credential Type: Academic Certificate
✅ Student Name *
✅ Register Number *
✅ Degree *
✅ Branch *
✅ University *
✅ Location *
✅ CGPA *
✅ Class * (dropdown)
✅ Exam Held In *
✅ Issue Date *
✅ Photo *
```

---

## 🎨 **UI Features**

### **Holder Side:**
- ✅ Credential type dropdown
- ✅ Dynamic field labels (Admission Number vs Education Govt ID)
- ✅ Conditional Student ID upload (only for Academic Certificate)
- ✅ File upload with image/PDF support
- ✅ Clear helper text
- ✅ Responsive design

### **Issuer Side:**
- ✅ Credential type selector in modal
- ✅ Dynamic form fields based on type
- ✅ Grid layout for related fields
- ✅ Dropdown for Class selection
- ✅ Date picker for Issue Date
- ✅ Placeholders for guidance
- ✅ Validation on all fields

---

## 🔒 **Security & Verification**

### **Holder Request:**
1. ✅ DID ownership verified via MetaMask signature
2. ✅ Challenge-response prevents replay attacks
3. ✅ Student ID document uploaded for verification
4. ✅ Request stored with "verified" status

### **Issuer Approval:**
1. ✅ Only verified requests can be approved
2. ✅ Issuer fills in official academic details
3. ✅ BBS+ signature on all 14 fields
4. ✅ IPFS storage (immutable)
5. ✅ Blockchain anchoring (tamper-proof)

---

## 📊 **Request Data Structure**

### **Academic Certificate Request:**
```json
{
  "requestId": "req_1730678400000_abc123",
  "holderDID": "did:ethr:0x...",
  "holderAddress": "0x...",
  "holderName": "John Doe",
  "vcType": "Academic Certificate",
  "verificationID": "EDU2024001234",
  "studentIDDocument": "QmXyz123...",  ← IPFS CID of uploaded document
  "message": "Requesting academic certificate for B.Tech graduation 2024",
  "status": "verified",
  "requestedAt": "2024-11-03T19:00:00.000Z"
}
```

---

## 🎓 **Issued Academic Certificate VC:**

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://w3id.org/security/bbs/v1"
  ],
  "type": ["VerifiableCredential", "AcademicCertificate"],
  "issuer": "did:ethr:0x480b1B5Ff78734158711D489aD3aD312379118f3",
  "issuanceDate": "2024-11-03T19:30:00.000Z",
  "credentialSubject": {
    "id": "did:ethr:0x1234...",
    "name": "John Doe",
    "registerNumber": "REG2024001234",
    "degree": "Bachelor of Technology",
    "branch": "Computer Science Engineering",
    "university": "ABC University",
    "location": "Bangalore, Karnataka",
    "cgpa": "8.75",
    "class": "First Class with Distinction",
    "examHeldIn": "May 2024",
    "issuedDate": "2024-06-15",
    "photo": "data:image/png;base64,...",
    "documentHash": "eeb46b1fc9b853403d47e9280c0560e100713914...",
    "documentIPFS": {
      "cid": "QmXyz123...",
      "url": "https://gateway.pinata.cloud/ipfs/QmXyz123..."
    },
    "signatories": {
      "authorizedSignatory": "Authorized Signatory, ABC University",
      "viceChancellor": "Vice Chancellor"
    }
  },
  "proof": {
    "type": "BbsBlsSignature2020",
    "created": "2024-11-03T19:30:00.000Z",
    "verificationMethod": "did:ethr:0x480b1B5Ff78734158711D489aD3aD312379118f3#bbs-key-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "kR3jK8mN9pQ2sT5vW8xY1zA3bC6dE9fH2iJ5kL8mN0oP..."
  }
}
```

---

## 🧪 **Testing Guide**

### **Test 1: Request Academic Certificate**

**As Holder:**
1. Login
2. Go to "Request VC"
3. Select "Academic Certificate"
4. Fill in:
   ```
   Education Govt ID: EDU2024001234
   Upload: [Select student_id.jpg]
   Message: "Requesting B.Tech degree certificate for 2024 graduation"
   ```
5. Submit
6. Sign with MetaMask
7. ✅ See success message

**Expected:**
- Form shows Student ID upload field
- File upload works
- Request submitted successfully
- Status: "Verified"

---

### **Test 2: Issue Academic Certificate**

**As Issuer:**
1. Login
2. Go to "Handle Requests"
3. See Academic Certificate request
4. Click "Approve & Issue"
5. Verify "Academic Certificate" is selected
6. Fill in:
   ```
   Student Name: John Doe
   Register Number: REG2024001234
   Degree: Bachelor of Technology
   Branch: Computer Science Engineering
   University: ABC University
   Location: Bangalore, Karnataka
   CGPA: 8.75
   Class: First Class with Distinction
   Exam Held In: May 2024
   Issue Date: 2024-06-15
   Photo: [Upload photo]
   ```
7. Click "Issue Credential"

**Expected:**
- All fields visible
- Validation works
- Certificate issued successfully
- Holder can view in dashboard

---

### **Test 3: Student ID Still Works**

**As Holder:**
1. Select "Student ID"
2. Verify NO Student ID upload field shows
3. Only shows Admission Number field
4. Submit works normally

**As Issuer:**
1. Approve Student ID request
2. Form shows Student ID fields (Roll Number, DOB, Department)
3. Issue works normally

**Expected:**
- ✅ No interference between types
- ✅ Both flows work independently

---

## 📝 **Key Differences**

| Feature | Student ID | Academic Certificate |
|---------|-----------|---------------------|
| **Request Field** | Admission Number | Education Govt ID |
| **Document Upload** | ❌ Not required | ✅ Required (Student ID) |
| **Issuer Fields** | Roll Number, DOB, Department | Register Number, Degree, Branch, University, CGPA, Class, etc. |
| **VC Type** | `StudentID` | `AcademicCertificate` |
| **BBS+ Messages** | 8 messages | 14 messages |
| **Signatories** | ❌ Not included | ✅ Included |
| **Use Case** | Daily ID | Degree proof |

---

## ✅ **Implementation Checklist**

- [x] Holder request form updated
- [x] Credential type dropdown working
- [x] Student ID upload field added (conditional)
- [x] File upload validation
- [x] Request submission with document
- [x] Issuer sees credential type
- [x] Issuer approval form dynamic
- [x] Academic Certificate fields complete
- [x] Backend validation
- [x] BBS+ signature (14 messages)
- [x] IPFS upload
- [x] Blockchain anchoring
- [x] Student ID flow preserved
- [x] Testing completed

---

## 🎉 **Summary**

**The complete Academic Certificate request-to-issue flow is now implemented!**

### **Holder Experience:**
1. ✅ Select "Academic Certificate"
2. ✅ Upload Student ID document
3. ✅ Submit request
4. ✅ Sign with MetaMask
5. ✅ Wait for issuer approval

### **Issuer Experience:**
1. ✅ Receive Academic Certificate request
2. ✅ Review holder's information
3. ✅ Click "Approve & Issue"
4. ✅ Fill in all academic details
5. ✅ Issue certificate

### **Result:**
✅ Cryptographically signed Academic Certificate
✅ Stored on IPFS (immutable)
✅ Anchored on blockchain (tamper-proof)
✅ Holder can view and share certificate
✅ Full selective disclosure support

**The system now supports end-to-end Academic Certificate issuance!** 🎓🔐🚀
