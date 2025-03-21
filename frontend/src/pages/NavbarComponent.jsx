import React, { useState, useEffect } from "react";
import { Navbar, Nav, Button, Dropdown } from "react-bootstrap";
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
    <Navbar bg="dark" variant="dark" expand="lg" fixed="top" className="px-3">
      <Navbar.Brand as={Link} to="/chat">LiveChat</Navbar.Brand>
      <Nav className="ms-auto">
        {user ? (
          <>
            {/* Profile Dropdown Button */}
            <Dropdown align="end">
              <Dropdown.Toggle variant="dark" id="dropdown-profile" className="border-0">
                <img
                  src={user.profilePicture || "https://via.placeholder.com/40"}
                  alt="Profile"
                  className="rounded-circle"
                  width="40"
                  height="40"
                />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item as={Link} to="/profile">View Profile</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
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
