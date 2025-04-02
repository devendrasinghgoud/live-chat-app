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
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

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

// ✅ Profile Picture Upload Route
app.post("/api/upload-profile", authMiddleware, upload.single("profilePicture"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });
        const userId = req.user.id;
        const profilePicturePath = `/uploads/${req.file.filename}`;
        const updatedUser = await User.findByIdAndUpdate(userId, { profilePicture: profilePicturePath }, { new: true });
        if (!updatedUser) return res.status(404).json({ message: "User not found" });
        res.json({ profilePicture: profilePicturePath });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Fetch All Users Route
app.get("/api/users", async (req, res) => {
    try {
        const users = await User.find({}, "-password");
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/messages", messageRoutes);

// ✅ MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error);
        process.exit(1);
    }
};

// ✅ WebSocket Connection Handling
const users = {}; // Store active users & their socket IDs

io.on("connection", (socket) => {
    console.log(`⚡ New client connected: ${socket.id}`);

    socket.on("joinChat", (userId) => {
        users[userId] = socket.id; // Store user socket ID
        socket.join(userId); // User joins their unique room
        console.log(`✅ User ${userId} joined with socket ID: ${socket.id}`);
    });

    // Handle Sending Messages
    socket.on("sendMessage", async ({ sender, receiver, content }) => {
        try {
            if (!sender || !receiver || !content) return;
            const senderUser = await User.findOne({ username: sender }).select("username profilePicture");
            const receiverUser = await User.findOne({ username: receiver }).select("username profilePicture");
            if (!senderUser || !receiverUser) return;

            // Save message to MongoDB
            const savedMessage = await Message.create({
                sender: senderUser._id,
                senderUsername: senderUser.username,
                senderProfilePicture: senderUser.profilePicture || "/default-avatar.png",
                receiver: receiverUser._id,
                receiverUsername: receiverUser.username,
                content,
                createdAt: new Date(),
            });

            // Send message to receiver if online
            if (users[receiverUser._id]) {
                io.to(users[receiverUser._id]).emit("receiveMessage", savedMessage);
            }

            // Send message confirmation to sender
            io.to(users[senderUser._id]).emit("receiveMessage", savedMessage);
        } catch (error) {
            console.error("❌ Error sending message:", error);
        }
    });

    socket.on("disconnect", () => {
        Object.keys(users).forEach((userId) => {
            if (users[userId] === socket.id) {
                delete users[userId];
                console.log(`❌ User ${userId} disconnected.`);
            }
        });
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});

// ✅ Start server
const startServer = async () => {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

startServer();
