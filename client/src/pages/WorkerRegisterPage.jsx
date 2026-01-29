import { useEffect, useState } from "react";
import axios from "axios";
import ClientLocationMap from "../components/ClientLocationMap.jsx";
import { getJobPrice, formatPrice } from "../utils/pricing.js";

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

  const DAYS_OF_WEEK = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" }
  ];

  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({
    newJobName: "",
    address: ""
  });
  const [message, setMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [ratingInfo, setRatingInfo] = useState({ averageRating: 0, reviewCount: 0 });
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [locMessage, setLocMessage] = useState("");
  const [availability, setAvailability] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]); // Array of day values (0-6)
  const [newAvailability, setNewAvailability] = useState({
    startTime: "",
    endTime: ""
  });
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Use IP-based geolocation (ip-api.com) to get an approximate worker location
  const useIpLocation = async () => {
    try {
      setLocMessage("Detecting your location from network...");
      // ip-api.com is free and does not require an API key
      const res = await axios.get("http://ip-api.com/json");
      if (res.data?.status === "success") {
        const { lat, lon } = res.data;
        if (typeof lat === "number" && typeof lon === "number") {
          setCoords({ lat, lng: lon });
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addJob = () => {
    if (!form.newJobName) {
      setMessage("Please select a job type.");
      return;
    }
    if (jobs.some((j) => j.name === form.newJobName)) {
      setMessage("You already added this job.");
      return;
    }
    // Use fixed price from pricing structure
    setJobs((prev) => [
      ...prev,
      { name: form.newJobName, pricePerHour: getJobPrice(form.newJobName) }
    ]);
    setForm((prev) => ({ ...prev, newJobName: "" }));
    setMessage("");
  };

  const removeJob = (name) => {
    setJobs((prev) => prev.filter((j) => j.name !== name));
  };

  const toggleDay = (dayValue) => {
    setSelectedDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((d) => d !== dayValue)
        : [...prev, dayValue]
    );
  };

  const addAvailability = () => {
    if (selectedDays.length === 0) {
      setMessage("Please select at least one day.");
      return;
    }
    if (!newAvailability.startTime || !newAvailability.endTime) {
      setMessage("Please fill both start and end times.");
      return;
    }
    
    // Validate that end time is after start time
    const [startHour, startMin] = newAvailability.startTime.split(":").map(Number);
    const [endHour, endMin] = newAvailability.endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (endMinutes <= startMinutes) {
      setMessage("End time must be after start time.");
      return;
    }
    
    // Add availability slots for all selected days
    const newSlots = selectedDays
      .filter((day) => {
        // Only add if this exact slot doesn't already exist
        return !availability.some(
          (a) =>
            a.dayOfWeek === day &&
            a.startTime === newAvailability.startTime &&
            a.endTime === newAvailability.endTime
        );
      })
      .map((day) => ({
        dayOfWeek: day,
        startTime: newAvailability.startTime,
        endTime: newAvailability.endTime
      }));

    if (newSlots.length === 0) {
      setMessage("All selected days already have this time slot.");
      return;
    }

    setAvailability((prev) => [...prev, ...newSlots]);
    setSelectedDays([]);
    setNewAvailability({ startTime: "", endTime: "" });
    setMessage("");
  };

  const removeAvailability = (index) => {
    setAvailability((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user?.id) {
          setCurrentUserId(user.id);
          // load existing worker profile for this user
          axios
            .get("/api/workers", { params: { byUser: user.id } })
            .then((res) => {
              const worker = res.data?.[0];
              if (worker) {
                setHasExistingProfile(true);
                setIsApproved(!!worker.isApproved);
                const existingJobs = worker.jobs || [];
                setJobs(existingJobs);
                setRatingInfo({
                  averageRating: worker.averageRating || 0,
                  reviewCount: worker.reviewCount || 0
                });
                setCoords({
                  lat: worker.location?.lat ?? null,
                  lng: worker.location?.lng ?? null
                });
                setForm({
                  newJobName: "",
                  address: worker.location?.address || ""
                });
                setAvailability(worker.availability || []);
                if (worker.profilePhoto) {
                  setProfilePhoto(worker.profilePhoto);
                  setPhotoPreview(worker.profilePhoto);
                }
              }
            })
            .catch(() => {
              // ignore load errors here, form will just be empty
            });
        }
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfilePhoto(base64String);
        setPhotoPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUserId) {
      setMessage("You must be logged in as a worker to register your profile.");
      return;
    }
    if (!jobs.length) {
      setMessage("Please add at least one job you can do.");
      return;
    }
    if (coords.lat == null || coords.lng == null) {
      setMessage("Please set your location so we can match you to nearby clients.");
      return;
    }
    try {
      const payload = {
        userId: currentUserId,
        jobs,
        location: {
          address: form.address,
          lat: coords.lat,
          lng: coords.lng
        },
        availability,
        profilePhoto: profilePhoto || null
      };
      const res = await axios.post("/api/workers/register", payload);
      const saved = res.data;
      if (saved?.isApproved) {
        setIsApproved(true);
        setHasExistingProfile(true);
        setMessage("Profile updated successfully.");
      } else {
        // first-time (or not yet approved) profile
        setIsApproved(false);
        setHasExistingProfile(true);
        setMessage("Profile submitted. Wait for admin approval (first time only).");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Error submitting registration");
    }
  };

  return (
    <div className="card">
      <div className="page-header">
        <div>
          <h2 className="page-title">Profile</h2>
          <div className="subtle">Update your services, location, and availability.</div>
        </div>
        <div className="stats-row">
          <div className="stat-pill">
            Rating: {Number(ratingInfo.averageRating || 0).toFixed(1)} ({ratingInfo.reviewCount})
          </div>
          <div className="stat-pill">Jobs: {jobs.length}</div>
          <div className="stat-pill">Availability slots: {availability.length}</div>
        </div>
      </div>

      {hasExistingProfile && (
        <p className="info">
          Your existing worker details are pre-filled. Update and submit to save changes.
        </p>
      )}
      <form onSubmit={handleSubmit} className="form">
        {/* Profile Photo Section */}
        <section className="panel">
          <div className="panel-header">
            <h3>Profile Photo</h3>
            <span className="subtle">Add your photo so clients can see you</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "flex-start" }}>
            {photoPreview && (
              <div style={{ position: "relative", display: "inline-block" }}>
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  style={{
                    width: "150px",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "50%",
                    border: "2px solid rgba(148, 163, 184, 0.25)"
                  }}
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="btn-secondary"
                  style={{
                    position: "absolute",
                    top: "-0.5rem",
                    right: "-0.5rem",
                    borderRadius: "50%",
                    width: "2rem",
                    height: "2rem",
                    padding: 0,
                    fontSize: "1rem"
                  }}
                  title="Remove photo"
                >
                  ×
                </button>
              </div>
            )}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <label className="btn-secondary" style={{ cursor: "pointer", margin: 0 }}>
                📁 Choose from Files
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>
        </section>

        {/* User comes from logged-in account; no manual input needed */}
        <section className="panel">
          <div className="panel-header">
            <h3>Services</h3>
            <span className="subtle">Add one or more jobs you can do (prices are fixed)</span>
          </div>
          <label>
            Add a job
            <div className="job-add-row">
            <select
              name="newJobName"
              value={form.newJobName}
              onChange={handleChange}
            >
              <option value="">Select job type</option>
              {JOB_OPTIONS.map((job) => (
                <option key={job} value={job}>
                  {job} - {formatPrice(job)}
                </option>
              ))}
            </select>
            <button type="button" className="btn-secondary" onClick={addJob}>
              Add
            </button>
            </div>
          </label>

          {jobs.length > 0 && (
            <div className="job-list">
              {jobs.map((job) => (
                <div key={job.name} className="job-list-item">
                  <span><strong>{job.name}</strong> - {formatPrice(job.name)}</span>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => removeJob(job.name)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <h3>Location</h3>
            <span className="subtle">Used for 15km matching</span>
          </div>
          <label>
            Address
            <input name="address" value={form.address} onChange={handleChange} />
          </label>
          <label>
            Set your location (GPS)
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
                marginTop: "0.25rem",
                flexWrap: "wrap"
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setLocMessage("");
                  if (!navigator.geolocation) {
                    setLocMessage("Geolocation is not supported in this browser.");
                    return;
                  }
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setCoords({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                      });
                      setLocMessage("Location set from your device.");
                    },
                    () => {
                      setLocMessage("Could not get your location. Please allow location access.");
                    }
                  );
                }}
              >
                Use my current location
              </button>
              <button type="button" className="btn-secondary" onClick={useIpLocation}>
                Use my network location
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setLocMessage("");
                  setShowMapPicker(true);
                }}
              >
                Pick on map
              </button>
              {coords.lat != null && (
                <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                  ({coords.lat.toFixed(4)}, {coords.lng?.toFixed(4)})
                </span>
              )}
            </div>
          </label>
          {locMessage && <p className="info">{locMessage}</p>}
        </section>

        <section className="panel">
          <div className="panel-header">
            <h3>Availability</h3>
            <span className="subtle">Requests are shown only in these slots</span>
          </div>
          <p className="subtle" style={{ margin: 0 }}>
            Select the days you want to work and set your available time. You can add multiple time
            slots.
          </p>
          
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              Select Days:
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {DAYS_OF_WEEK.map((d) => (
                <label
                  key={d.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0.5rem 1rem",
                    border: selectedDays.includes(d.value) ? "2px solid #00d4ff" : "1px solid #444",
                    borderRadius: "4px",
                    cursor: "pointer",
                    backgroundColor: selectedDays.includes(d.value) ? "rgba(0, 212, 255, 0.1)" : "transparent"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(d.value)}
                    onChange={() => toggleDay(d.value)}
                    style={{ marginRight: "0.5rem", cursor: "pointer" }}
                  />
                  {d.label}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>From (time)</span>
                <input
                  type="time"
                  value={newAvailability.startTime}
                  onChange={(e) =>
                    setNewAvailability((p) => ({ ...p, startTime: e.target.value }))
                  }
                />
              </label>
              <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>To (time)</span>
                <input
                  type="time"
                  value={newAvailability.endTime}
                  onChange={(e) =>
                    setNewAvailability((p) => ({ ...p, endTime: e.target.value }))
                  }
                />
              </label>
            </div>
            <button type="button" className="btn-secondary" onClick={addAvailability} style={{ alignSelf: "flex-start" }}>
              Add Availability Slot
            </button>
          </div>
          {availability.length > 0 && (
            <div className="job-list" style={{ marginTop: "0.5rem" }}>
              {availability.map((slot, idx) => {
                const day = DAYS_OF_WEEK.find((d) => d.value === slot.dayOfWeek);
                return (
                  <div key={idx} className="job-list-item">
                    <span>
                      <strong>{day?.label || "Day " + slot.dayOfWeek}:</strong> from {slot.startTime} to {slot.endTime}
                    </span>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => removeAvailability(idx)}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <button type="submit" className="btn-primary">
          Submit
        </button>
      </form>
      {message && <p className="info">{message}</p>}
      {showMapPicker && (
        <ClientLocationMap
          initialLatLng={
            coords.lat != null && coords.lng != null ? { lat: coords.lat, lng: coords.lng } : null
          }
          onCancel={() => setShowMapPicker(false)}
          onConfirm={(latlng) => {
            setCoords({ lat: latlng.lat, lng: latlng.lng });
            setLocMessage("Location selected from map.");
            setShowMapPicker(false);
          }}
        />
      )}
    </div>
  );
}

