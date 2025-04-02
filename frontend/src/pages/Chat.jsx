import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import { Container, Row, Col, Card, Form, Button, ListGroup, Spinner, Badge } from "react-bootstrap";
import { jwtDecode } from "jwt-decode";
import { FiLogOut, FiSend, FiUser, FiMessageSquare } from "react-icons/fi";
import "../styles/Chat.css"; // We'll create this CSS file

const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const decodedUser = jwtDecode(token);
      setUser(decodedUser);
    } catch (error) {
      console.error("Invalid token:", error);
      navigate("/login");
    }

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => {
        const updatedMessages = [...prev, msg];
        localStorage.setItem(`messages_${selectedUser?._id}`, JSON.stringify(updatedMessages));
        
        // Update unread counts if not the active chat
        if (msg.sender._id !== user._id && (!selectedUser || msg.sender._id !== selectedUser._id)) {
          setUnreadCounts(prev => ({
            ...prev,
            [msg.sender._id]: (prev[msg.sender._id] || 0) + 1
          }));
        }
        
        return updatedMessages;
      });
    });

    return () => socket.off("receiveMessage");
  }, [navigate, selectedUser, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/users");
        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
        setUsers(data);
        
        // Initialize unread counts
        const counts = {};
        data.forEach(u => counts[u._id] = 0);
        setUnreadCounts(counts);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();

    const storedUser = localStorage.getItem("selectedUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      selectUser(parsedUser, true);
    }
  }, []);

  const selectUser = async (chatUser, isReload = false) => {
    if (!chatUser) return;

    setSelectedUser(chatUser);
    setLoadingMessages(true);

    // Reset unread count when selecting a user
    setUnreadCounts(prev => ({
      ...prev,
      [chatUser._id]: 0
    }));

    localStorage.setItem("selectedUser", JSON.stringify(chatUser));
    socket.emit("joinRoom", { chatRoom: chatUser._id });

    try {
      const response = await fetch(`http://localhost:5000/api/messages/${user._id}/${chatUser._id}`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      const chatHistory = await response.json();
      localStorage.setItem(`messages_${chatUser._id}`, JSON.stringify(chatHistory));
      setMessages(chatHistory);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    } finally {
      setLoadingMessages(false);
    }

    const storedMessages = localStorage.getItem(`messages_${chatUser._id}`);
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
  };

  const sendMessage = () => {
    if (!message.trim() || !user || !selectedUser) return;

    const chatMessage = {
      sender: user._id,
      content: message,
      chatRoom: selectedUser._id,
    };

    socket.emit("sendMessage", chatMessage);
    setMessages((prev) => {
      const updatedMessages = [...prev, { 
        sender: { _id: user._id, username: user.username }, 
        content: message,
        timestamp: new Date().toISOString()
      }];
      localStorage.setItem(`messages_${selectedUser._id}`, JSON.stringify(updatedMessages));
      return updatedMessages;
    });
    setMessage("");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("selectedUser");
    users.forEach((u) => localStorage.removeItem(`messages_${u._id}`));
    socket.emit("logout", user._id); 
    navigate("/login");
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-app mt-5">
      {/* Sidebar */}
      <div className="sidebar mt-5">
        <div className="sidebar-header">
          <div className="user-info">
            <div className="avatar">
              <FiUser size={24} />
            </div>
            <div className="user-details">
              <h5>{user?.username || "User"}</h5>
              <span className="status online">Online</span>
            </div>
          </div>
          <Button variant="link" onClick={logout} className="logout-btn">
            <FiLogOut size={20} />
          </Button>
        </div>

        <div className="search-box">
          <Form.Control 
            type="text" 
            placeholder="Search users..." 
            className="search-input"
          />
        </div>

        <div className="users-list">
          <h6 className="section-title">Active Conversations</h6>
          {loadingUsers ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted mt-3">No users found.</p>
          ) : (
            users.map((u) => (
              <div 
                key={u._id}
                className={`user-item ${selectedUser?._id === u._id ? "active" : ""}`}
                onClick={() => selectUser(u)}
              >
                <div className="avatar">
                  <FiUser size={20} />
                </div>
                <div className="user-content">
                  <div className="name">{u.username}</div>
                  <div className="last-message">Last message preview...</div>
                </div>
                {unreadCounts[u._id] > 0 && (
                  <Badge pill bg="primary" className="unread-count">
                    {unreadCounts[u._id]}
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area mt-5">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="chat-user-info">
                <div className="avatar">
                  <FiUser size={24} />
                </div>
                <div>
                  <h5>{selectedUser.username}</h5>
                  <span className="status online">Online</span>
                </div>
              </div>
            </div>

            <div className="messages-container">
              {loadingMessages ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="empty-chat">
                  <FiMessageSquare size={48} className="mb-3" />
                  <h5>No messages yet</h5>
                  <p>Start the conversation with {selectedUser.username}</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`message ${msg.sender?._id === user?._id ? "sent" : "received"}`}
                  >
                    <div className="message-content">
                      {msg.content}
                      <div className="message-time">{formatTime(msg.timestamp)}</div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input">
              <Form.Control
                as="textarea"
                rows={1}
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="message-textarea"
              />
              <Button
                variant="primary"
                onClick={sendMessage}
                disabled={!message.trim()}
                className="send-button"
              >
                <FiSend size={20} />
              </Button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="empty-chat">
              <FiMessageSquare size={64} className="mb-4" />
              <h4>Welcome to your messages</h4>
              <p>Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;