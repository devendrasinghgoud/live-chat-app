import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import { jwtDecode } from "jwt-decode"; // Corrected import for jwtDecode

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
      console.log("Decoded User:", decodedUser); // Debugging output

      // Check if userId and username are both present in the token
      if (!decodedUser || !decodedUser.username || !decodedUser.userId) {
        console.log("Invalid token structure or missing username/userId.");
        navigate("/login");
        return;
      }

      // Ensure the token is not expired
      if (decodedUser.exp * 1000 < Date.now()) {
        console.log("Token has expired.");
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (message.trim() && user) {
      const chatMessage = { user: user.username, text: message };
      socket.emit("message", chatMessage);
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
                <strong>{msg.user}:</strong> {msg.text}
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
        <button onClick={sendMessage} disabled={!message.trim() || !user} className="chat-send">
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
