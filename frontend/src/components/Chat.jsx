import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import { Container, Row, Col, Card, Form, Button, ListGroup } from "react-bootstrap";
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
      setUser(decodedUser);
    } catch (error) {
      console.error("Invalid token:", error);
      navigate("/login");
    }

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
    <Container fluid className="vh-100 d-flex align-items-center justify-content-center bg-dark">
      <Row className="w-100">
        <Col xs={12} md={8} lg={6} className="mx-auto">
          <Card className="shadow-lg d-flex flex-column h-100">
            <Card.Header className="bg-primary text-white text-center">
              <h2 className="mb-0">Live Chat</h2>
            </Card.Header>

            <Card.Body className="d-flex flex-column flex-grow-1 overflow-hidden">
              <p className="text-center text-muted">
                {user ? `Logged in as: ${user.username}` : "Not logged in"}
              </p>

              <ListGroup
                variant="flush"
                className="flex-grow-1 overflow-auto"
                style={{ maxHeight: "400px" }} 
              >
                {messages.length === 0 ? (
                  <p className="text-center text-muted mt-3">No messages yet...</p>
                ) : (
                  messages.map((msg, index) => (
                    <ListGroup.Item key={index} className="border-0">
                      <strong className="text-primary">{msg.user}:</strong> {msg.text}
                    </ListGroup.Item>
                  ))
                )}
                <div ref={messagesEndRef} />
              </ListGroup>
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
                  disabled={!user}
                  className="flex-grow-1"
                />
                <Button
                  variant="primary"
                  onClick={sendMessage}
                  disabled={!message.trim() || !user}
                  className="ms-2"
                >
                  Send
                </Button>
              </Form>

              <Button
                variant="danger"
                className="mt-3 w-100"
                onClick={() => navigate("/logout")}
              >
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
