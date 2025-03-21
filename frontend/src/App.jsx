import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";  // ✅ Import Bootstrap
import NavbarComponent from "./pages/NavbarComponent";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PrivateRoute from "./utils/PrivateRoute";
import "./App.css";


const App = () => {
  return (
    <Router>
      <NavbarComponent /> {/* Always visible */}
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route
            path="/chat"
            element={
              <Container className="mt-4">
                <Row className="justify-content-center">
                  <Col md={8} lg={6}>
                    <Chat />
                  </Col>
                </Row>
              </Container>
            }
          />
        </Route>

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
