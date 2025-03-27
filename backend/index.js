const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");

// Import Models & Routes
const User = require("./models/User");
const Message = require("./models/Message");
const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected");
const messageRoutes = require("./routes/messageRoutes");
const { authMiddleware } = require("./middleware/authMiddleware");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads")); // Serve profile pictures

// ✅ Configure Multer Storage
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
});
const upload = multer({ storage });

// ✅ Profile Picture Upload Route (Requires Authentication)
app.post("/api/upload-profile", authMiddleware, upload.single("profilePicture"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const userId = req.user.id; // Get user ID from authMiddleware
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const profilePicturePath = `/uploads/${req.file.filename}`;

        // ✅ Update User's Profile Picture
        const updatedUser = await User.findByIdAndUpdate(userId, { profilePicture: profilePicturePath }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ profilePicture: profilePicturePath });
    } catch (error) {
        console.error("❌ Error uploading profile picture:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/messages", messageRoutes);

// ✅ Default Route
app.get("/", (req, res) => {
    res.send("🚀 Live Chat Backend Running with MongoDB");
});

// ✅ MongoDB Connection with Auto-Reconnect
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("✅ MongoDB Connected");

        mongoose.connection.on("error", (err) => {
            console.error("❌ MongoDB connection error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.warn("⚠️ MongoDB disconnected! Retrying...");
            setTimeout(connectDB, 5000);
        });
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error);
        setTimeout(connectDB, 5000);
    }
};

// ✅ Socket.io Connection Handling
io.on("connection", (socket) => {
    console.log(`⚡ New client connected: ${socket.id}`);

    // ✅ Join Chat Room
    socket.on("joinRoom", ({ chatRoom }) => {
        socket.join(chatRoom);
        console.log(`✅ User joined room: ${chatRoom}`);
    });

    // ✅ Handle Incoming Messages
    socket.on("message", async (msg, callback) => {
        try {
            if (!msg.sender || !msg.content || !msg.chatRoom) {
                console.error("❌ Missing required fields in message:", msg);
                return;
            }

            // ✅ Fetch sender details (username + profile picture)
            const sender = await User.findById(msg.sender).select("username profilePicture");
            if (!sender) {
                console.error("❌ Sender not found:", msg.sender);
                return;
            }

            // ✅ Construct the message object with sender details
            const messageWithSender = {
                sender: sender._id,
                username: sender.username,
                profilePicture: sender.profilePicture || "/default-avatar.png",
                content: msg.content,
                chatRoom: msg.chatRoom,
                createdAt: new Date()
            };

            // ✅ Store message in MongoDB
            const savedMessage = new Message(messageWithSender);
            await savedMessage.save();

            // ✅ Emit the message only to the specific chat room
            io.to(msg.chatRoom).emit("message", messageWithSender);

            // ✅ Send acknowledgment to the sender
            callback(messageWithSender);
            console.log("✅ Message sent:", messageWithSender);
        } catch (error) {
            console.error("❌ Error sending message:", error);
        }
    });

    // ✅ Handle Disconnection
    socket.on("disconnect", () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});

// ✅ Start server only after DB connection
const startServer = async () => {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

startServer();
