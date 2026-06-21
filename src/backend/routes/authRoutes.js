// routes/authRoutes.js - Authentication routes
const express = require("express");
const { verifyMessage } = require("ethers");
const { signToken, requireAuth } = require("../utils/auth");

function roleFromMessage(message, explicitRole) {
  if (["issuer", "holder", "verifier"].includes(explicitRole)) {
    return explicitRole;
  }
  if (/issuer/i.test(message)) return "issuer";
  if (/holder/i.test(message)) return "holder";
  if (/verifier/i.test(message)) return "verifier";
  return "user";
}

module.exports = (loggedInUsers) => {
  const router = express.Router();

  /**
   * POST /login - MetaMask authentication
   */
  router.post("/login", async (req, res) => {
    const { address, message, signature, role } = req.body;
    
    if (!address || !message || !signature) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: address, message, signature" 
      });
    }

    try {
      // Verify the signature
      const signer = verifyMessage(message, signature);
      if (signer.toLowerCase() !== address.toLowerCase()) {
        return res.status(403).json({ 
          success: false, 
          message: "Invalid signature verification" 
        });
      }

      // Store logged-in user
      const userRole = roleFromMessage(message, role);
      const did = `did:ethr:${address}`;
      const signed = signToken({
        sub: address.toLowerCase(),
        address,
        did,
        publicKey: address,
        role: userRole
      });

      loggedInUsers[address] = {
        address: address,
        loginTime: new Date().toISOString(),
        did,
        publicKey: address,
        role: userRole,
        tokenExpiresAt: signed.expiresAt
      };

      console.log("✅ User logged in:", address);
      console.log("📋 Current logged-in users:", Object.keys(loggedInUsers).length);

      res.json({ 
        success: true, 
        message: "Login successful",
        token: signed.token,
        expiresAt: signed.expiresAt,
        user: {
          address: address,
          did,
          publicKey: address,
          role: userRole
        }
      });
    } catch (err) {
      console.error("❌ Login error:", err);
      res.status(500).json({ 
        success: false, 
        message: err.message 
      });
    }
  });

  /**
   * POST /logout - Logout user
   */
  router.post("/logout", requireAuth(), (req, res) => {
    const address = req.user.address;
    
    if (loggedInUsers[address]) {
      delete loggedInUsers[address];
      console.log("✅ User logged out:", address);
    }

    res.json({ 
      success: true, 
      message: "Logout successful" 
    });
  });

  /**
   * GET /session - Check session status
   */
  router.get("/session/:address", requireAuth(), (req, res) => {
    const { address } = req.params;

    if (address.toLowerCase() !== req.user.address.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "Wallet address does not match authenticated user"
      });
    }
    
    if (loggedInUsers[address]) {
      res.json({
        success: true,
        loggedIn: true,
        user: loggedInUsers[address]
      });
    } else {
      res.json({
        success: true,
        loggedIn: false
      });
    }
  });

  return router;
};
