const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const upload = require("../middleware/upload"); // ✅ Import upload middleware
const User = require("../models/User");
const dotenv = require("dotenv");

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("⚠️ JWT_SECRET is not defined in .env file");
}

// 🔹 Middleware to Verify JWT Token
const authenticate = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "Unauthorized. No token provided." });
  }

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
    req.user = decoded; // Attach user data to request
    next();
  } catch (error) {
    console.error("❌ Token Verification Error:", error);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// ✅ Signup Route
router.post("/signup", upload.single("profilePicture"), async (req, res) => {
  try {
    const { name, username, email, mobile, password } = req.body;

    // 🔹 Validate Required Fields
    if (!name || !username || !email || !mobile || !password) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // 🔹 Check if User Already Exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists. Please login." });
    }

    // 🔹 Hash the Password (12 salt rounds for security)
    const hashedPassword = await bcrypt.hash(password, 12);

    // 🔹 Handle Profile Picture Upload
    let profilePicture = "";
    if (req.file) {
      if (!req.file.mimetype.startsWith("image/")) {
        return res.status(400).json({ message: "Only image files are allowed!" });
      }
      profilePicture = `/uploads/${req.file.filename}`;
    }

    // 🔹 Create a New User
    const newUser = new User({
      name,
      username,
      email,
      mobile,
      password: hashedPassword,
      profilePicture,
    });

    await newUser.save();

    // 🔹 Generate JWT Token
    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username, profilePicture },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully!",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        mobile: newUser.mobile,
        profilePicture: newUser.profilePicture,
      },
    });
  } catch (error) {
    console.error("❌ Signup Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Login Route (Supports Email or Username)
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body; // Changed email → identifier

    // 🔹 Validate Input
    if (!identifier || !password) {
      return res.status(400).json({ message: "Email or Username and password are required!" });
    }

    // 🔹 Check if User Exists by Email OR Username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials. User not found." });
    }

    // 🔹 Compare Passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials. Wrong password." });
    }

    // 🔹 Generate JWT Token
    const token = jwt.sign(
      { userId: user._id, username: user.username, profilePicture: user.profilePicture },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        profilePicture: user.profilePicture,
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Fetch User Profile (Protected Route)
router.get("/profile", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password"); // Exclude password field

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ user });
  } catch (error) {
    console.error("❌ Profile Fetch Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
