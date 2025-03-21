const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();  // ✅ Load environment variables

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("⚠️ JWT_SECRET is not defined in .env file");
}

// ✅ Middleware for Authentication
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};

// ✅ Protected Route: Dashboard
router.get("/dashboard", authMiddleware, (req, res) => {
    res.json({ message: "Welcome to the dashboard!", userId: req.user.userId });
});

module.exports = router;
