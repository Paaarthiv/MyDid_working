# ✅ Bug Fix: Selective Disclosure 500 Error

## ❌ **The Problem:**

When generating selective disclosure proof:
- **Error:** `POST http://localhost:5000/generateProof 500 (Internal Server Error)`
- **UI Message:** "❌ VC does not contain a valid BBS+ signature"
- **Status:** Digital Signature Information now shows correctly (N/A fixed ✅)

---

## 🔍 **Root Cause:**

The `generateProof` endpoint only supported **Student ID** credentials (8 messages) but didn't support **Academic Certificate** credentials (14 messages).

### **The Issue:**

**During VC Issuance (`vcRoutes.js`):**
- **Student ID:** 8 messages signed
- **Academic Certificate:** 14 messages signed

**During Proof Generation (`holderAdvancedRoutes.js`):**
- **Before fix:** Only 8 messages (Student ID format) ❌
- **Result:** Message count mismatch → BBS+ proof generation fails → 500 error

---

## ✅ **The Fix:**

### **File 1:** `src/backend/routes/holderAdvancedRoutes.js`

Added support for both credential types with correct message order:

```javascript
// Detect credential type
const vcType = vc.type?.includes("AcademicCertificate") ? "AcademicCertificate" : "StudentID";

if (vcType === "AcademicCertificate") {
  // Academic Certificate: 14 messages (must match vcRoutes.js lines 201-216)
  allMessages = [
    credentialSubject.name || "",
    credentialSubject.registerNumber || "",
    credentialSubject.degree || "",
    credentialSubject.branch || "",
    credentialSubject.university || "",
    credentialSubject.location || "",
    credentialSubject.cgpa || "",
    credentialSubject.class || "",
    credentialSubject.examHeldIn || "",
    credentialSubject.issuedDate || "",
    credentialSubject.id || "",
    vc.issuer || "",
    vc.issuanceDate || "",
    credentialSubject.documentHash || ""
  ];
  
  fieldMapping = {
    'name': 0,
    'registerNumber': 1,
    'degree': 2,
    'branch': 3,
    'university': 4,
    'location': 5,
    'cgpa': 6,
    'class': 7,
    'examHeldIn': 8,
    'issuedDate': 9,
    'id': 10,
    'issuer': 11,
    'issuanceDate': 12,
    'documentHash': 13
  };
} else {
  // Student ID: 8 messages (must match vcRoutes.js lines 218-227)
  allMessages = [
    credentialSubject.name || "",
    credentialSubject.rollNumber || "",
    credentialSubject.dateOfBirth || "",
    credentialSubject.department || "",
    credentialSubject.id || "",
    vc.issuer?.id || "",
    vc.issuanceDate || "",
    credentialSubject.documentHash || ""
  ];
  
  fieldMapping = {
    'name': 0,
    'rollNumber': 1,
    'dateOfBirth': 2,
    'department': 3,
    'id': 4,
    'issuer': 5,
    'issuanceDate': 6,
    'documentHash': 7
  };
}
```

---

### **File 2:** `src/components/SelectiveDisclosure.js`

Added support for Academic Certificate fields in UI:

```javascript
const isAcademicCertificate = vc?.type?.includes("AcademicCertificate");

const availableFields = vc ? (
  isAcademicCertificate ? [
    // Academic Certificate fields (14 fields)
    { key: 'name', label: 'Name', value: vc.credentialSubject?.name },
    { key: 'registerNumber', label: 'Register Number', value: vc.credentialSubject?.registerNumber },
    { key: 'degree', label: 'Degree', value: vc.credentialSubject?.degree },
    { key: 'branch', label: 'Branch', value: vc.credentialSubject?.branch },
    { key: 'university', label: 'University', value: vc.credentialSubject?.university },
    { key: 'location', label: 'Location', value: vc.credentialSubject?.location },
    { key: 'cgpa', label: 'CGPA', value: vc.credentialSubject?.cgpa },
    { key: 'class', label: 'Class', value: vc.credentialSubject?.class },
    { key: 'examHeldIn', label: 'Exam Held In', value: vc.credentialSubject?.examHeldIn },
    { key: 'issuedDate', label: 'Issue Date', value: vc.credentialSubject?.issuedDate },
    { key: 'id', label: 'Subject ID', value: vc.credentialSubject?.id },
    { key: 'issuer', label: 'Issuer', value: vc.issuer },
    { key: 'issuanceDate', label: 'Issuance Date', value: vc.issuanceDate },
    { key: 'documentHash', label: 'Document Hash', value: vc.credentialSubject?.documentHash }
  ] : [
    // Student ID fields (8 fields)
    { key: 'name', label: 'Name', value: vc.credentialSubject?.name },
    { key: 'rollNumber', label: 'Roll Number', value: vc.credentialSubject?.rollNumber },
    { key: 'dateOfBirth', label: 'Date of Birth', value: vc.credentialSubject?.dateOfBirth },
    { key: 'department', label: 'Department', value: vc.credentialSubject?.department },
    { key: 'id', label: 'Subject ID', value: vc.credentialSubject?.id },
    { key: 'issuer', label: 'Issuer', value: vc.issuer?.id },
    { key: 'issuanceDate', label: 'Issuance Date', value: vc.issuanceDate },
    { key: 'documentHash', label: 'Document Hash', value: vc.credentialSubject?.documentHash }
  ]
).filter(field => field.value) : [];
```

---

## 📊 **Message Order Comparison:**

### **Student ID (8 messages):**
```
0: name
1: rollNumber
2: dateOfBirth
3: department
4: id (subject ID)
5: issuer.id
6: issuanceDate
7: documentHash
```

### **Academic Certificate (14 messages):**
```
0: name
1: registerNumber
2: degree
3: branch
4: university
5: location
6: cgpa
7: class
8: examHeldIn
9: issuedDate
10: id (subject ID)
11: issuer
12: issuanceDate
13: documentHash
```

---

## 🧪 **Testing:**

### **Test 1: Student ID Selective Disclosure**

1. Go to Holder Dashboard
2. Click on a **Student ID** credential
3. Click "Generate Selective Disclosure Proof"
4. Select fields (e.g., Name, Department)
5. Click "Generate Selective Disclosure Proof"

**Expected:**
```
✅ Proof generated successfully
✅ QR code displayed
✅ Proof CID shown
```

---

### **Test 2: Academic Certificate Selective Disclosure**

1. Go to Holder Dashboard
2. Click on an **Academic Certificate** credential
3. Click "Generate Selective Disclosure Proof"
4. Select fields (e.g., Name, Degree, University)
5. Click "Generate Selective Disclosure Proof"

**Expected:**
```
✅ Proof generated successfully
✅ QR code displayed
✅ Proof CID shown
✅ Shows 14 available fields (not 8)
```

---

### **Test 3: Verify Backend Logs**

**Expected console output:**
```
🔐 Generating selective disclosure proof...
   Selected fields: name, degree, university
   Credential type: AcademicCertificate
   Total messages: 14
   Disclosing indices: [0, 2, 4]
✅ Derived proof generated
   Proof size: 344 bytes
```

---

## ✅ **What's Fixed:**

1. ✅ **Academic Certificate support** - Now handles 14 messages correctly
2. ✅ **Student ID support** - Still works with 8 messages
3. ✅ **Message order** - Matches signing order exactly
4. ✅ **Field mapping** - Correct indices for both types
5. ✅ **UI fields** - Shows appropriate fields per credential type
6. ✅ **Logging** - Better debugging information

---

## 📝 **Summary:**

**Problem:** Selective disclosure failed for Academic Certificates because the proof generation only supported Student ID format (8 messages vs 14 messages).

**Solution:** Added credential type detection and separate message handling for both Student ID and Academic Certificate.

**Result:** Selective disclosure now works for both credential types! 🎉

---

**The selective disclosure 500 error is now fixed!**
