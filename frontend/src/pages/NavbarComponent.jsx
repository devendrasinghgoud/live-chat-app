import React, { useState, useEffect } from "react";
import { Navbar, Nav, Dropdown, Container, Badge } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiLogOut, FiUser, FiSettings, FiMessageSquare, FiBell } from "react-icons/fi";
import "../styles/Chat.css"; // We'll create this CSS file

const NavbarComponent = () => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [notifications, setNotifications] = useState(3); // Mock notification count
  const navigate = useNavigate();
  const location = useLocation();

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
    <Navbar expand="lg" fixed="top" className="app-navbar ">
      <Container fluid>
        {/* Brand Logo */}
        <Navbar.Brand as={Link} to="/chat" className="navbar-brand">
          <span className="logo-icon">💬</span>
          <span className="logo-text">LiveChat</span>
          <span className="logo-badge">Pro</span>
        </Navbar.Brand>

        {/* Mobile Toggle */}
        <Navbar.Toggle aria-controls="navbar-nav" className="navbar-toggle">
          <span className="toggle-icon"></span>
          <span className="toggle-icon"></span>
          <span className="toggle-icon"></span>
        </Navbar.Toggle>

        <Navbar.Collapse id="navbar-nav" className="justify-content-end">
          <Nav className="align-items-center">
            {user ? (
              <>
                {/* Notification Dropdown */}
                <Dropdown as={Nav.Item} className="notification-dropdown">
                  <Dropdown.Toggle as={Nav.Link} className="nav-link-icon">
                    <FiBell size={20} />
                    {notifications > 0 && (
                      <Badge pill bg="danger" className="notification-badge">
                        {notifications}
                      </Badge>
                    )}
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="end" className="dropdown-menu-notifications">
                    <Dropdown.Header>Notifications ({notifications})</Dropdown.Header>
                    <Dropdown.Divider />
                    <Dropdown.Item className="notification-item">
                      <div className="notification-content">
                        <div className="notification-title">New message</div>
                        <div className="notification-text">You have 3 unread messages</div>
                        <div className="notification-time">2 min ago</div>
                      </div>
                    </Dropdown.Item>
                    <Dropdown.Item className="notification-item">
                      <div className="notification-content">
                        <div className="notification-title">System update</div>
                        <div className="notification-text">New features available</div>
                        <div className="notification-time">1 hour ago</div>
                      </div>
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item className="text-center text-primary">
                      View all notifications
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>

                {/* User Profile Dropdown */}
                <Dropdown as={Nav.Item} className="profile-dropdown">
                  <Dropdown.Toggle as={Nav.Link} className="nav-link-profile">
                    <div className="profile-avatar large">
                      <img
                        src={
                          user?.profilePicture && user.profilePicture.trim() !== ""
                            ? `http://localhost:5000${user.profilePicture}`
                            : "http://localhost:5000/uploads/default-avatar.png"
                        }
                        alt="Profile"
                        onError={(e) => (e.target.src = "http://localhost:5000/uploads/default-avatar.png")}
                      />
                      <span className="profile-status online"></span>
                    </div>
                    <span className="profile-name">{user.username}</span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="end" className="dropdown-menu-profile">
                    <Dropdown.Header className="dropdown-header">
                      <div className="profile-avatar large">
                        <img
                          src={
                            user?.profilePicture && user.profilePicture.trim() !== ""
                              ? `http://localhost:5000${user.profilePicture}`
                              : "http://localhost:5000/uploads/default-avatar.png"
                          }
                          alt="Profile"
                          onError={(e) => (e.target.src = "http://localhost:5000/uploads/default-avatar.png")}
                        />
                      </div>
                      <div className="profile-info">
                        <div className="profile-name">{user.username}</div>
                        <div className="profile-email">{user.email || "user@example.com"}</div>
                      </div>
                    </Dropdown.Header>
                    <Dropdown.Divider />
                    <Dropdown.Item as={Link} to="/profile" className="dropdown-item">
                      <FiUser className="dropdown-icon" />
                      My Profile
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/settings" className="dropdown-item">
                      <FiSettings className="dropdown-icon" />
                      Settings
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item 
                      onClick={handleLogout} 
                      className="dropdown-item text-danger"
                    >
                      <FiLogOut className="dropdown-icon" />
                      Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <div className="auth-buttons">
                <Link 
                  to="/login" 
                  className={`auth-button ${location.pathname === "/login" ? "active" : ""}`}
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className={`auth-button primary ${location.pathname === "/signup" ? "active" : ""}`}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;