import React, { useState, useEffect } from "react";
import { Navbar, Nav, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { getUser } from "../utils/auth";

const NavbarComponent = () => {
  const [user, setUser] = useState(getUser()); // Store user state
  const navigate = useNavigate(); // React Router navigation

  useEffect(() => {
    setUser(getUser()); // Update user state when component mounts
  }, []);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove token
    setUser(null); // Update state to reflect logout
    navigate("/login"); // Redirect to login page without full reload
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" fixed="top">
      <Navbar.Brand as={Link} to="/chat">LiveChat</Navbar.Brand>
      <Nav className="ms-auto">
        {user ? (
          <>
            <Navbar.Text className="me-3">👤 {user.name}</Navbar.Text>
            <Button variant="outline-light" onClick={handleLogout}>Logout</Button>
          </>
        ) : (
          <>
            <Nav.Link as={Link} to="/login">Login</Nav.Link>
            <Nav.Link as={Link} to="/signup">Signup</Nav.Link>
          </>
        )}
      </Nav>
    </Navbar>
  );
};

export default NavbarComponent;
