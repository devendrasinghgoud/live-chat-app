import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import { Form, Button, Spinner, Badge, Modal, Image } from "react-bootstrap";
import { jwtDecode } from "jwt-decode";
import { FiLogOut, FiSend, FiUser, FiEdit, FiTrash2, FiPaperclip, FiCamera } from "react-icons/fi";
import moment from "moment";
import "../styles/Chat.css";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [editingMessage, setEditingMessage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const messagesEndRef = useRef(null);
  const userRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
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
      
      if (selectedUser?._id !== msg.sender._id) {
        setUnreadCounts(prev => ({
          ...prev,
          [msg.sender._id]: (prev[msg.sender._id] || 0) + 1
        }));
      }
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
    if ((!message.trim() && !attachment) || !userRef.current || !selectedUser) return;
    
    const chatMessage = {
      sender: userRef.current._id,
      content: message,
      chatRoom: selectedUser._id,
      attachment: attachment,
      timestamp: new Date().toISOString()
    };
    
    socket.emit("sendMessage", chatMessage);
    setMessages((prev) => {
      const newMessage = { 
        sender: { _id: userRef.current._id, username: userRef.current.username }, 
        content: message,
        attachment: attachment,
        timestamp: new Date().toISOString(),
        isOwn: true
      };
      const updatedMessages = [...prev, newMessage];
      localStorage.setItem(`messages_${selectedUser._id}`, JSON.stringify(updatedMessages));
      return updatedMessages;
    });
    
    setMessage("");
    setAttachment(null);
    setAttachmentPreview(null);
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setMessage(message.content);
    if (message.attachment) {
      setAttachment(message.attachment);
      setAttachmentPreview(message.attachment.type === 'image' ? message.attachment.url : null);
    }
  };

  const updateMessage = () => {
    if (!editingMessage) return;
    
    const updatedMessages = messages.map(msg => {
      if (msg.timestamp === editingMessage.timestamp && msg.sender._id === userRef.current._id) {
        return { ...msg, content: message, attachment: attachment };
      }
      return msg;
    });
    
    setMessages(updatedMessages);
    localStorage.setItem(`messages_${selectedUser._id}`, JSON.stringify(updatedMessages));
    setEditingMessage(null);
    setMessage("");
    setAttachment(null);
    setAttachmentPreview(null);
    
    socket.emit("updateMessage", {
      originalMessage: editingMessage,
      updatedContent: message,
      updatedAttachment: attachment,
      chatRoom: selectedUser._id
    });
  };

  const handleDeleteMessage = (message) => {
    setMessageToDelete(message);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    const filteredMessages = messages.filter(
      msg => !(msg.timestamp === messageToDelete.timestamp && msg.sender._id === userRef.current._id)
    );
    
    setMessages(filteredMessages);
    localStorage.setItem(`messages_${selectedUser._id}`, JSON.stringify(filteredMessages));
    setShowDeleteModal(false);
    
    socket.emit("deleteMessage", {
      message: messageToDelete,
      chatRoom: selectedUser._id
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const attachmentData = {
        type: file.type.split('/')[0],
        url: reader.result,
        name: file.name,
        size: file.size
      };
      setAttachment(attachmentData);
      
      if (file.type.startsWith('image')) {
        setAttachmentPreview(reader.result);
      }
    };
    
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const capturePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      const imageDataUrl = canvasRef.current.toDataURL('image/png');
      const attachmentData = {
        type: 'image',
        url: imageDataUrl,
        name: `photo_${Date.now()}.png`,
        size: imageDataUrl.length
      };
      
      setAttachment(attachmentData);
      setAttachmentPreview(imageDataUrl);
      setShowCameraModal(false);
      
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const logout = () => {
    localStorage.clear();
    socket.emit("logout", userRef.current._id);
    navigate("/login");
  };

  const renderAttachment = (attachment) => {
    if (!attachment) return null;
    
    switch (attachment.type) {
      case 'image':
        return <Image src={attachment.url} thumbnail className="message-attachment" />;
      case 'video':
        return (
          <video controls className="message-attachment">
            <source src={attachment.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        );
      case 'audio':
        return (
          <audio controls className="message-attachment">
            <source src={attachment.url} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        );
      default:
        return (
          <div className="file-attachment">
            <FiPaperclip size={20} />
            <span>{attachment.name}</span>
          </div>
        );
    }
  };

  const renderMessages = () => {
    if (loadingMessages) return <Spinner animation="border" variant="primary" />;
    
    let lastDate = null;
    return messages.map((msg, index) => {
      const currentDate = moment(msg.timestamp).format('YYYY-MM-DD');
      const showDate = currentDate !== lastDate;
      lastDate = currentDate;

      return (
        <React.Fragment key={index}>
          {showDate && (
            <div className="date-separator">
              <span>{moment(msg.timestamp).format('MMMM D, YYYY')}</span>
            </div>
          )}
          <div
            className={`message ${
              msg.sender?._id === userRef.current?._id ? "sent" : "received"
            }`}
          >
            <div className="message-content">
              {msg.content}
              {renderAttachment(msg.attachment)}
              <div className="message-time">
                {moment(msg.timestamp).format("h:mm A")}
              </div>
            </div>
            {msg.sender?._id === userRef.current?._id && (
              <div className="message-actions">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => handleEditMessage(msg)}
                >
                  <FiEdit size={14} />
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => handleDeleteMessage(msg)}
                >
                  <FiTrash2 size={14} />
                </Button>
              </div>
            )}
          </div>
        </React.Fragment>
      );
    });
  };

  return (
    <div className="chat-app">
      <div className="sidebar">
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
          {loadingUsers ? (
            <Spinner animation="border" variant="primary" />
          ) : (
            users.map((u) => (
              <div
                key={u._id}
                className={`user-item ${selectedUser?._id === u._id ? "active" : ""}`}
                onClick={() => selectUser(u)}
              >
                <FiUser size={20} />
                <div className="user-content">
                  <div className="name">{u.username}</div>
                </div>
                {unreadCounts[u._id] > 0 && (
                  <Badge pill bg="primary">
                    {unreadCounts[u._id]}
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      <div className="chat-area">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <FiUser size={24} />
              <h5>{selectedUser.username}</h5>
            </div>
            <div className="messages-container">
              {renderMessages()}
              <div ref={messagesEndRef} />
            </div>
            <div className="message-input">
              <div className="attachment-preview">
                {attachmentPreview && (
                  <>
                    <Image src={attachmentPreview} thumbnail width={50} />
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => {
                        setAttachment(null);
                        setAttachmentPreview(null);
                      }}
                    >
                      <FiTrash2 size={14} />
                    </Button>
                  </>
                )}
              </div>
              <div className="input-group">
                <div className="attachment-buttons">
                  <Button
                    variant="link"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <FiPaperclip size={20} />
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*, video/*, audio/*"
                    style={{ display: "none" }}
                  />
                  <Button
                    variant="link"
                    onClick={() => {
                      setShowCameraModal(true);
                      startCamera();
                    }}
                  >
                    <FiCamera size={20} />
                  </Button>
                </div>
                <Form.Control
                  as="textarea"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      editingMessage ? updateMessage() : sendMessage();
                    }
                  }}
                />
                <Button
                  variant="primary"
                  onClick={editingMessage ? updateMessage : sendMessage}
                  disabled={!message.trim() && !attachment}
                >
                  <FiSend size={20} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="select-conversation">
            Select a conversation to start chatting
          </div>
        )}
      </div>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Message</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this message?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showCameraModal} onHide={() => setShowCameraModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Take a Photo</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <video ref={videoRef} autoPlay playsInline className="camera-feed" />
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCameraModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={capturePhoto}>
            Capture
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Chat;