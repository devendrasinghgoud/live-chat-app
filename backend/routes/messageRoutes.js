const express = require("express");
const router = express.Router();
const Message = require("../models/Message"); // Ensure you have a Message model
const { authMiddleware } = require("../middleware/authMiddleware"); // ✅ Correct import

// Get all messages
router.get("/", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 }); // Fetch all messages, sorted oldest to newest
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Delete a message (Only sender can delete)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (message.sender.toString() !== req.user.userId) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    await message.deleteOne();
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Edit a message (Only sender can edit)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (message.sender.toString() !== req.user.userId) {
      return res.status(403).json({ error: "You can only edit your own messages" });
    }

    message.content = content;
    await message.save();
    res.json({ message: "Message updated successfully", updatedMessage: message });
  } catch (error) {
    console.error("Error updating message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
