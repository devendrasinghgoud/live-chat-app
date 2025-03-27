import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
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
      fetchMessages();
    } catch (error) {
      console.error("Error decoding token:", error);
      navigate("/login");
    }
  }, [navigate]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/messages", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    socket.on("message", (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });
    return () => socket.off("message");
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || !user) return;

    if (editingMessage) {
      try {
        await axios.put(
          `http://localhost:5000/api/messages/${editingMessage._id}`,
          { content: message },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === editingMessage._id ? { ...msg, content: message } : msg
          )
        );
        setEditingMessage(null);
      } catch (error) {
        console.error("Error editing message:", error);
      }
    } else {
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
    }
    setMessage("");
  };

  const deleteMessage = async (messageId) => {
    try {
      await axios.delete(`http://localhost:5000/api/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
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
              messages.map((msg) => (
                <div key={msg._id} className={`d-flex mb-3 ${msg.sender === user.userId ? "justify-content-end" : ""}`}>
                  <div className="d-flex align-items-center">
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>{msg.username || "Unknown User"}</Tooltip>}
                    >
                      <img
                        src={msg.profilePicture ? `http://localhost:5000${msg.profilePicture}` : `http://localhost:5000/uploads/kakashi.jpg`}
                        alt="Profile"
                        className="rounded-circle me-2"
                        style={{ width: "40px", height: "40px", objectFit: "cover" }}
                        onError={(e) => (e.target.src = `http://localhost:5000/uploads/kakashi.jpg`)}
                      />
                    </OverlayTrigger>
                    <div
                      className={`p-2 rounded ${msg.sender === user.userId ? "bg-primary text-white" : "bg-light text-dark"}`}
                      style={{ maxWidth: "75%" }}
                    >
                      <strong>{msg.username || "Unknown"}</strong>
                      <p className="mb-0">{msg.content}</p>
                      {msg.sender === user.userId && (
                        <div className="mt-1 d-flex justify-content-end">
                          <button
                            className="btn btn-sm btn-warning me-2"
                            onClick={() => {
                              setEditingMessage(msg);
                              setMessage(msg.content);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => deleteMessage(msg._id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
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
            className={`btn ${editingMessage ? "btn-success" : "btn-primary"} me-2`}
            onClick={sendMessage}
            disabled={!message.trim() || !user}
          >
            {editingMessage ? "Update" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
