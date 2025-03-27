import React, { useState } from "react";
import { Form, Button, Container, Image, Alert, Card, Row, Col, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaPhone, FaLock, FaImage, FaUserTag } from "react-icons/fa";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    mobile: "",
    password: "",
    profilePicture: null,
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profilePicture: file });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("username", formData.username);
    data.append("email", formData.email);
    data.append("mobile", formData.mobile);
    data.append("password", formData.password);
    if (formData.profilePicture) {
      data.append("profilePicture", formData.profilePicture);
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        body: data,
      });

      const result = await response.json();
      setLoading(false);

      if (response.ok) {
        alert("Signup Successful! Redirecting to login...");
        setFormData({
          name: "",
          username: "",
          email: "",
          mobile: "",
          password: "",
          profilePicture: null,
        });
        setPreviewImage(null);
        navigate("/login");
      } else {
        setError(result.message || "Signup Failed");
      }
    } catch (error) {
      setLoading(false);
      setError("Something went wrong! Please try again.");
    }
  };

  return (
    <section className="vh-100" style={{ backgroundColor: "#eee" }}>
      <Container className="h-100 d-flex align-items-center justify-content-center">
        <Row className="w-100">
          <Col lg={10} xl={9} className="mx-auto">
            <Card className="text-black" style={{ borderRadius: "25px" }}>
              <Card.Body className="p-md-5">
                <Row className="justify-content-center">
                  <Col md={10} lg={6} xl={5} className="order-2 order-lg-1">
                    <h2 className="text-center fw-bold mb-4">Sign Up</h2>

                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={handleSubmit} encType="multipart/form-data">
                      <InputGroup className="mb-3">
                        <InputGroup.Text><FaUser /></InputGroup.Text>
                        <Form.Control type="text" name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} required />
                      </InputGroup>

                      <InputGroup className="mb-3">
                        <InputGroup.Text><FaUserTag /></InputGroup.Text>
                        <Form.Control type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
                      </InputGroup>

                      <InputGroup className="mb-3">
                        <InputGroup.Text><FaEnvelope /></InputGroup.Text>
                        <Form.Control type="email" name="email" placeholder="Your Email" value={formData.email} onChange={handleChange} required />
                      </InputGroup>

                      <InputGroup className="mb-3">
                        <InputGroup.Text><FaPhone /></InputGroup.Text>
                        <Form.Control type="text" name="mobile" placeholder="Mobile Number" value={formData.mobile} onChange={handleChange} required />
                      </InputGroup>

                      <InputGroup className="mb-3">
                        <InputGroup.Text><FaLock /></InputGroup.Text>
                        <Form.Control type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                      </InputGroup>

                      <InputGroup className="mb-3">
                        <InputGroup.Text><FaImage /></InputGroup.Text>
                        <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
                      </InputGroup>

                      {previewImage && (
                        <div className="text-center mb-3">
                          <Image src={previewImage} alt="Preview" className="rounded-circle" width="100" height="100" />
                        </div>
                      )}

                      <div className="text-center mt-3">
                        <p>Already have an account? <Button variant="link" onClick={() => navigate("/login")}>Login</Button></p>
                      </div>

                      <div className="d-flex justify-content-center">
                        <Button variant="primary" type="submit" size="lg" disabled={loading}>
                          {loading ? "Signing Up..." : "Sign Up"}
                        </Button>
                      </div>
                    </Form>
                  </Col>

                  <Col md={10} lg={6} xl={7} className="d-flex align-items-center order-1 order-lg-2">
                    <Image
                      src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-registration/draw1.webp"
                      className="img-fluid"
                      alt="Signup Illustration"
                    />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Signup;
