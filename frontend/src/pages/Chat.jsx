import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import { jwtDecode } from "jwt-decode";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const decodedUser = jwtDecode(token);
      console.log("Decoded User:", decodedUser);

      if (!decodedUser?.userId || !decodedUser?.username) {
        console.error("Invalid token structure or missing userId.");
        navigate("/login");
        return;
      }

      if (decodedUser.exp * 1000 < Date.now()) {
        console.warn("Token has expired.");
        navigate("/login");
        return;
      }

      setUser(decodedUser);
    } catch (error) {
      console.error("Error decoding token:", error);
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    socket.on("message", (newMessage) => {
      console.log("New message received:", newMessage);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    return () => {
      socket.off("message");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (message.trim() && user) {
      const chatRoomId = "65d7f1e99e0a5f2b12345678"; // ✅ Use actual MongoDB chat room ID

      const chatMessage = {
        sender: user.userId,
        username: user.username, // ✅ Added username for display
        content: message,
        chatRoom: chatRoomId,
      };

      socket.emit("message", chatMessage);
      setMessages((prev) => [...prev, chatMessage]); // Update UI immediately
      setMessage("");
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Live Chat</h1>
      </div>
      <div className="chat-body">
        <p className="user-status">
          {user ? `Logged in as: ${user.username}` : "Not logged in"}
        </p>
        <div className="chat-messages">
          {messages.length === 0 ? (
            <p className="no-messages">No messages yet...</p>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className="chat-message">
                <img
                  src={msg.profilePicture || "/default-avatar.png"}
                  alt="Profile"
                  className="chat-profile-pic"
                />
                <strong>{msg.username || "Unknown"}:</strong> {msg.content}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

      </div>
      <div className="chat-footer">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage();
            }
          }}
          disabled={!user}
          className="chat-input"
        />
        <button
          onClick={sendMessage}
          disabled={!message.trim() || !user}
          className="chat-send"
        >
          Send
        </button>
        <button onClick={() => navigate("/logout")} className="chat-logout">
          Logout
        </button>
      </div>
    </div>
  );
};

export default Chat;
