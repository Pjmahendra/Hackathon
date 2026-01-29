import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function AuthPage({ onAuth }) {
  const location = useLocation();
  const navigate = useNavigate();

  const JOB_OPTIONS = useMemo(
    () => [
      "Cleaning",
      "Electrician",
      "Plumbing",
      "Carpentry",
      "Painting",
      "Gardening",
      "Moving",
      "Other"
    ],
    []
  );

  const [isSignup, setIsSignup] = useState(false);
  const [message, setMessage] = useState("");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "user",
    workerJobs: "",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [showWorkerDetails, setShowWorkerDetails] = useState(false);

  // Keep UI in sync with route (/login vs /register)
  useEffect(() => {
    const isRegisterPath = location.pathname === "/register";
    setIsSignup(isRegisterPath);
    setMessage("");
    // Reset the progressive disclosure state when switching routes
    setShowMoreDetails(false);
    setShowWorkerDetails(false);
  }, [location.pathname]);

  const toggleToSignup = () => {
    setIsSignup(true);
    setMessage("");
    navigate("/register");
  };

  const toggleToLogin = () => {
    setIsSignup(false);
    setMessage("");
    navigate("/login");
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await axios.post("/api/auth/login", loginForm);
      const user = res.data;
      onAuth(user);
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "worker") navigate("/worker");
      else navigate("/client");
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed");
    }
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    if (registerForm.password !== registerForm.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    if (registerForm.role === "worker" && !registerForm.workerJobs) {
      setMessage("Please choose the job you will do.");
      return;
    }
    try {
      const { confirmPassword, ...payload } = registerForm;
      const res = await axios.post("/api/auth/register", payload);
      const user = res.data;
      onAuth(user);
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "worker") navigate("/worker");
      else navigate("/client");
    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="auth-screen">
      <div className={`auth-wrapper${isSignup ? " toggled" : ""}`}>
        <div className="background-shape" />
        <div className="secondary-shape" />

        {/* Login panel */}
        <div className="credentials-panel signin">
          <h1 style={{ color: "#fff", fontSize: "1.75rem", fontWeight: "bold", margin: "0 0 1rem 0", textAlign: "center", whiteSpace: "nowrap" }}>
            Worker Booking
          </h1>
          <h2 className="slide-element">Login</h2>
          <form onSubmit={submitLogin}>
            <div className="field-wrapper slide-element">
              <input
                type="email"
                required
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm((p) => ({ ...p, email: e.target.value }))
                }
              />
              <label>Email</label>
              <span className="field-icon" aria-hidden="true">
                ✉
              </span>
            </div>

            <div className="field-wrapper slide-element">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm((p) => ({ ...p, password: e.target.value }))
                }
              />
              <label>Password</label>
              <button
                type="button"
                className="field-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title="Toggle password visibility"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <div className="field-wrapper slide-element">
              <button className="submit-button" type="submit">
                Login
              </button>
            </div>

            <div className="switch-link slide-element">
              <p>
                Don&apos;t have an account?
                <br />
                <a
                  href="#"
                  className="register-trigger"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleToSignup();
                  }}
                >
                  Sign Up
                </a>
              </p>
            </div>
          </form>
        </div>

        {/* Welcome right */}
        <div className="welcome-section signin">
          <h2 className="slide-element">WELCOME BACK!</h2>
        </div>

        {/* Register panel */}
        <div className="credentials-panel signup">
          <h1 style={{ color: "#fff", fontSize: "1.75rem", fontWeight: "bold", margin: "0 0 1rem 0", textAlign: "center", whiteSpace: "nowrap" }}>
            Worker Booking
          </h1>
          <h2 className="slide-element">Register</h2>
          <form onSubmit={submitRegister} className="auth-form-scroll">
            {/* Main details (always visible) */}
            <div className="field-wrapper slide-element">
              <input
                type="text"
                required
                value={registerForm.name}
                onChange={(e) =>
                  setRegisterForm((p) => ({ ...p, name: e.target.value }))
                }
              />
              <label>Name</label>
              <span className="field-icon" aria-hidden="true">
                👤
              </span>
            </div>

            <div className="field-wrapper slide-element">
              <input
                type="email"
                required
                value={registerForm.email}
                onChange={(e) =>
                  setRegisterForm((p) => ({ ...p, email: e.target.value }))
                }
              />
              <label>Email</label>
              <span className="field-icon" aria-hidden="true">
                ✉
              </span>
            </div>

            <div className="field-wrapper slide-element has-select">
              <select
                value={registerForm.role}
                onChange={(e) => {
                  const nextRole = e.target.value;
                  setRegisterForm((p) => ({
                    ...p,
                    role: nextRole,
                    // reset worker job if switching away
                    workerJobs: nextRole === "worker" ? p.workerJobs : ""
                  }));
                  // auto-collapse worker details when role changes
                  if (nextRole !== "worker") setShowWorkerDetails(false);
                }}
                required
              >
                <option value="user">Client</option>
                <option value="worker">Worker</option>
                <option value="admin">Admin</option>
              </select>
              <label>I am a</label>
              <span className="field-icon" aria-hidden="true">
                ⌄
              </span>
            </div>

            <div className="field-wrapper slide-element">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={registerForm.password}
                onChange={(e) =>
                  setRegisterForm((p) => ({ ...p, password: e.target.value }))
                }
              />
              <label>Password</label>
              <button
                type="button"
                className="field-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title="Toggle password visibility"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <div className="field-wrapper slide-element">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={registerForm.confirmPassword}
                onChange={(e) =>
                  setRegisterForm((p) => ({ ...p, confirmPassword: e.target.value }))
                }
              />
              <label>Confirm password</label>
              <span className="field-icon" aria-hidden="true">
                🔒
              </span>
            </div>

            {/* Worker details (only when role=worker, expandable) */}
            {registerForm.role === "worker" && (
              <div className="auth-section slide-element">
                <button
                  type="button"
                  className="auth-section-toggle"
                  onClick={() => setShowWorkerDetails((v) => !v)}
                >
                  Worker details {showWorkerDetails ? "▲" : "▼"}
                </button>
                {showWorkerDetails && (
                  <div className="auth-section-body">
                    <div className="field-wrapper has-select">
                      <select
                        value={registerForm.workerJobs}
                        onChange={(e) =>
                          setRegisterForm((p) => ({
                            ...p,
                            workerJobs: e.target.value
                          }))
                        }
                        required
                      >
                        <option value="">Select job type</option>
                        {JOB_OPTIONS.map((job) => (
                          <option key={job} value={job}>
                            {job}
                          </option>
                        ))}
                      </select>
                      <label>Work you will do</label>
                      <span className="field-icon" aria-hidden="true">
                        🧰
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* More details (optional) */}
            <div className="auth-section slide-element">
              <button
                type="button"
                className="auth-section-toggle"
                onClick={() => setShowMoreDetails((v) => !v)}
              >
                More details {showMoreDetails ? "▲" : "▼"}
              </button>
              {showMoreDetails && (
                <div className="auth-section-body">
                  <div className="field-wrapper">
                    <input
                      type="text"
                      value={registerForm.phone}
                      onChange={(e) =>
                        setRegisterForm((p) => ({ ...p, phone: e.target.value }))
                      }
                    />
                    <label>Phone</label>
                    <span className="field-icon" aria-hidden="true">
                      ☎
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="field-wrapper slide-element">
              <button className="submit-button" type="submit">
                Register
              </button>
            </div>

            {/* Mobile fallback (welcome panel hidden on small screens) */}
            <div className="switch-link slide-element in-form">
              <p>
                Already have an account?
                <br />
                <a
                  href="#"
                  className="login-trigger"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleToLogin();
                  }}
                >
                  Sign In
                </a>
              </p>
            </div>
          </form>
        </div>

        {/* Welcome left */}
        <div className="welcome-section signup">
          <h2 className="slide-element">WELCOME!</h2>
          <div className="switch-link slide-element in-welcome">
            <p>
              Already have an account?
              <br />
              <a
                href="#"
                className="login-trigger"
                onClick={(e) => {
                  e.preventDefault();
                  toggleToLogin();
                }}
              >
                Sign In
              </a>
            </p>
          </div>
        </div>
      </div>

      {message && <p className="auth-message">{message}</p>}
    </div>
  );
}

