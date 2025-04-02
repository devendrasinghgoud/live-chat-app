const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const { authMiddleware } = require("../middleware/authMiddleware");

// ✅ Get messages between two users
router.get("/:sender/:receiver", authMiddleware, async (req, res) => {
  try {
    const { sender, receiver } = req.params;

    const messages = await Message.find({
      $or: [
        { senderUsername: sender, receiverUsername: receiver },
        { senderUsername: receiver, receiverUsername: sender },
      ],
      isDeleted: { $ne: true } // ✅ Exclude deleted messages
    })
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Soft delete a message (Only sender can delete)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    message.isDeleted = true; // ✅ Soft delete instead of permanent removal
    await message.save();
    
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Edit a message (Only sender can edit)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body; // ✅ Ensure we use `content`, not `text`
    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Message content cannot be empty" });
    }

    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only edit your own messages" });
    }

    message.content = content; // ✅ Corrected field name
    await message.save();
    
    res.json({ message: "Message updated successfully", updatedMessage: message });
  } catch (error) {
    console.error("Error updating message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
