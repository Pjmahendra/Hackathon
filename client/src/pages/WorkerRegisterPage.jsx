import { useEffect, useState } from "react";
import axios from "axios";

export default function WorkerRegisterPage() {
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
    selectedJob: "",
    hourlyRate: "",
    address: ""
  });
  const [message, setMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user?.id) {
          setCurrentUserId(user.id);
        }
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUserId) {
      setMessage("You must be logged in as a worker to register your profile.");
      return;
    }
    if (!form.selectedJob) {
      setMessage("Please choose the job you can do.");
      return;
    }
    try {
      const payload = {
        userId: currentUserId,
        // store selected job as a one-item skills array
        skills: [form.selectedJob],
        hourlyRate: Number(form.hourlyRate || 0),
        location: {
          address: form.address
        }
      };
      await axios.post("/api/workers/register", payload);
      setMessage("Registration submitted. Wait for admin approval.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Error submitting registration");
    }
  };

  return (
    <div className="card">
      <h2>Worker registration</h2>
      <form onSubmit={handleSubmit} className="form">
        {/* User comes from logged-in account; no manual input needed */}
        <label>
          Job you will do
          <select
            name="selectedJob"
            value={form.selectedJob}
            onChange={handleChange}
          >
            <option value="">Select job type</option>
            {JOB_OPTIONS.map((job) => (
              <option key={job} value={job}>
                {job}
              </option>
            ))}
          </select>
        </label>
        <label>
          Hourly rate:
          <input
            name="hourlyRate"
            type="number"
            value={form.hourlyRate}
            onChange={handleChange}
          />
        </label>
        <label>
          Address:
          <input name="address" value={form.address} onChange={handleChange} />
        </label>
        <button type="submit" className="btn-primary">
          Submit
        </button>
      </form>
      {message && <p className="info">{message}</p>}
    </div>
  );
}

