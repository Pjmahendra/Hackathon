import { useEffect, useState } from "react";
import axios from "axios";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [workerProfile, setWorkerProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = localStorage.getItem("currentUser");
        if (!stored) {
          setError("Not logged in");
          setLoading(false);
          return;
        }

        const currentUser = JSON.parse(stored);
        setUser(currentUser);

        // Fetch full user details
        try {
          const userRes = await axios.get(`/api/auth/user/${currentUser.id}`);
          if (userRes.data) {
            setUser(userRes.data);
          }
        } catch (err) {
          console.error("Could not fetch full user details:", err);
        }

        // If worker, fetch worker profile
        if (currentUser.role === "worker") {
          try {
            const workerRes = await axios.get("/api/workers", {
              params: { byUser: currentUser.id }
            });
            if (workerRes.data && workerRes.data.length > 0) {
              setWorkerProfile(workerRes.data[0]);
            }
          } catch (err) {
            console.error("Could not fetch worker profile:", err);
          }
        }

        // Fetch bookings for clients and workers
        if (currentUser.role === "user" || currentUser.role === "worker") {
          try {
            const bookingsRes = await axios.get(`/api/bookings/user/${currentUser.id}`);
            setBookings(bookingsRes.data || []);
          } catch (err) {
            console.error("Could not fetch bookings:", err);
          }
        }

        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load profile");
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <p className="info">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <p className="info" style={{ color: "#ef4444" }}>{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card">
        <p className="info">User not found</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
      </div>

      {/* User Information */}
      <section className="panel" style={{ marginTop: "1rem" }}>
        <div className="panel-header">
          <h3>Account Information</h3>
        </div>
        <table className="table" style={{ margin: 0 }}>
          <tbody>
            <tr>
              <td style={{ width: "140px", color: "#9ca3af" }}>Name</td>
              <td>{user.name || "-"}</td>
            </tr>
            <tr>
              <td style={{ color: "#9ca3af" }}>Email</td>
              <td>{user.email || "-"}</td>
            </tr>
            <tr>
              <td style={{ color: "#9ca3af" }}>Phone</td>
              <td>{user.phone || "-"}</td>
            </tr>
            <tr>
              <td style={{ color: "#9ca3af" }}>Role</td>
              <td>
                <span className="status-pill" style={{ textTransform: "capitalize" }}>
                  {user.role || "-"}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Worker Profile Section */}
      {user.role === "worker" && workerProfile && (
        <section className="panel" style={{ marginTop: "1rem" }}>
          <div className="panel-header">
            <h3>Worker Profile</h3>
          </div>
          {workerProfile.profilePhoto && (
            <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
              <img
                src={workerProfile.profilePhoto}
                alt="Profile"
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(148, 163, 184, 0.25)"
                }}
              />
            </div>
          )}
          <table className="table" style={{ margin: 0 }}>
            <tbody>
              <tr>
                <td style={{ width: "140px", color: "#9ca3af" }}>Status</td>
                <td>
                  {workerProfile.isApproved ? (
                    <span className="status-pill accepted">Approved</span>
                  ) : (
                    <span className="status-pill pending">Pending Approval</span>
                  )}
                  {!workerProfile.isActive && (
                    <span className="status-pill cancelled" style={{ marginLeft: "0.5rem" }}>
                      Inactive
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td style={{ color: "#9ca3af" }}>Rating</td>
                <td>
                  {workerProfile.averageRating?.toFixed(1) || 0} ⭐ (
                  {workerProfile.reviewCount || 0} reviews)
                </td>
              </tr>
              <tr>
                <td style={{ color: "#9ca3af" }}>Jobs & Prices</td>
                <td>
                  {workerProfile.jobs && workerProfile.jobs.length > 0
                    ? workerProfile.jobs
                        .map((j) => `${j.name} (₹${j.pricePerHour}/hr)`)
                        .join(", ")
                    : workerProfile.skills?.join(", ") || "-"}
                </td>
              </tr>
              <tr>
                <td style={{ color: "#9ca3af" }}>Address</td>
                <td>{workerProfile.location?.address || "-"}</td>
              </tr>
              {workerProfile.location?.lat != null && workerProfile.location?.lng != null && (
                <tr>
                  <td style={{ color: "#9ca3af" }}>Location</td>
                  <td>
                    {workerProfile.location.lat.toFixed(5)},{" "}
                    {workerProfile.location.lng.toFixed(5)}
                  </td>
                </tr>
              )}
              {workerProfile.availability && workerProfile.availability.length > 0 && (
                <tr>
                  <td style={{ color: "#9ca3af" }}>Availability</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {workerProfile.availability.map((slot, idx) => {
                        const days = [
                          "Sunday",
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday",
                          "Friday",
                          "Saturday"
                        ];
                        return (
                          <span key={idx} style={{ fontSize: "0.9rem" }}>
                            {days[slot.dayOfWeek]}: {slot.startTime} - {slot.endTime}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ marginTop: "1rem" }}>
            <a href="/worker/profile" className="btn-primary" style={{ textDecoration: "none" }}>
              Edit Profile
            </a>
          </div>
        </section>
      )}

      {/* Booking History Section */}
      {(user.role === "user" || user.role === "worker") && (
        <section className="panel" style={{ marginTop: "1rem" }}>
          <div className="panel-header">
            <h3>Booking History</h3>
            <span className="subtle">{bookings.length} total</span>
          </div>
          {bookings.length === 0 ? (
            <p className="info">No bookings yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Job</th>
                    {user.role === "user" && <th>Worker</th>}
                    {user.role === "worker" && <th>Client</th>}
                    <th>Status</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id}>
                      <td>
                        {new Date(b.scheduledAt).toLocaleDateString()}{" "}
                        {new Date(b.scheduledAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                        {b.scheduledTo && (
                          <>
                            {" "}
                            –{" "}
                            {new Date(b.scheduledTo).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </>
                        )}
                      </td>
                      <td>{b.jobName || "-"}</td>
                      {user.role === "user" && (
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            {b.worker?.profilePhoto && (
                              <img
                                src={b.worker.profilePhoto}
                                alt={b.worker?.user?.name || "Worker"}
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "50%",
                                  objectFit: "cover"
                                }}
                              />
                            )}
                            <span>
                              {b.worker?.user?.name || (
                                <span style={{ color: "#9ca3af" }}>Not assigned</span>
                              )}
                            </span>
                          </div>
                        </td>
                      )}
                      {user.role === "worker" && (
                        <td>{b.user?.name || "-"}</td>
                      )}
                      <td>
                        <span className={`status-pill ${b.status}`}>{b.status}</span>
                      </td>
                      <td>{b.location?.address || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
