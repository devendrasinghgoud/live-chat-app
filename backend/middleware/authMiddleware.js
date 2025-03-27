const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.error("❌ No token provided or incorrect format.");
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1]; // Extract token
    console.log("📌 Incoming Token:", token); // 🔍 Debugging

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Decoded User:", decoded); // 🔍 Debugging
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

// ✅ Correctly export the function
module.exports = { authMiddleware };
