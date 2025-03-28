import React, { useState, useEffect } from "react";
import { Navbar, Nav, Dropdown, Container } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

const NavbarComponent = () => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <Navbar bg="transparent" expand="lg" fixed="top" className="shadow-sm py-3">
      <Container>
        {/* Brand */}
        <Navbar.Brand as={Link} to="/chat" className="fw-bold fs-3 text-dark">
          LiveChat <span className="text-primary">⚡</span>
        </Navbar.Brand>

        {/* Navbar Toggle */}
        <Navbar.Toggle aria-controls="navbar-nav" className="border-0" />
        <Navbar.Collapse id="navbar-nav" className="justify-content-end">
          <Nav>
            {user ? (
              <Dropdown align="end">
                <Dropdown.Toggle
                  variant="light"
                  id="dropdown-profile"
                  className="border-0 d-flex align-items-center gap-2 text-dark shadow-none"
                >
                  {/* User Profile Picture */}
                  <img
                    src={
                      user?.profilePicture && user.profilePicture.trim() !== ""
                        ? `http://localhost:5000${user.profilePicture}`
                        : "http://localhost:5000/uploads/kakashi.jpg"
                    }
                    alt="Profile"
                    className="rounded-circle border border-dark"
                    width="40"
                    height="40"
                    onError={(e) => (e.target.src = "http://localhost:5000/uploads/kakashi.jpg")}
                  />
                  <span className="fw-bold">Hi, {user.username}</span>
                </Dropdown.Toggle>

                {/* Dropdown Menu */}
                <Dropdown.Menu className="dropdown-menu-end">
                  <Dropdown.Item as={Link} to="/profile">View Profile</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item as="button" onClick={handleLogout} className="text-danger">
                    Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-outline-dark px-4">Login</Link>
                <Link to="/signup" className="btn btn-primary px-4">Signup</Link>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;