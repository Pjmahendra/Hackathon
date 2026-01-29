import { useState } from "react";
import axios from "axios";
import ClientLocationMap from "../components/ClientLocationMap.jsx";

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
  const [bookings, setBookings] = useState([]);
  const [info, setInfo] = useState("");
  const [clientLocation, setClientLocation] = useState({ lat: null, lng: null });
  const [locMessage, setLocMessage] = useState("");
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTimeFrom, setScheduledTimeFrom] = useState("");
  const [scheduledTimeTo, setScheduledTimeTo] = useState("");

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

  // Use IP-based geolocation (ip-api.com) to get an approximate client location
  const useIpLocation = async () => {
    try {
      setLocMessage("Detecting your location from network...");
      setError("");
      // ip-api.com is free and does not require an API key
      const res = await axios.get("http://ip-api.com/json");
      if (res.data?.status === "success") {
        const { lat, lon } = res.data;
        if (typeof lat === "number" && typeof lon === "number") {
          setClientLocation({ lat, lng: lon });
          setLocMessage(
            `Location set from network: ${lat.toFixed(4)}, ${lon.toFixed(4)} (approximate)`
          );
          return;
        }
      }
      setLocMessage("Could not detect your location from network.");
    } catch {
      setLocMessage("Could not detect your location from network.");
    }
  };

  const bookForJob = async () => {
    setError("");
    setInfo("");
    setLocMessage("");
    const stored = localStorage.getItem("currentUser");
    if (!stored) {
      setError("You must be logged in to book a worker.");
      return;
    }
    let user;
    try {
      user = JSON.parse(stored);
    } catch {
      setError("Could not read current user.");
      return;
    }
    if (!user?.id) {
      setError("You must be logged in to book a worker.");
      return;
    }
    if (clientLocation.lat == null || clientLocation.lng == null) {
      setError("Please set your location before booking so we can find nearby workers.");
      return;
    }
    if (!scheduledDate || !scheduledTimeFrom || !scheduledTimeTo) {
      setError("Please select the date and time range (from and to) for when you need the work done.");
      return;
    }
    try {
      // Combine date with time to create full datetime objects
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTimeFrom}`);
      const scheduledTo = new Date(`${scheduledDate}T${scheduledTimeTo}`);
      
      if (scheduledTo <= scheduledAt) {
        setError("End time must be after start time.");
        return;
      }

      await axios.post("/api/bookings", {
        userId: user.id,
        jobName: selectedJob,
        location: {
          lat: clientLocation.lat,
          lng: clientLocation.lng
        },
        scheduledAt: scheduledAt.toISOString(),
        scheduledTo: scheduledTo.toISOString()
      });
      setInfo("Booking request sent. Waiting for a worker to accept.");
      // refresh client bookings list
      const res = await axios.get(`/api/bookings/user/${user.id}`);
      setBookings(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error creating booking");
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

      <div style={{ marginTop: "0.75rem" }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setLocMessage("");
            setShowMapPicker(true);
          }}
        >
          Pick location on map
        </button>
        <button
          type="button"
          className="btn-secondary"
          style={{ marginLeft: "0.5rem" }}
          onClick={useIpLocation}
        >
          Use my network location
        </button>
        {clientLocation.lat != null && (
          <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "#9ca3af" }}>
            ({clientLocation.lat.toFixed(4)}, {clientLocation.lng?.toFixed(4)})
          </span>
        )}
      </div>
      {locMessage && <p className="info">{locMessage}</p>}

      {loading && <p className="info">Searching workers...</p>}
      {error && <p className="info">{error}</p>}
      {info && <p className="info">{info}</p>}

      {searched && !loading && workers.length === 0 && (
        <p className="info">No workers found for that job yet.</p>
      )}

      {workers.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h3>Schedule your work</h3>
          <label>
            Date
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              style={{ marginTop: "0.25rem" }}
              min={new Date().toISOString().split("T")[0]}
            />
          </label>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <label style={{ flex: 1 }}>
              From (time)
              <input
                type="time"
                value={scheduledTimeFrom}
                onChange={(e) => setScheduledTimeFrom(e.target.value)}
                style={{ marginTop: "0.25rem" }}
              />
            </label>
            <label style={{ flex: 1 }}>
              To (time)
              <input
                type="time"
                value={scheduledTimeTo}
                onChange={(e) => setScheduledTimeTo(e.target.value)}
                style={{ marginTop: "0.25rem" }}
              />
            </label>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={bookForJob}
            style={{ marginTop: "0.5rem" }}
          >
            Book for this job
          </button>
        </div>
      )}
      <ClientBookings bookings={bookings} setBookings={setBookings} />
      {showMapPicker && (
        <ClientLocationMap
          initialLatLng={
            clientLocation.lat != null && clientLocation.lng != null
              ? { lat: clientLocation.lat, lng: clientLocation.lng }
              : null
          }
          onCancel={() => setShowMapPicker(false)}
          onConfirm={(latlng) => {
            setClientLocation({ lat: latlng.lat, lng: latlng.lng });
            setLocMessage("Location selected from map.");
            setShowMapPicker(false);
          }}
        />
      )}
    </div>
  );
}

function ClientBookings({ bookings, setBookings }) {
  const [loaded, setLoaded] = useState(false);
  const [reviewingId, setReviewingId] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: "5", comment: "" });
  const [reviewMessage, setReviewMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const load = async () => {
    const stored = localStorage.getItem("currentUser");
    if (!stored) return;
    let user;
    try {
      user = JSON.parse(stored);
    } catch {
      return;
    }
    if (!user?.id) return;
    const res = await axios.get(`/api/bookings/user/${user.id}`);
    setBookings(res.data);
    setLoaded(true);
  };

  const markDone = async (id) => {
    await axios.patch(`/api/bookings/${id}/mark-done`, { by: "client" });
    await load();
  };

  const cancelBooking = async (id) => {
    setActionMessage("");
    const stored = localStorage.getItem("currentUser");
    if (!stored) return;
    let user;
    try {
      user = JSON.parse(stored);
    } catch {
      return;
    }
    if (!user?.id) return;
    try {
      await axios.patch(`/api/bookings/${id}/cancel-client`, { userId: user.id });
      setActionMessage("Booking cancelled.");
      await load();
    } catch (err) {
      setActionMessage(err.response?.data?.message || "Could not cancel booking.");
    }
  };

  const submitReview = async (booking) => {
    setReviewMessage("");
    const stored = localStorage.getItem("currentUser");
    if (!stored) return;
    let user;
    try {
      user = JSON.parse(stored);
    } catch {
      return;
    }
    if (!user?.id) return;

    const workerId =
      typeof booking.worker === "string" ? booking.worker : booking.worker?._id;
    if (!workerId) {
      setReviewMessage("No worker found for this booking.");
      return;
    }
    try {
      await axios.post("/api/reviews", {
        bookingId: booking._id,
        workerId,
        userId: user.id,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment
      });
      setReviewingId("");
      setReviewForm({ rating: "5", comment: "" });
      setReviewMessage("Thanks! Your review was submitted.");
      await load();
    } catch (err) {
      setReviewMessage(err.response?.data?.message || "Could not submit review.");
    }
  };

  if (!loaded && bookings.length === 0) {
    // lazy load on first render
    load();
  }

  if (!bookings.length) return null;

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <h3>Your bookings</h3>
      {reviewMessage && <p className="info">{reviewMessage}</p>}
      {actionMessage && <p className="info">{actionMessage}</p>}
      <ul>
        {bookings.map((b) => (
          <li key={b._id} style={{ marginBottom: "0.5rem" }}>
            <strong>{b.description || b.jobName || "Job request"}</strong> —{" "}
            {new Date(b.scheduledAt).toLocaleDateString()}{" "}
            {new Date(b.scheduledAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            })}
            {b.scheduledTo && (
              <>
                {" "}
                to{" "}
                {new Date(b.scheduledTo).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </>
            )}
            {" — status: "}
            {b.status}
            {(b.status === "accepted" || b.status === "completed") && b.worker && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#d1d5db", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {b.worker.profilePhoto && (
                  <img
                    src={b.worker.profilePhoto}
                    alt={typeof b.worker === "object" && b.worker.user ? b.worker.user.name || "Worker" : "Worker"}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid rgba(148, 163, 184, 0.25)"
                    }}
                  />
                )}
                <div>
                  <strong>Worker:</strong> {typeof b.worker === "object" && b.worker.user
                    ? b.worker.user.name || "Worker"
                    : "Worker"}
                  {typeof b.worker === "object" &&
                    b.worker.user &&
                    b.worker.user.phone && (
                      <span style={{ marginLeft: "0.75rem" }}>
                        <strong>Phone:</strong> {b.worker.user.phone}
                      </span>
                    )}
                </div>
              </div>
            )}
            {b.status === "pending" && (
              <span style={{ marginLeft: "0.5rem", fontSize: "0.85rem" }}>
                Request pending
              </span>
            )}
            {(b.status === "pending" || b.status === "accepted") && (
              <button
                className="btn-secondary"
                style={{ marginLeft: "0.5rem" }}
                onClick={() => cancelBooking(b._id)}
              >
                Cancel
              </button>
            )}
            {b.status === "accepted" && (
              <button
                className="btn-secondary"
                style={{ marginLeft: "0.5rem" }}
                onClick={() => markDone(b._id)}
              >
                Mark done
              </button>
            )}

            {b.status === "completed" && !b.clientReviewed && (
              <>
                <button
                  className="btn-secondary"
                  style={{ marginLeft: "0.5rem" }}
                  onClick={() => {
                    setReviewMessage("");
                    setReviewingId((prev) => (prev === b._id ? "" : b._id));
                  }}
                >
                  Leave review
                </button>
                {reviewingId === b._id && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.25rem" }}>
                      Rating
                      <select
                        value={reviewForm.rating}
                        onChange={(e) =>
                          setReviewForm((p) => ({ ...p, rating: e.target.value }))
                        }
                        style={{ marginLeft: "0.5rem" }}
                      >
                        <option value="5">5</option>
                        <option value="4">4</option>
                        <option value="3">3</option>
                        <option value="2">2</option>
                        <option value="1">1</option>
                      </select>
                    </label>
                    <label style={{ display: "block", marginBottom: "0.25rem" }}>
                      Comment (optional)
                      <input
                        value={reviewForm.comment}
                        onChange={(e) =>
                          setReviewForm((p) => ({ ...p, comment: e.target.value }))
                        }
                        placeholder="Write a short review"
                      />
                    </label>
                    <button
                      className="btn-primary"
                      type="button"
                      onClick={() => submitReview(b)}
                    >
                      Submit review
                    </button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

