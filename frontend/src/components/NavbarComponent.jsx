import React from "react";
import { Navbar, Nav, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { getUser } from "../utils/auth";

const NavbarComponent = () => {
  const user = getUser();

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove token
    window.location.href = "/login";  // Redirect to login page
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
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
