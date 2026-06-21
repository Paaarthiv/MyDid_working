// routes/holderRoutes.js - Holder Dashboard routes for managing received credentials
const express = require("express");
const { retrieveJSONFromIPFS } = require("../utils/ipfs");
const { requireAuth, requireAddressMatch } = require("../utils/auth");
const {
  loadVCsForHolder,
  storeVCReference,
  removeVCReference
} = require("../utils/holderVcStore");

module.exports = () => {
  const router = express.Router();

  /**
   * POST /holder/store-vc - Store VC reference when holder receives a credential.
   * Issuer-only because this mutates a holder wallet.
   */
  router.post("/store-vc", requireAuth("issuer"), (req, res) => {
    try {
      const { holderAddress, vcCID, issuerDID, issuanceDate, credentialType, credentialSubject } = req.body;

      if (!holderAddress || !vcCID) {
        return res.status(400).json({
          success: false,
          message: "holderAddress and vcCID are required"
        });
      }

      const result = storeVCReference(holderAddress, {
        vcCID,
        issuerDID,
        issuanceDate,
        credentialType: credentialType || "VerifiableCredential",
        credentialSubject: credentialSubject || {}
      });

      return res.json({
        success: true,
        message: result.inserted ? "VC reference stored successfully" : "VC already stored for this holder",
        totalVCs: result.totalVCs
      });
    } catch (err) {
      console.error("Error storing VC reference:", err);
      return res.status(err.statusCode || 500).json({
        success: false,
        message: err.message
      });
    }
  });

  /**
   * GET /holder/vcs/:address - Get all VCs for a wallet address.
   */
  router.get("/vcs/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const holderVCs = loadVCsForHolder(address);

      const enrichedVCs = await Promise.all(
        holderVCs.map(async (vcRef) => {
          try {
            const fullVC = await retrieveJSONFromIPFS(vcRef.vcCID);
            return {
              ...vcRef,
              fullVC,
              name: fullVC.credentialSubject?.name || "Unknown",
              rollNumber: fullVC.credentialSubject?.rollNumber || "N/A",
              department: fullVC.credentialSubject?.department || "N/A",
              documentType: fullVC.credentialSubject?.documentType || "Credential"
            };
          } catch (err) {
            console.warn(`Could not fetch full VC for CID ${vcRef.vcCID}:`, err.message);
            return {
              ...vcRef,
              error: "Could not retrieve full VC data"
            };
          }
        })
      );

      return res.json({
        success: true,
        count: enrichedVCs.length,
        vcs: enrichedVCs
      });
    } catch (err) {
      console.error("Error fetching holder VCs:", err);
      return res.status(500).json({
        success: false,
        message: err.message
      });
    }
  });

  /**
   * GET /holder/vc/:cid - Get specific VC by CID.
   */
  router.get("/vc/:cid", async (req, res) => {
    try {
      const { cid } = req.params;
      const vcData = await retrieveJSONFromIPFS(cid);

      return res.json({
        success: true,
        vc: vcData
      });
    } catch (err) {
      console.error("Error fetching VC:", err);
      return res.status(500).json({
        success: false,
        message: err.message
      });
    }
  });

  /**
   * DELETE /holder/vc/:cid - Remove VC reference from holder's local list.
   */
  router.delete(
    "/vc/:cid",
    requireAuth("holder"),
    requireAddressMatch(req => req.body.address),
    (req, res) => {
      try {
        const { cid } = req.params;
        const { address } = req.body;

        const result = removeVCReference(address, cid);
        if (!result.removed) {
          return res.status(404).json({
            success: false,
            message: "VC not found in your credentials"
          });
        }

        return res.json({
          success: true,
          message: "VC reference removed from your dashboard",
          remainingVCs: result.totalVCs
        });
      } catch (err) {
        console.error("Error removing VC reference:", err);
        return res.status(500).json({
          success: false,
          message: err.message
        });
      }
    }
  );

  /**
   * GET /holder/stats/:address - Get statistics for holder.
   */
  router.get("/stats/:address", (req, res) => {
    try {
      const { address } = req.params;
      const holderVCs = loadVCsForHolder(address);
      const sortedVCs = [...holderVCs].sort((a, b) =>
        new Date(b.receivedAt || b.issuanceDate) - new Date(a.receivedAt || a.issuanceDate)
      );

      return res.json({
        success: true,
        stats: {
          totalCredentials: holderVCs.length,
          latestIssuance: sortedVCs.length > 0 ? sortedVCs[0].issuanceDate : null,
          latestReceived: sortedVCs.length > 0 ? sortedVCs[0].receivedAt : null
        }
      });
    } catch (err) {
      console.error("Error fetching holder stats:", err);
      return res.status(500).json({
        success: false,
        message: err.message
      });
    }
  });

  return router;
};
