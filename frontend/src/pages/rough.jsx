import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import { jwtDecode } from "jwt-decode";
import "bootstrap/dist/css/bootstrap.min.css";

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
      if (!decodedUser?.userId || !decodedUser?.username || decodedUser.exp * 1000 < Date.now()) {
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
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });
    return () => socket.off("message");
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (message.trim() && user) {
      const chatRoomId = "65d7f1e99e0a5f2b12345678";
      const chatMessage = {
        sender: user.userId,
        username: user.username,
        content: message,
        chatRoom: chatRoomId,
      };
      socket.emit("message", chatMessage, (serverMessage) => {
        if (serverMessage) {
          setMessages((prev) => [...prev, serverMessage]);
        }
      });
      setMessage("");
    }
  };

  return (
    <div className="container py-3">
      <div className="card shadow-lg chat-card">
        <div className="card-header bg-primary text-white text-center">
          <h3>Live Chat</h3>
        </div>
        <div className="card-body chat-body">
          <p className="text-muted text-center">
            {user ? `Logged in as: ${user.username}` : "Not logged in"}
          </p>
          <div className="chat-messages overflow-auto p-3" style={{ height: "400px" }}>
            {messages.length === 0 ? (
              <p className="text-center text-muted">No messages yet...</p>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`d-flex mb-3 ${msg.sender === user.userId ? "justify-content-end" : ""}`}>
                  <div className="d-flex align-items-center">
                    <img
                      src={
                        msg.sender === user.userId
                          ? (user.profilePicture && user.profilePicture.trim() !== "" 
                              ? `http://localhost:5000${user.profilePicture}` 
                              : `http://localhost:5000/uploads/kakashi.jpg`)
                          : (msg.profilePicture && msg.profilePicture.trim() !== "" 
                              ? `http://localhost:5000${msg.profilePicture}` 
                              : `http://localhost:5000/uploads/kakashi.jpg`)
                      }
                      alt="Profile"
                      className="rounded-circle me-2"
                      style={{ width: "40px", height: "40px", objectFit: "cover" }}
                      onError={(e) => (e.target.src = `http://localhost:5000/uploads/kakashi.jpg`)} 
                    />
                    <div
                      className={`p-2 rounded ${msg.sender === user.userId ? "bg-primary text-white" : "bg-light text-dark"}`}
                      style={{ maxWidth: "75%" }}
                    >
                      <strong>{msg.username || "Unknown"}</strong>
                      <p className="mb-0">{msg.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="card-footer d-flex">
          <input
            type="text"
            className="form-control me-2"
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
          />
          <button
            className="btn btn-primary me-2"
            onClick={sendMessage}
            disabled={!message.trim() || !user}
          >
            Send
          </button>
          {/*<button className="btn btn-danger" onClick={() => navigate("/logout")}>
            Logout
          </button>*/}
        </div>
      </div>
    </div>
  );
};

export default Chat;
