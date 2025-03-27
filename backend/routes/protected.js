const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();  // ✅ Load environment variables

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// 🚀 Ensure JWT_SECRET is defined
if (!JWT_SECRET) {
    throw new Error("⚠️ JWT_SECRET is not defined in .env file");
}

// ✅ Middleware for Authentication
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    console.log("🔍 Incoming Auth Header:", authHeader); // Log token header

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.error("❌ No token provided or incorrect format.");
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1]; // Extract token
    console.log("🔑 Extracted Token:", token); // Debugging

    try {
        console.log("🛠 JWT Secret Key Being Used:", JWT_SECRET); // Debug secret key
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log("✅ User Verified:", decoded); // Debugging
        req.user = decoded;
        next();
    } catch (err) {
        console.error("❌ Token verification failed:", err.message);

        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Session expired. Please log in again." });
        } else {
            return res.status(401).json({ message: "Invalid token. Authentication failed." });
        }
    }
};


// ✅ Protected Route: Dashboard
router.get("/dashboard", authMiddleware, (req, res) => {
    res.json({ message: "Welcome to the dashboard!", userId: req.user.userId || req.user._id });
});

module.exports = router;
