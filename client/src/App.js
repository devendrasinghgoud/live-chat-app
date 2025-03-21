import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import { loginUser } from "./api"; // Import login function

const socket = io("http://localhost:5000"); // Connect to backend

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState(null); // Store logged-in user
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ✅ Fetch messages from MongoDB on page load
  useEffect(() => {
    axios.get("http://localhost:5000/messages").then((response) => {
      setMessages(response.data); // Load stored messages
    });

    socket.on("chatMessage", (msg) => {
      setMessages((prev) => [...prev, { text: msg }]); // Add new message in real-time
    });

    return () => socket.off("chatMessage");
  }, []);

  // ✅ Handle user login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userData = { email, password };
      const response = await loginUser(userData);
      setUser(response.user); // Store logged-in user
      localStorage.setItem("token", response.token); // Save token
    } catch (err) {
      setError(err.msg || "Invalid login");
    }
  };

  // ✅ Send a new message
  const sendMessage = () => {
    if (input.trim()) {
      socket.emit("chatMessage", input);
      setInput("");
    }
  };

  return (
    <div>
      <h1>Live Chat</h1>

      {!user ? (
        <div>
          <h2>Login</h2>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Login</button>
          </form>
        </div>
      ) : (
        <div>
          <h2>Welcome, {user.username}</h2>
          <div>
            {messages.map((msg, index) => (
              <p key={index}>{msg.text}</p>
            ))}
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      )}
    </div>
  );
}

export default App;


