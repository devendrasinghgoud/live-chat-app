const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Import Routes
const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected");
const messageRoutes = require("./routes/messageRoutes"); // ✅ Import message routes
const Message = require("./models/Message"); // ✅ Import Message model

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Middleware
app.use(cors());
app.use(express.json()); // ✅ Keep only one instance
app.use(express.urlencoded({ extended: true })); // For form data

// Routes
app.use("/api/auth", authRoutes); // ✅ Register auth routes
app.use("/api/protected", protectedRoutes); // ✅ Register protected routes
app.use("/api/messages", messageRoutes); // ✅ Register message routes
app.use("/uploads", express.static("uploads"));


// Default Route
app.get("/", (req, res) => {
    res.send("🚀 Live Chat Backend Running with MongoDB");
});

// Connect to MongoDB with better error handling
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");

        mongoose.connection.on("error", (err) => {
            console.error("❌ MongoDB connection error:", err);
        });
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error);
        setTimeout(connectDB, 5000); // Retry after 5 seconds
    }
};

// Socket.io Connection Handling
io.on("connection", (socket) => {
    console.log(`⚡ New client connected: ${socket.id}`);

    // Handle incoming messages
    socket.on("message", async (msg) => {
        try {
            const newMessage = new Message({
                user: msg.user,
                text: msg.text,
            });
            await newMessage.save();

            io.emit("message", msg); // Broadcast message to all clients
        } catch (error) {
            console.error("❌ Error saving message:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});

// Start server only after DB connection
const startServer = async () => {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

startServer();
