import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import { Container, Row, Col, Card, Form, Button, ListGroup } from "react-bootstrap";
import { jwtDecode } from "jwt-decode";  // ✅ Correct

const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user info from token
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const decodedUser = jwtDecode(token);
    setUser(decodedUser);

    // Listen for new messages
    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("message");
    };
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
    <Container fluid as="main" className="mt-4">
      <Row className="justify-content-center">
        <Col xs={12} md={8} lg={6}>
          <Card as="section" className="shadow-lg">
            <Card.Header as="header" className="bg-primary text-white text-center">
              <h1 className="mb-0">Live Chat</h1>
            </Card.Header>
            <Card.Body as="section">
              <p className="text-center text-muted">
                {user ? `Logged in as: ${user.username}` : "Not logged in"}
              </p>

              <ListGroup as="section" variant="flush" style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #ddd", borderRadius: "4px" }}>
                {messages.length === 0 ? (
                  <p className="text-center text-muted mt-3">No messages yet...</p>
                ) : (
                  messages.map((msg, index) => (
                    <ListGroup.Item key={index}>
                      <strong>{msg.user}:</strong> {msg.text}
                    </ListGroup.Item>
                  ))
                )}
                <div ref={messagesEndRef} />
              </ListGroup>
            </Card.Body>
            <Card.Footer as="footer">
              <Form className="d-flex gap-2">
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
                  disabled={!user}
                />
                <Button variant="primary" onClick={sendMessage} disabled={!message.trim() || !user}>
                  Send
                </Button>
              </Form>
              <Button variant="danger" className="mt-3 w-100" onClick={() => navigate("/logout")}>
                Logout
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Chat;