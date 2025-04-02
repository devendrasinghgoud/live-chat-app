import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
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
        await axios.put(`http://localhost:5000/api/messages/${editingMessage._id}`, { content: message }, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
        setMessages((prevMessages) => prevMessages.map((msg) => (msg._id === editingMessage._id ? { ...msg, content: message } : msg)));
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
        createdAt: new Date().toISOString(), // Adding timestamp
      };
      socket.emit("message", chatMessage, (serverMessage) => {
        if (serverMessage) {
          setMessages((prev) => [...prev, serverMessage]);
        }
      });
    }
    setMessage("");
  };

  const confirmDeleteMessage = (messageId) => {
    setMessageToDelete(messageId);
    setShowModal(true);
  };

  const deleteMessage = async () => {
    if (!messageToDelete) return;
    try {
      await axios.delete(`http://localhost:5000/api/messages/${messageToDelete}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messageToDelete));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
    setShowModal(false);
  };

  return (
    <div className="container py-3">
      <div className="card shadow-lg chat-card">
        <div className="card-header bg-primary text-white text-center">
          <h3>Live Chat</h3>
        </div>
        <div className="card-body chat-body">
          <div className="chat-messages overflow-auto p-3" style={{ height: "400px" }}>
            {messages.map((msg) => (
              <div key={msg._id} className={`d-flex mb-3 ${msg.sender === user.userId ? "justify-content-end" : ""}`}>
                <div className="d-flex align-items-center">
                  <OverlayTrigger placement="top" overlay={<Tooltip>{msg.username || "Unknown User"}</Tooltip>}>
                    <img src={msg.profilePicture || "http://localhost:5000/uploads/kakashi.jpg"} alt="Profile" className="rounded-circle me-2" style={{ width: "40px", height: "40px" }} onError={(e) => (e.target.src = "http://localhost:5000/uploads/kakashi.jpg")} />
                  </OverlayTrigger>
                  <div className={`p-2 rounded ${msg.sender === user.userId ? "bg-primary text-white" : "bg-light text-dark"}`} style={{ maxWidth: "75%" }}>
                    <strong>{msg.username || "Unknown"}</strong>
                    <p className="mb-0">{msg.content}</p>
                    <span className="badge bg-secondary mt-1">
                      {new Date(msg.createdAt).toLocaleString()} {/* Display formatted timestamp */}
                    </span>
                    {msg.sender === user.userId && (
                      <div className="mt-1 d-flex justify-content-end">
                        <a href="#" className="text-warning me-2" onClick={(e) => { e.preventDefault(); setEditingMessage(msg); setMessage(msg.content); }}>Edit</a>
                        <a href="#" className="text-danger" onClick={(e) => { e.preventDefault(); confirmDeleteMessage(msg._id); }}>Delete</a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="card-footer d-flex">
          <input type="text" className="form-control me-2" placeholder="Type a message..." value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }} disabled={!user} />
          <button className={`btn ${editingMessage ? "btn-success" : "btn-primary"} me-2`} onClick={sendMessage} disabled={!message.trim() || !user}>{editingMessage ? "Update" : "Send"}</button>
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this message?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={deleteMessage}>Delete</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Chat;




import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import { Container, Row, Col, Card, Form, Button, ListGroup, Spinner } from "react-bootstrap";
import { jwtDecode } from "jwt-decode";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
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
      setUser(decodedUser);
    } catch (error) {
      console.error("Invalid token:", error);
      navigate("/login");
    }

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => {
        const updatedMessages = [...prev, msg];
        localStorage.setItem(`messages_${selectedUser?._id}`, JSON.stringify(updatedMessages));
        return updatedMessages;
      });
    });

    return () => socket.off("receiveMessage");
  }, [navigate, selectedUser]);

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
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();

    // Load selected user from localStorage (if available)
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

    // Store selected user in localStorage
    localStorage.setItem("selectedUser", JSON.stringify(chatUser));

    socket.emit("joinRoom", { chatRoom: chatUser._id });

    try {
      const response = await fetch(`http://localhost:5000/api/messages/${user._id}/${chatUser._id}`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      const chatHistory = await response.json();
      
      // Store messages in localStorage
      localStorage.setItem(`messages_${chatUser._id}`, JSON.stringify(chatHistory));
      setMessages(chatHistory);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    } finally {
      setLoadingMessages(false);
    }

    // Load messages from localStorage if available
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
      const updatedMessages = [...prev, { sender: { username: user.username }, content: message }];
      localStorage.setItem(`messages_${selectedUser._id}`, JSON.stringify(updatedMessages));
      return updatedMessages;
    });
    setMessage("");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("selectedUser");

    // Clear stored messages
    users.forEach((u) => localStorage.removeItem(`messages_${u._id}`));

    socket.emit("logout", user._id); 
    navigate("/login");
  };

  return (
    <Container fluid className="vh-100 d-flex align-items-center justify-content-center bg-dark">
      <Row className="w-100 h-100">
        {/* Left Sidebar - Users List */}
        <Col md={4} className="border-end bg-light overflow-auto" style={{ maxHeight: "100vh" }}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-primary text-white text-center">Users</Card.Header>
            <ListGroup variant="flush">
              {loadingUsers ? (
                <Spinner animation="border" className="m-auto my-3" />
              ) : users.length === 0 ? (
                <p className="text-center text-muted mt-3">No users found.</p>
              ) : (
                users.map((u) => (
                  <ListGroup.Item
                    key={u._id}
                    onClick={() => selectUser(u)}
                    className={`cursor-pointer ${selectedUser && selectedUser._id === u._id ? "bg-info" : ""}`}
                    style={{ cursor: "pointer" }}
                  >
                    {u.username}
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          </Card>
        </Col>

        {/* Right Side - Chat Box */}
        <Col md={8} className="d-flex flex-column h-100">
          {selectedUser ? (
            <Card className="h-100 shadow-lg d-flex flex-column">
              <Card.Header className="bg-primary text-white text-center">
                Chat with {selectedUser.username}
              </Card.Header>

              <Card.Body className="flex-grow-1 overflow-auto" style={{ maxHeight: "400px" }}>
                {loadingMessages ? (
                  <Spinner animation="border" className="m-auto d-block" />
                ) : messages.length === 0 ? (
                  <p className="text-center text-muted mt-3">No messages yet...</p>
                ) : (
                  messages.map((msg, index) => (
                    <ListGroup.Item key={index} className="border-0">
                      <strong className="text-primary">{msg.sender?.username || "Unknown"}:</strong> {msg.content}
                    </ListGroup.Item>
                  ))
                )}
                <div ref={messagesEndRef} />
              </Card.Body>

              <Card.Footer className="bg-white">
                <Form className="d-flex">
                  <Form.Control
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
                    disabled={!selectedUser}
                    className="flex-grow-1"
                  />
                  <Button
                    variant="primary"
                    onClick={sendMessage}
                    disabled={!message.trim() || !selectedUser}
                    className="ms-2"
                  >
                    Send
                  </Button>
                </Form>

                <Button
                  variant="danger"
                  className="mt-3 w-100"
                  onClick={logout}
                >
                  Logout
                </Button>
              </Card.Footer>
            </Card>
          ) : (
            <Card className="h-100 shadow-lg d-flex flex-column justify-content-center align-items-center">
              <p className="text-muted">Select a user to start chatting.</p>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Chat;
