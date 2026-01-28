import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function ClientDashboard() {
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

  const [selectedJob, setSelectedJob] = useState("");
  const [workers, setWorkers] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!selectedJob) {
      setError("Please choose a job type.");
      return;
    }
    setSearched(true);
    setError("");
    setLoading(true);
    try {
      const res = await axios.get("/api/workers", {
        params: { q: selectedJob }
      });
      setWorkers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load workers");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Find workers for your job</h2>
      <p>
        Search by the type of work you need (for example: electrician, plumber, cleaning,
        painting). We will list workers whose skills match your search.
      </p>

      <form onSubmit={handleSearch} className="form">
        <label>
          Search for a job
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
          >
            <option value="">Select job type</option>
            {JOB_OPTIONS.map((job) => (
              <option key={job} value={job}>
                {job}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-primary">
          Search
        </button>
      </form>

      {loading && <p className="info">Searching workers...</p>}
      {error && <p className="info">{error}</p>}

      {searched && !loading && workers.length === 0 && (
        <p className="info">No workers found for that job yet.</p>
      )}

      {workers.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h3>Available workers</h3>
          <ul>
            {workers.map((w) => (
              <li key={w._id} style={{ marginBottom: "0.5rem" }}>
                <strong>{w.user?.name || "Worker"}</strong> — skills:{" "}
                {w.skills?.join(", ") || "not specified"} — rating{" "}
                {w.averageRating?.toFixed(1) || 0} ({w.reviewCount} reviews){" "}
                <Link
                  to={`/book?workerId=${w._id}`}
                  className="btn-secondary"
                  style={{ marginLeft: "0.5rem", paddingInline: "0.8rem" }}
                >
                  Book
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

