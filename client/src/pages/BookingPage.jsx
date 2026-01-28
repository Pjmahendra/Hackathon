import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

export default function BookingPage() {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [form, setForm] = useState({
    userId: "",
    description: "",
    scheduledAt: "",
    address: "",
    lat: "",
    lng: ""
  });
  const [eta, setEta] = useState(null);
  const [message, setMessage] = useState("");
  const locationRouter = useLocation();

  useEffect(() => {
    axios.get("/api/workers").then((res) => setWorkers(res.data));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(locationRouter.search);
    const workerId = params.get("workerId");
    if (workerId) {
      setSelectedWorker(workerId);
    }
  }, [locationRouter.search]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation not available");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6)
        }));
      },
      () => {
        setMessage("Could not get current location");
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWorker) {
      setMessage("Please select a worker");
      return;
    }
    const worker = workers.find((w) => w._id === selectedWorker);
    try {
      const payload = {
        userId: form.userId,
        workerId: selectedWorker,
        description: form.description,
        scheduledAt: form.scheduledAt,
        location: {
          address: form.address,
          lat: Number(form.lat),
          lng: Number(form.lng)
        },
        workerLocation: worker?.location
      };
      const res = await axios.post("/api/bookings", payload);
      setEta(res.data.etaMinutes ?? null);
      setMessage("Booking created successfully");
    } catch (err) {
      setMessage(err.response?.data?.message || "Error creating booking");
    }
  };

  return (
    <div className="card">
      <h2>Book a worker</h2>
      <form onSubmit={handleSubmit} className="form">
        <label>
          User ID (for demo):
          <input name="userId" value={form.userId} onChange={handleChange} required />
        </label>
        <label>
          Choose worker:
          <select
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            required
          >
            <option value="">Select worker</option>
            {workers.map((w) => (
              <option key={w._id} value={w._id}>
                {w.user?.name || "Worker"} — rating {w.averageRating?.toFixed(1) || 0} (
                {w.reviewCount} reviews)
              </option>
            ))}
          </select>
        </label>
        <label>
          Work description:
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Schedule time:
          <input
            type="datetime-local"
            name="scheduledAt"
            value={form.scheduledAt}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Address:
          <input name="address" value={form.address} onChange={handleChange} />
        </label>
        <div className="grid-two">
          <label>
            Latitude:
            <input name="lat" value={form.lat} onChange={handleChange} required />
          </label>
          <label>
            Longitude:
            <input name="lng" value={form.lng} onChange={handleChange} required />
          </label>
        </div>
        <button type="button" className="btn-secondary" onClick={handleUseMyLocation}>
          Use my current location
        </button>
        <button type="submit" className="btn-primary">
          Create booking
        </button>
      </form>

      {eta != null && (
        <p className="info">
          Estimated travel time from worker to you: <strong>{eta} minutes</strong>
        </p>
      )}

      {message && <p className="info">{message}</p>}

      <div className="map-placeholder">
        <p>
          Map placeholder — here you can later embed Google Maps or another map SDK using the
          latitude/longitude values above.
        </p>
      </div>
    </div>
  );
}

