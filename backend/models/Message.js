const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    sender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    content: { 
      type: String, 
      required: true, 
      trim: true 
    },
    chatRoom: { 
      type: mongoose.Schema.Types.ObjectId, // Reference to a ChatRoom model
      ref: "ChatRoom", 
      required: true, 
      index: true // ✅ Improves query performance
    }
  },
  { timestamps: true } // ✅ Auto adds createdAt & updatedAt fields
);

module.exports = mongoose.model("Message", MessageSchema);
