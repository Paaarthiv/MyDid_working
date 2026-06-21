const crypto = require("crypto");

const TOKEN_TTL_SECONDS = Number(process.env.AUTH_TOKEN_TTL_SECONDS || 60 * 60 * 8);

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function getAuthSecret() {
  const secret = process.env.AUTH_TOKEN_SECRET || process.env.JWT_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_TOKEN_SECRET is required in production");
  }

  return "development-only-auth-secret-change-me";
}

function signToken(payload) {
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS
  };
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(tokenPayload);
  const signature = crypto
    .createHmac("sha256", getAuthSecret())
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  return {
    token: `${encodedHeader}.${encodedPayload}.${signature}`,
    expiresAt: new Date(tokenPayload.exp * 1000).toISOString()
  };
}

function verifyToken(token) {
  if (!token || typeof token !== "string") {
    throw new Error("Missing authentication token");
  }

  const [encodedHeader, encodedPayload, signature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error("Malformed authentication token");
  }

  const expectedSignature = crypto
    .createHmac("sha256", getAuthSecret())
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  const expected = Buffer.from(expectedSignature);
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    throw new Error("Invalid authentication token");
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error("Authentication token expired");
  }

  return payload;
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim();
  }
  return null;
}

function requireAuth(allowedRoles = []) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    try {
      const payload = verifyToken(getBearerToken(req));
      if (roles.length > 0 && !roles.includes(payload.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden for this role"
        });
      }

      req.user = payload;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
  };
}

function requireAddressMatch(valueGetter) {
  return (req, res, next) => {
    const suppliedAddress = valueGetter(req);
    if (!suppliedAddress || !req.user?.address) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required"
      });
    }

    if (String(suppliedAddress).toLowerCase() !== String(req.user.address).toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "Wallet address does not match authenticated user"
      });
    }

    next();
  };
}

module.exports = {
  signToken,
  verifyToken,
  requireAuth,
  requireAddressMatch
};
