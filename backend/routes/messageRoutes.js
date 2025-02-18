const express = require("express");
const router = express.Router();
const Message = require("../models/Message"); // Ensure you have a Message model
const authMiddleware = require("../middleware/authMiddleware"); // Protect route

// Get all messages
router.get("/", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 }); // Fetch all messages, sorted oldest to newest
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
