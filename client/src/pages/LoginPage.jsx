import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/auth/login", form);
      const user = res.data;
      onLogin(user);
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "worker") navigate("/worker");
      else navigate("/client");
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="card">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Password
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title="Toggle password visibility"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </label>
        <button type="submit" className="btn-primary">
          Sign in
        </button>
      </form>
      {message && <p className="info">{message}</p>}
    </div>
  );
}

