import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import { Container, Form, Button, Spinner, Badge } from "react-bootstrap";
import { jwtDecode } from "jwt-decode";
import { FiLogOut, FiSend, FiUser } from "react-icons/fi";
import "../styles/Chat.css";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);
  const userRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
    try {
      userRef.current = jwtDecode(token);
    } catch (error) {
      console.error("Invalid token:", error);
      return navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/users");
        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
        setUsers(data);
        setUnreadCounts(data.reduce((acc, u) => ({ ...acc, [u._id]: 0 }), {}));
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleReceiveMessage = (msg) => {
      setMessages((prev) => {
        const updatedMessages = [...prev, msg];
        localStorage.setItem(`messages_${selectedUser?._id}`, JSON.stringify(updatedMessages));
        return updatedMessages;
      });
    };
    socket.on("receiveMessage", handleReceiveMessage);
    return () => socket.off("receiveMessage", handleReceiveMessage);
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectUser = async (chatUser) => {
    if (!chatUser) return;
    setSelectedUser(chatUser);
    setLoadingMessages(true);
    setUnreadCounts((prev) => ({ ...prev, [chatUser._id]: 0 }));

    const storedMessages = localStorage.getItem(`messages_${chatUser._id}`);
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    } else {
      try {
        const response = await fetch(
          `http://localhost:5000/api/messages/${userRef.current._id}/${chatUser._id}`
        );
        if (!response.ok) throw new Error("Failed to fetch messages");
        const chatHistory = await response.json();
        localStorage.setItem(`messages_${chatUser._id}`, JSON.stringify(chatHistory));
        setMessages(chatHistory);
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    }
    setLoadingMessages(false);
  };

  const sendMessage = () => {
    if (!message.trim() || !userRef.current || !selectedUser) return;
    const chatMessage = {
      sender: userRef.current._id,
      content: message,
      chatRoom: selectedUser._id,
    };
    socket.emit("sendMessage", chatMessage);
    setMessages((prev) => {
      const updatedMessages = [...prev, { sender: { _id: userRef.current._id, username: userRef.current.username }, content: message, timestamp: new Date().toISOString() }];
      localStorage.setItem(`messages_${selectedUser._id}`, JSON.stringify(updatedMessages));
      return updatedMessages;
    });
    setMessage("");
  };

  const logout = () => {
    localStorage.clear();
    socket.emit("logout", userRef.current._id);
    navigate("/login");
  };

  return (
    <div className="chat-app m-5">
      <div className="sidebar mt-5">
        <div className="sidebar-header">
          <div className="user-info">
            <FiUser size={24} />
            <h5>{userRef.current?.username || "User"}</h5>
          </div>
          <Button variant="link" onClick={logout} className="logout-btn">
            <FiLogOut size={20} />
          </Button>
        </div>
        <div className="users-list">
          {loadingUsers ? <Spinner animation="border" variant="primary" /> : users.map((u) => (
            <div key={u._id} className={`user-item ${selectedUser?._id === u._id ? "active" : ""}`} onClick={() => selectUser(u)}>
              <FiUser size={20} />
              <div className="user-content">
                <div className="name">{u.username}</div>
              </div>
              {unreadCounts[u._id] > 0 && <Badge pill bg="primary">{unreadCounts[u._id]}</Badge>}
            </div>
          ))}
        </div>
      </div>
      <div className="chat-area mt-5">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <FiUser size={24} />
              <h5>{selectedUser.username}</h5>
            </div>
            <div className="messages-container">
              {loadingMessages ? <Spinner animation="border" variant="primary" /> : messages.map((msg, index) => (
                <div key={index} className={`message ${msg.sender?._id === userRef.current?._id ? "sent" : "received"}`}>
                  <div className="message-content">{msg.content}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="message-input">
              <Form.Control as="textarea" placeholder="Type a message..." value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) sendMessage(); }} />
              <Button variant="primary" onClick={sendMessage} disabled={!message.trim()}><FiSend size={20} /></Button>
            </div>
          </>
        ) : <div>Select a conversation to start chatting</div>}
      </div>
    </div>
  );
};

export default Chat;
