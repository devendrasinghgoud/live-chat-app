import React from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

const Navigation = () => {
  const isAuthenticated = false; // Replace with actual authentication logic

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          LiveChat
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" className="mx-2">Home</Nav.Link>
            <Nav.Link as={Link} to="/profile" className="mx-2">Profile</Nav.Link>
          </Nav>
          <Nav className="d-flex">
            {isAuthenticated ? (
              <Button variant="outline-light" className="mx-2">Logout</Button>
            ) : (
              <Button variant="success" as={Link} to="/login" className="mx-2">Login</Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
