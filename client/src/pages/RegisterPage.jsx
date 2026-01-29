import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function RegisterPage({ onRegister }) {
  const JOB_OPTIONS = [
    "Cleaning",
    "Electrician",
    "Plumbing",
    "Carpentry",
    "Painting",
    "Gardening",
    "Moving",
    "Other"
  ];

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "user",
    workerJobs: "",
    password: "",
    confirmPassword: ""
  });
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    if (form.role === "worker" && !form.workerJobs) {
      setMessage("Please choose the job you will do.");
      return;
    }
    try {
      const { confirmPassword, ...payload } = form;
      const res = await axios.post("/api/auth/register", payload);
      const user = res.data;
      onRegister(user);
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "worker") navigate("/worker");
      else navigate("/client");
    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="card">
      <h2>Create account</h2>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
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
          Phone
          <input name="phone" value={form.phone} onChange={handleChange} />
        </label>
        <label>
          I am a:
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="user">Client</option>
            <option value="worker">Worker</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        {form.role === "worker" && (
          <label>
            Work you will do
            <select
              name="workerJobs"
              value={form.workerJobs}
              onChange={handleChange}
              placeholder=""
            >
              <option value="">Select job type</option>
              {JOB_OPTIONS.map((job) => (
                <option key={job} value={job}>
                  {job}
                </option>
              ))}
            </select>
          </label>
        )}
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
        <label>
          Confirm password
          <input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
        </label>
        <button type="submit" className="btn-primary">
          Sign up
        </button>
      </form>
      {message && <p className="info">{message}</p>}
    </div>
  );
}

