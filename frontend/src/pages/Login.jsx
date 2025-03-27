import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [identifier, setIdentifier] = useState(""); // Email or Username
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false); // Loading state
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage("Email or Username and password are required!");
      return;
    }

    try {
      setLoading(true); // Show loading state

      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user)); // Store user details
        console.log("User Data Stored:", data.user);
        navigate("/chat"); // Redirect after login
      } else {
        setErrorMessage(data.message || "Invalid login credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Unable to connect. Please try again later.");
    } finally {
      setLoading(false); // Hide loading state
    }
  };

  return (
    <section className="vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#9A616D" }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card shadow-lg" style={{ borderRadius: "1rem" }}>
              <div className="row g-0">
                {/* Left Image Section */}
                <div className="col-md-6 d-none d-md-block">
                  <img 
                    src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/img1.webp"
                    alt="Login form"
                    className="img-fluid"
                    style={{ borderRadius: "1rem 0 0 1rem", height: "100%" }}
                  />
                </div>

                {/* Right Login Form Section */}
                <div className="col-md-6 d-flex align-items-center">
                  <div className="card-body p-4 p-lg-5">
                    <form onSubmit={handleLogin}>
                      <h5 className="fw-bold mb-4" style={{ letterSpacing: "1px" }}>
                        Sign into your account
                      </h5>

                      {/* Error Message */}
                      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

                      {/* Identifier (Email/Username) Field */}
                      <div className="mb-3">
                        <label className="form-label">Email or Username</label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="Enter your email or username"
                          required
                        />
                      </div>

                      {/* Password Field */}
                      <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input
                          type="password"
                          className="form-control form-control-lg"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                        />
                      </div>

                      {/* Login Button */}
                      <div className="pt-2">
                        <button className="btn btn-dark btn-lg w-100" type="submit" disabled={loading}>
                          {loading ? "Logging in..." : "Login"}
                        </button>
                      </div>

                      {/* Register Link */}
                      <p className="mt-4 text-center">
                        Don't have an account?{" "}
                        <span
                          className="text-primary"
                          style={{ cursor: "pointer" }}
                          onClick={() => navigate("/signup")}
                        >
                          Register here
                        </span>
                      </p>
                    </form>
                  </div>
                </div>
              </div>
            </div>  
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;

