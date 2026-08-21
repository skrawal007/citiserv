require("dotenv").config();

const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    console.log("=================================");
    console.log("AUTH MIDDLEWARE CALLED");

    // 1. Check JWT secret
    console.log(
      "JWT_SECRET EXISTS:",
      !!process.env.JWT_SECRET
    );

    // 2. Get Authorization Header
    const authHeader = req.headers.authorization;

    // console.log("AUTH HEADER:", authHeader);

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing",
      });
    }

    // 3. Check Bearer format
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        message: "Invalid Authorization format",
      });
    }

    const token = parts[1];

    // console.log("TOKEN EXISTS:", !!token);
    // console.log("TOKEN:", token);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token not provided",
      });
    }

    // 4. Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // console.log("DECODED USER:", decoded);

    // 5. Save user in request
    req.user = decoded;

    console.log("JWT VERIFIED SUCCESSFULLY");
    console.log("=================================");

    next();

  } catch (error) {

    console.error("JWT ERROR:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      error: error.message,
    });
  }
};

module.exports = authMiddleware;