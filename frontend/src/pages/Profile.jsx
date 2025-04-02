import React, { useState, useEffect } from "react";
import { Container, Card, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiUpload, FiUser, FiMail } from "react-icons/fi";

const Profile = () => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/login");
    
    // Set initial preview URL
    if (user?.profilePicture) {
      setPreviewUrl(`http://localhost:5000${user.profilePicture}`);
    } else {
      setPreviewUrl("http://localhost:5000/uploads/default-avatar.png");
    }
  }, [user, navigate]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    
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
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="profile-page">
      <Container className="profile-container">
        <Card className="profile-card">
          <div className="profile-header">
            <Button 
              variant="link" 
              onClick={() => navigate("/chat")} 
              className="back-button"
            >
              <FiArrowLeft size={20} />
            </Button>
            <h3>Profile Settings</h3>
          </div>
          
          <div className="profile-avatar-container">
            <div className="profile-avatar-wrapper">
              <img
                src={previewUrl}
                alt="Profile"
                className="profile-avatar"
                onError={(e) => (e.target.src = "http://localhost:5000/uploads/default-avatar.png")}
              />
              <label htmlFor="file-upload" className="avatar-upload-label">
                <FiUpload size={16} />
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="d-none"
              />
            </div>
          </div>

          <Card.Body className="profile-body">
            <div className="profile-info">
              <div className="info-item">
                <FiUser className="info-icon" />
                <div>
                  <div className="info-label">Username</div>
                  <div className="info-value">{user?.username || "Guest"}</div>
                </div>
              </div>
              
              <div className="info-item">
                <FiMail className="info-icon" />
                <div>
                  <div className="info-label">Email</div>
                  <div className="info-value">{user?.email || "No email provided"}</div>
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <Button 
                variant="primary" 
                className="upload-button"
                onClick={handleUpload} 
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? "Uploading..." : "Save Changes"}
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default Profile;