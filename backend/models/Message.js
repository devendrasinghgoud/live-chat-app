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
      type: String, 
      required: true, 
      trim: true, 
      index: true // ✅ Improves query speed
    }
  },
  { timestamps: true } // ✅ Auto adds createdAt & updatedAt fields
);

module.exports = mongoose.model("Message", MessageSchema);
