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
      type: mongoose.Schema.Types.ObjectId, 
      ref: "ChatRoom", 
      required: true, 
      index: true  // ✅ Optimized query performance
    },
    isDeleted: { 
      type: Boolean, 
      default: false  // ✅ Supports soft delete
    }
  },
  { timestamps: true }
);

// ✅ Auto-populate sender's username to avoid `populate()` in every query
MessageSchema.pre(/^find/, function (next) {
  this.populate("sender", "username");
  next();
});

// ✅ Converts Mongoose objects to JSON-friendly format
MessageSchema.set("toJSON", {
  virtuals: true, 
  transform: (_, obj) => {
    delete obj.__v; 
    return obj;
  }
});

module.exports = mongoose.model("Message", MessageSchema);
