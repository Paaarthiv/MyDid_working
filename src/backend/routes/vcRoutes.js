// routes/vcRoutes.js - Verifiable Credential issuance routes
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const crypto = require("crypto");

const { computeFileHash, generateChallenge } = require("../utils/crypto");
const { uploadFileToPinata, uploadJSONToPinata } = require("../utils/ipfs");
const { requireAuth, requireAddressMatch } = require("../utils/auth");
const { storeVCReference } = require("../utils/holderVcStore");

const upload = multer({ dest: "uploads/" });

module.exports = (loggedInUsers, bbsKeyPair, bbsLib) => {
  const router = express.Router();

  /**
   * GET /bbs-public-key - Get BBS+ public key
   */
  router.get("/bbs-public-key", (req, res) => {
    if (!bbsKeyPair) {
      return res.status(500).json({
        success: false,
        message: "BBS+ keys not initialized"
      });
    }

    res.json({
      success: true,
      publicKey: Buffer.from(bbsKeyPair.publicKey).toString('base64'),
      keyType: "BLS12-381-G2"
    });
  });

  /**
   * POST /issueVC - Issue Verifiable Credential with IPFS and blockchain anchoring
   */
  router.post("/issueVC", requireAuth("issuer"), upload.single("photo"), requireAddressMatch(req => req.body.address), async (req, res) => {
    const { 
      name, address, holderDID, credentialType, holderAddress,
      // Student ID fields
      rollNumber, dob, department, documentType,
      // Academic Certificate fields
      registerNumber, degree, branch, university, location, cgpa, class: studentClass, examHeldIn, issueDate
    } = req.body;

    // Validate required fields based on credential type
    const vcType = credentialType || "StudentID";
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required field: name" 
      });
    }
    
    if (vcType === "StudentID") {
      if (!rollNumber || !dob || !department) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields for Student ID: rollNumber, dob, department" 
        });
      }
    } else if (vcType === "AcademicCertificate") {
      if (!registerNumber || !degree || !branch || !university || !location || !cgpa || !studentClass || !examHeldIn || !issueDate) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields for Academic Certificate: registerNumber, degree, branch, university, location, cgpa, class, examHeldIn, issueDate" 
        });
      }
    }

    // Require holderDID - enforce request-only flow
    if (!holderDID) {
      return res.status(400).json({ 
        success: false, 
        message: "holderDID is required. Credentials can only be issued through the request approval flow." 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "Photo file is required" 
      });
    }

    let documentCID = null;
    let vcCID = null;
    let documentHash = null;

    try {
      console.log("\n🚀 Starting VC issuance process...");

      // Step 1: Compute document hash
      console.log("📝 Step 1: Computing document hash...");
      documentHash = computeFileHash(req.file.path);

      // Step 2: Upload document to IPFS
      console.log("📤 Step 2: Uploading document to IPFS...");
      const documentUpload = await uploadFileToPinata(req.file.path, req.file.originalname || "photo.jpg");
      documentCID = documentUpload.cid;

      // Step 3: Read photo for VC embedding
      console.log("📷 Step 3: Reading photo data...");
      const photoBase64 = fs.readFileSync(req.file.path, { encoding: "base64" });
      
      // Clean up temp file
      fs.unlinkSync(req.file.path);

      // Step 4: Create Verifiable Credential
      console.log("📋 Step 4: Creating Verifiable Credential...");
      
      let vc;
      
      if (vcType === "AcademicCertificate") {
        // Academic Certificate Schema
        vc = {
          "@context": [
            "https://www.w3.org/2018/credentials/v1",
            "https://w3id.org/security/bbs/v1"
          ],
          type: ["VerifiableCredential", "AcademicCertificate"],
          issuer: `did:ethr:${address}`,
          issuanceDate: new Date().toISOString(),
          credentialSubject: {
            id: holderDID,
            name: name,
            registerNumber: registerNumber,
            degree: degree,
            branch: branch,
            university: university,
            location: location,
            cgpa: cgpa,
            class: studentClass,
            examHeldIn: examHeldIn,
            issuedDate: issueDate,
            photo: `data:image/png;base64,${photoBase64}`,
            documentHash: documentHash,
            documentIPFS: {
              cid: documentCID,
              url: documentUpload.ipfsUrl
            },
            signatories: {
              authorizedSignatory: `Authorized Signatory, ${university}`,
              viceChancellor: "Vice Chancellor"
            }
          },
          credentialSchema: {
            id: "https://example.org/schemas/academic-certificate.json",
            type: "JsonSchemaValidator2018"
          }
        };
      } else {
        // Student ID Schema (default)
        vc = {
          "@context": [
            "https://www.w3.org/2018/credentials/v1",
            "https://w3id.org/security/bbs/v1"
          ],
          type: ["VerifiableCredential", "StudentID"],
          issuer: {
            id: `did:ethr:${address}`,
            name: "Digital Identity Management System"
          },
          issuanceDate: new Date().toISOString(),
          credentialSubject: {
            id: holderDID || `did:ethr:${address}-student-${Date.now()}`,
            type: "Student",
            name: name,
            rollNumber: rollNumber,
            dateOfBirth: dob,
            department: department,
            documentType: documentType || "Student ID",
            photo: `data:image/png;base64,${photoBase64}`,
            documentHash: documentHash,
            documentIPFS: {
              cid: documentCID,
              url: documentUpload.ipfsUrl
            }
          },
          credentialSchema: {
            id: "https://example.org/schemas/student-id.json",
            type: "JsonSchemaValidator2018"
          }
        };
      }

      // Step 5: Generate BBS+ signature
      console.log("🔐 Step 5: Generating BBS+ signature...");
      
      let messages;
      if (vcType === "AcademicCertificate") {
        messages = [
          vc.credentialSubject.name,
          vc.credentialSubject.registerNumber,
          vc.credentialSubject.degree,
          vc.credentialSubject.branch,
          vc.credentialSubject.university,
          vc.credentialSubject.location,
          vc.credentialSubject.cgpa,
          vc.credentialSubject.class,
          vc.credentialSubject.examHeldIn,
          vc.credentialSubject.issuedDate,
          vc.credentialSubject.id,
          vc.issuer,
          vc.issuanceDate,
          documentHash
        ];
      } else {
        messages = [
          vc.credentialSubject.name,
          vc.credentialSubject.rollNumber,
          vc.credentialSubject.dateOfBirth,
          vc.credentialSubject.department,
          vc.credentialSubject.id,
          vc.issuer.id,
          vc.issuanceDate,
          documentHash
        ];
      }

      let signature;
      let signatureType = "BbsBlsSignature2020";
      
      try {
        // Verify keyPair format
        if (!bbsKeyPair || !bbsKeyPair.publicKey || !bbsKeyPair.secretKey) {
          throw new Error("Invalid BBS+ key pair");
        }

        if (!bbsLib) {
          throw new Error("BBS+ library not initialized");
        }

        // Convert messages to Uint8Array using TextEncoder (proper way for @digitalbazaar)
        const encoder = new TextEncoder();
        const messageBytes = messages.map(msg => encoder.encode(String(msg || "")));

        // Sign with @digitalbazaar/bbs-signatures (header can be empty)
        const header = new Uint8Array();
        signature = await bbsLib.sign({
          secretKey: bbsKeyPair.secretKey,
          publicKey: bbsKeyPair.publicKey,
          header: header,
          messages: messageBytes,
          ciphersuite: bbsLib.CIPHERSUITES.BLS12381_SHA256
        });
        
        console.log("✅ BBS+ signature generated successfully");
        console.log("📋 Signature length:", signature.length, "bytes");
      } catch (bbsError) {
        console.error("❌ BBS+ signature failed:", bbsError.message);
        console.warn("⚠️ Using HMAC fallback signature");
        
        // Fallback to HMAC if BBS+ fails
        const credentialData = JSON.stringify({
          name: vc.credentialSubject.name,
          rollNumber: vc.credentialSubject.rollNumber,
          dateOfBirth: vc.credentialSubject.dateOfBirth,
          department: vc.credentialSubject.department,
          issuer: address,
          issuanceDate: vc.issuanceDate,
          documentHash: documentHash
        });

        const hmacSignature = crypto
          .createHmac('sha256', Buffer.from(bbsKeyPair.publicKey))
          .update(credentialData)
          .digest();

        signature = new Uint8Array(hmacSignature);
        signatureType = "HmacSha256Signature2020";
        console.log("✅ Fallback HMAC signature generated");
      }

      const issuerDID = vcType === "AcademicCertificate" ? vc.issuer : vc.issuer.id;

      // Add proof to VC
      vc.proof = {
        type: signatureType,
        created: new Date().toISOString(),
        proofPurpose: "assertionMethod",
        verificationMethod: `${issuerDID}#bbs-key-1`,
        proofValue: Buffer.from(signature).toString('base64'),
        challenge: generateChallenge()
      };

      // Step 6: Upload VC JSON to IPFS
      console.log("📤 Step 6: Uploading VC JSON to IPFS...");
      const identifier = vcType === "AcademicCertificate" ? registerNumber : rollNumber;
      const vcUpload = await uploadJSONToPinata(vc, `VC-${vcType}-${identifier}-${Date.now()}`);
      vcCID = vcUpload.cid;

      // Step 7: Blockchain anchoring is now done by the frontend
      let blockchainData = null;

      // Step 8: Store VC reference for holder (internal call)
      try {
        const holderWalletAddress = (() => {
          if (holderAddress) {
            return holderAddress;
          }
          if (holderDID && holderDID.includes(":")) {
            const parts = holderDID.split(":");
            return parts[parts.length - 1];
          }
          return null;
        })();

        if (!holderWalletAddress) {
          console.warn("⚠️ Could not derive holder wallet address from DID - skipping holder store call");
        } else {
          const subject = vc.credentialSubject || {};
          const credentialSummary = vcType === "AcademicCertificate"
            ? {
                name: subject.name,
                registerNumber: subject.registerNumber,
                degree: subject.degree,
                branch: subject.branch,
                university: subject.university,
                location: subject.location,
                cgpa: subject.cgpa,
                class: subject.class,
                examHeldIn: subject.examHeldIn,
                issuedDate: subject.issuedDate,
                documentHash: subject.documentHash
              }
            : {
                name: subject.name,
                rollNumber: subject.rollNumber,
                department: subject.department,
                dateOfBirth: subject.dateOfBirth,
                documentType: subject.documentType || documentType || "Student ID",
                documentHash: subject.documentHash
              };

          storeVCReference(holderWalletAddress, {
            vcCID: vcCID,
            issuerDID: issuerDID,
            issuanceDate: vc.issuanceDate,
            credentialType: vc.type[1] || "VerifiableCredential",
            credentialSubject: credentialSummary
          });
          console.log(`✅ VC reference stored for holder (${holderWalletAddress})`);
        }
      } catch (storeError) {
        console.warn("⚠️ Could not store VC reference for holder:", storeError.message);
        // Don't fail the issuance if storage fails
      }

      // Step 9: Return response
      console.log("✅ VC issuance completed successfully!\n");

      res.json({ 
        success: true, 
        message: "VC issued successfully",
        vc: vc,
        ipfs: {
          documentCID: documentCID,
          documentURL: documentUpload.ipfsUrl,
          vcCID: vcCID,
          vcURL: vcUpload.ipfsUrl
        },
        blockchain: blockchainData,
        documentHash: documentHash,
        bbsPublicKey: Buffer.from(bbsKeyPair.publicKey).toString('base64'),
        messageCount: messages.length
      });

    } catch (err) {
      console.error("❌ VC issuance error:", err);
      
      // Clean up temp file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({ 
        success: false, 
        message: err.message,
        error: err.toString()
      });
    }
  });

  return router;
};
