import React, { useState, useEffect } from "react";
import { Container, Card, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append("profilePicture", selectedFile);

    try {
      const response = await fetch("http://localhost:5000/api/upload-profile", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        const updatedUser = { ...user, profilePicture: data.profilePicture };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } else {
        console.error("Upload failed:", data.message);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
      <Card className="shadow-lg p-4 text-center" style={{ width: "400px" }}>
        <Card.Img
          variant="top"
          src={
            user?.profilePicture
              ? `http://localhost:5000${user.profilePicture}`
              : "http://localhost:5000/uploads/kakashi.jpg"
          }
          alt="Profile"
          className="rounded-circle mx-auto d-block border border-primary"
          style={{ width: "120px", height: "120px", objectFit: "cover" }}
          onError={(e) => (e.target.src = "http://localhost:5000/uploads/kakashi.jpg")}
        />
        <Card.Body>
          <div className="text-start">
            <p><strong class="text-primary">Name:</strong> {user?.username || "Guest"}</p>
            <p><strong class="text-primary">Email:</strong> {user?.email || "No email provided"}</p>
          </div>

          <Form.Group className="mb-3">
            <Form.Label><strong class="text-primary">Upload New Profile Picture:</strong></Form.Label>
            <Form.Control type="file" onChange={handleFileChange} />
          </Form.Group>

          <Button variant="primary" className="w-100" onClick={handleUpload} disabled={!selectedFile}>
            Upload Profile Picture
          </Button>

          <Button variant="danger" className="w-100 mt-2" onClick={() => navigate("/chat")}>
            Back to Chat
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};
 
export default Profile;


