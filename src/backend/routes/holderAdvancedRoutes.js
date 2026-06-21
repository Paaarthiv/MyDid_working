// routes/holderAdvancedRoutes.js - Advanced holder routes for fetching and selective disclosure
const express = require("express");
const QRCode = require("qrcode");
const { retrieveJSONFromIPFS, uploadJSONToPinata } = require("../utils/ipfs");
const { requireAuth } = require("../utils/auth");
const { getAllMessages, getDisclosedProofMessages, encodeMessages } = require("../utils/bbsMessages");

module.exports = (loggedInUsers, bbsLib) => {
  const router = express.Router();

  /**
   * GET /fetchVC/:cid - Fetch VC from IPFS by CID
   * Allows holder to retrieve any VC using its IPFS CID
   */
  router.get("/fetchVC/:cid", async (req, res) => {
    try {
      const { cid } = req.params;

      console.log(`\n📥 Fetching VC from IPFS: ${cid}`);

      // Retrieve VC from IPFS
      const vcData = await retrieveJSONFromIPFS(cid);

      if (!vcData) {
        return res.status(404).json({
          success: false,
          message: "VC not found on IPFS"
        });
      }

      console.log("✅ VC fetched successfully");
      console.log(`   Type: ${vcData.type ? vcData.type.join(', ') : 'Unknown'}`);
      console.log(`   Issuer: ${vcData.issuer?.id || 'Unknown'}`);

      res.json({
        success: true,
        vc: vcData,
        cid: cid
      });

    } catch (err) {
      console.error("❌ Error fetching VC:", err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Unable to fetch VC from IPFS"
      });
    }
  });

  /**
   * POST /generateProof - Generate selective disclosure proof
   * Uses BBS+ signatures to create a proof with only selected fields
   */
  router.post("/generateProof", requireAuth("holder"), async (req, res) => {
    try {
      const { vc, selectedFields, publicKey } = req.body;

      console.log("\n🔐 Generating selective disclosure proof...");
      console.log(`   Selected fields: ${selectedFields.join(', ')}`);

      if (!vc || !selectedFields || selectedFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: "VC and selectedFields are required"
        });
      }

      if (!bbsLib) {
        throw new Error("BBS+ library not initialized");
      }

      const fieldsToDisclose = [...new Set([
        ...selectedFields,
        ...(vc.credentialSubject?.documentHash ? ["documentHash"] : [])
      ])];

      // Extract the original signature from VC
      const originalSignature = vc.proof?.proofValue;
      if (!originalSignature) {
        throw new Error("VC does not contain a valid BBS+ signature");
      }

      // Convert signature from base64 to Uint8Array
      const signatureBytes = new Uint8Array(Buffer.from(originalSignature, 'base64'));

      // Get public key
      let publicKeyBytes;
      if (publicKey) {
        publicKeyBytes = new Uint8Array(Buffer.from(publicKey, 'base64'));
      } else {
        throw new Error("Public key is required for proof generation");
      }

      // Prepare messages in the same canonical order used for signing.
      const credentialSubject = vc.credentialSubject || {};
      const allMessages = getAllMessages(vc);
      const {
        disclosedFields,
        disclosedIndexes
      } = getDisclosedProofMessages(vc, fieldsToDisclose);

      console.log(`   Total messages: ${allMessages.length}`);
      const messageBytes = encodeMessages(allMessages);

      console.log(`   Disclosing indices: [${disclosedIndexes.join(', ')}]`);

      // Generate derived proof with correct ciphersuite
      const derivedProof = await bbsLib.deriveProof({
        signature: signatureBytes,
        publicKey: publicKeyBytes,
        messages: messageBytes,
        disclosedMessageIndexes: disclosedIndexes,
        header: new Uint8Array(),
        presentationHeader: new Uint8Array(),
        ciphersuite: bbsLib.CIPHERSUITES.BLS12381_SHA256
      });

      console.log("✅ Derived proof generated");
      console.log(`   Proof size: ${derivedProof.length} bytes`);

      // Create presentation document with only disclosed fields
      const disclosedCredentialSubject = {};
      disclosedFields.forEach(field => {
        if (credentialSubject[field] !== undefined) {
          disclosedCredentialSubject[field] = credentialSubject[field];
        }
      });

      const presentation = {
        "@context": vc["@context"],
        type: ["VerifiablePresentation", "SelectiveDisclosurePresentation"],
        verifiableCredential: {
          ...vc,
          credentialSubject: disclosedCredentialSubject,
          proof: {
            type: "BbsBlsSignatureProof2020",
            created: new Date().toISOString(),
            proofPurpose: "assertionMethod",
            verificationMethod: vc.proof.verificationMethod,
            proofValue: Buffer.from(derivedProof).toString('base64'),
            disclosedFields: disclosedFields,
            originalCID: req.body.originalCID || null
          }
        },
        proof: {
          type: "BbsBlsSignatureProof2020",
          created: new Date().toISOString(),
          proofPurpose: "authentication",
          challenge: Math.random().toString(36).substring(7),
          disclosedFields: disclosedFields
        }
      };

      // Upload presentation to IPFS
      console.log("📤 Uploading presentation to IPFS...");
      const proofUpload = await uploadJSONToPinata(presentation, `Proof-${Date.now()}`);

      console.log(`✅ Presentation uploaded: ${proofUpload.cid}`);

      // Generate QR code
      const qrData = JSON.stringify({
        cid: proofUpload.cid,
        type: "SelectiveDisclosureProof",
        disclosedFields: disclosedFields
      });

      const qrCode = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#4F46E5',
          light: '#FFFFFF'
        }
      });

      console.log("✅ QR code generated");

      res.json({
        success: true,
        proofCid: proofUpload.cid,
        proofUrl: proofUpload.ipfsUrl,
        qrCode: qrCode,
        selectedFields: disclosedFields,
        presentation: presentation,
        disclosedData: disclosedCredentialSubject
      });

    } catch (err) {
      console.error("❌ Error generating proof:", err);
      console.error("   Stack:", err.stack);
      res.status(500).json({
        success: false,
        message: err.message || "Failed to generate proof",
        error: err.toString()
      });
    }
  });

  /**
   * POST /verifyProof - Verify selective disclosure proof
   * Verifies a BBS+ derived proof
   */
  router.post("/verifyProof", async (req, res) => {
    try {
      const { proofCid, publicKey } = req.body;

      console.log("\n🔍 Verifying selective disclosure proof...");
      console.log(`   Proof CID: ${proofCid}`);

      // Fetch presentation from IPFS
      const presentation = await retrieveJSONFromIPFS(proofCid);

      if (!presentation || !presentation.verifiableCredential) {
        throw new Error("Invalid presentation format");
      }

      const vc = presentation.verifiableCredential;
      const proof = vc.proof;

      if (!proof || !proof.proofValue) {
        throw new Error("Presentation does not contain a valid proof");
      }

      // Convert proof from base64
      const proofBytes = new Uint8Array(Buffer.from(proof.proofValue, 'base64'));

      // Get public key
      let publicKeyBytes;
      if (publicKey) {
        publicKeyBytes = new Uint8Array(Buffer.from(publicKey, 'base64'));
      } else {
        throw new Error("Public key is required for verification");
      }

      const disclosedFields = proof.disclosedFields || [];
      const { disclosedIndexes, disclosedMessages } = getDisclosedProofMessages(vc, disclosedFields);
      const messageBytes = encodeMessages(disclosedMessages);

      console.log(`   Disclosed fields: ${disclosedFields.join(', ')}`);

      // Verify proof with correct ciphersuite
      const verified = await bbsLib.verifyProof({
        proof: proofBytes,
        publicKey: publicKeyBytes,
        disclosedMessages: messageBytes,
        disclosedMessageIndexes: disclosedIndexes,
        header: new Uint8Array(),
        presentationHeader: new Uint8Array(),
        ciphersuite: bbsLib.CIPHERSUITES.BLS12381_SHA256
      });

      console.log(`✅ Proof verification: ${verified ? 'VALID' : 'INVALID'}`);

      res.json({
        success: true,
        verified: verified,
        disclosedFields: disclosedFields,
        disclosedData: vc.credentialSubject || {},
        presentation: presentation
      });

    } catch (err) {
      console.error("❌ Error verifying proof:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Failed to verify proof"
      });
    }
  });

  return router;
};
