const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Import Models & Routes
const User = require("./models/User"); // ✅ Import User model
const Message = require("./models/Message");
const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected");
const messageRoutes = require("./routes/messageRoutes");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Form data support
app.use("/uploads", express.static("uploads")); // Serve profile pictures

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
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("✅ MongoDB Connected");

        mongoose.connection.on("error", (err) => {
            console.error("❌ MongoDB connection error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.warn("⚠️ MongoDB disconnected! Retrying...");
            setTimeout(connectDB, 5000); // Retry after 5 seconds
        });

    } catch (error) {
        console.error("❌ MongoDB connection failed:", error);
        setTimeout(connectDB, 5000); // Retry after 5 seconds
    }
};

// ✅ Socket.io Connection Handling
io.on("connection", (socket) => {
    console.log(`⚡ New client connected: ${socket.id}`);

    // ✅ Handle Incoming Messages
    socket.on("message", async (msg) => {
        try {
            // Validate required fields
            if (!msg.sender || !msg.content || !msg.chatRoom) {
                console.error("❌ Missing required fields in message:", msg);
                return;
            }

            // Fetch sender details (populate username & profile picture)
            const sender = await User.findById(msg.sender).select("username profilePicture");
            if (!sender) {
                console.error("❌ Sender not found:", msg.sender);
                return;
            }

            // Save message to DB
            const newMessage = new Message({
                sender: msg.sender, // Must be a valid ObjectId
                content: msg.content,
                chatRoom: msg.chatRoom // Ensure chatRoom ID is provided
            });

            await newMessage.save();

            // Broadcast saved message with sender details
            const messageWithSender = {
                _id: newMessage._id,
                sender: {
                    _id: sender._id,
                    username: sender.username,
                    profilePicture: sender.profilePicture
                },
                content: newMessage.content,
                chatRoom: newMessage.chatRoom,
                createdAt: newMessage.createdAt
            };

            io.emit("message", messageWithSender);
            console.log("✅ Message sent:", messageWithSender);
        } catch (error) {
            console.error("❌ Error saving message:", error);
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
