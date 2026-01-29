import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminPage() {
  const [workers, setWorkers] = useState([]);
  const [users, setUsers] = useState([]);

  const [visitsWorker, setVisitsWorker] = useState(null);
  const [workerVisits, setWorkerVisits] = useState([]);
  const [workerVisitsMessage, setWorkerVisitsMessage] = useState("");

  const [userVisitsClient, setUserVisitsClient] = useState(null);
  const [userVisits, setUserVisits] = useState([]);
  const [userVisitsMessage, setUserVisitsMessage] = useState("");
  const [userBookings, setUserBookings] = useState([]);
  const [userBookingsMessage, setUserBookingsMessage] = useState("");

  const load = async () => {
    const [wRes, uRes] = await Promise.all([
      axios.get("/api/admin/workers"),
      axios.get("/api/admin/users")
    ]);
    setWorkers(wRes.data);
    setUsers(uRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const approveWorker = async (id) => {
    await axios.post(`/api/admin/workers/${id}/approve`);
    load();
  };

  const fireWorker = async (id) => {
    await axios.post(`/api/admin/workers/${id}/fire`);
    load();
  };

  const rehireWorker = async (id) => {
    await axios.post(`/api/admin/workers/${id}/rehire`);
    load();
  };

  const viewWorkerVisits = async (worker) => {
    setVisitsWorker(worker);
    setWorkerVisits([]);
    setWorkerVisitsMessage("Loading visits...");
    try {
      const res = await axios.get(`/api/admin/workers/${worker._id}/visits`);
      setWorkerVisits(res.data || []);
      setWorkerVisitsMessage("");
    } catch (err) {
      setWorkerVisitsMessage(err.response?.data?.message || "Could not load visits.");
    }
  };

  const viewClientVisits = async (user) => {
    setUserVisitsClient(user);
    setUserVisits([]);
    setUserVisitsMessage("Loading visits...");
    setUserBookings([]);
    setUserBookingsMessage("Loading bookings...");
    try {
      const [visitsRes, bookingsRes] = await Promise.all([
        axios.get(`/api/admin/users/${user._id}/visits`),
        axios.get(`/api/bookings/user/${user._id}`)
      ]);
      setUserVisits(visitsRes.data || []);
      setUserVisitsMessage("");
      setUserBookings(bookingsRes.data || []);
      setUserBookingsMessage("");
    } catch (err) {
      setUserVisitsMessage(err.response?.data?.message || "Could not load visits.");
      setUserBookingsMessage(err.response?.data?.message || "Could not load bookings.");
    }
  };

  return (
    <div className="card">
      <h2>Admin dashboard</h2>

      <section style={{ marginTop: "1rem" }}>
        <h3>Workers</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Jobs & prices</th>
              <th>Address</th>
              <th>Approved</th>
              <th>Active</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <tr key={w._id}>
                <td>{w.user?.name || "-"}</td>
                <td>
                  {w.jobs && w.jobs.length
                    ? w.jobs.map((j) => `${j.name} (₹${j.pricePerHour}/hr)`).join(", ")
                    : w.skills?.join(", ")}
                </td>
                <td>{w.location?.address || "-"}</td>
                <td>{w.isApproved ? "Yes" : "No"}</td>
                <td>{w.isActive ? "Yes" : "No"}</td>
                <td>
                  {w.averageRating?.toFixed(1) || 0} ({w.reviewCount} reviews)
                </td>
                <td>
                  {!w.isApproved && (
                    <button onClick={() => approveWorker(w._id)}>Approve</button>
                  )}
                  {w.isActive && <button onClick={() => fireWorker(w._id)}>Fire</button>}
                  {!w.isActive && <button onClick={() => rehireWorker(w._id)}>Rehire</button>}
                  <button
                    onClick={() => {
                      if (visitsWorker?._id === w._id) {
                        setVisitsWorker(null);
                        setWorkerVisits([]);
                        setWorkerVisitsMessage("");
                      } else {
                        viewWorkerVisits(w);
                      }
                    }}
                    style={{ marginLeft: "0.5rem", fontSize: "1rem", padding: "0.25rem 0.5rem", minWidth: "2rem" }}
                    title="View details and visits"
                  >
                    {visitsWorker?._id === w._id ? "▼" : "▶"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {visitsWorker && (
          <div style={{ marginTop: "1rem" }}>
            <h3>Worker Details & Visits — {visitsWorker.user?.name || "Worker"}</h3>
            
            {/* Worker Details Section */}
            <div style={{ marginBottom: "1rem", padding: "0.75rem", border: "1px solid rgba(148, 163, 184, 0.25)", borderRadius: "0.5rem", background: "rgba(15, 23, 42, 0.55)" }}>
              <h4 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Worker Information</h4>
              {visitsWorker.profilePhoto && (
                <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
                  <img
                    src={visitsWorker.profilePhoto}
                    alt={visitsWorker.user?.name || "Worker"}
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
                    <td style={{ width: "140px", color: "#9ca3af" }}>Name</td>
                    <td>{visitsWorker.user?.name || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#9ca3af" }}>Email</td>
                    <td>{visitsWorker.user?.email || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#9ca3af" }}>Phone</td>
                    <td>{visitsWorker.user?.phone || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#9ca3af" }}>Address</td>
                    <td>{visitsWorker.location?.address || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#9ca3af" }}>Jobs & Prices</td>
                    <td>
                      {visitsWorker.jobs && visitsWorker.jobs.length
                        ? visitsWorker.jobs.map((j) => `${j.name} (₹${j.pricePerHour}/hr)`).join(", ")
                        : visitsWorker.skills?.join(", ") || "-"}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: "#9ca3af" }}>Approved</td>
                    <td>{visitsWorker.isApproved ? "Yes" : "No"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#9ca3af" }}>Active</td>
                    <td>{visitsWorker.isActive ? "Yes" : "No"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#9ca3af" }}>Rating</td>
                    <td>
                      {visitsWorker.averageRating?.toFixed(1) || 0} ({visitsWorker.reviewCount}{" "}
                      reviews)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Visits Section */}
            <h4>Visited Locations</h4>
            {workerVisitsMessage && <p className="info">{workerVisitsMessage}</p>}
            {!workerVisitsMessage && workerVisits.length === 0 && (
              <p className="info">No visits yet (no assigned bookings with location).</p>
            )}
            {workerVisits.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Job</th>
                      <th>Status</th>
                      <th>Address</th>
                      <th>Lat, Lng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workerVisits.map((v) => (
                      <tr key={v._id}>
                        <td>
                          {new Date(v.scheduledAt).toLocaleDateString()}{" "}
                          {new Date(v.scheduledAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                          {v.scheduledTo && (
                            <>
                              {" "}
                              –{" "}
                              {new Date(v.scheduledTo).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </>
                          )}
                        </td>
                        <td>{v.jobName || "-"}</td>
                        <td>{v.status}</td>
                        <td>{v.location?.address || "-"}</td>
                        <td>
                          {typeof v.location?.lat === "number" &&
                          typeof v.location?.lng === "number"
                            ? `${v.location.lat.toFixed(5)}, ${v.location.lng.toFixed(5)}`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ marginTop: "0.5rem" }}>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => {
                  setVisitsWorker(null);
                  setWorkerVisits([]);
                  setWorkerVisitsMessage("");
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h3>Users</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <button
                    onClick={() => {
                      if (userVisitsClient?._id === u._id) {
                        setUserVisitsClient(null);
                        setUserVisits([]);
                        setUserVisitsMessage("");
                        setUserBookings([]);
                        setUserBookingsMessage("");
                      } else {
                        viewClientVisits(u);
                      }
                    }}
                    style={{ fontSize: "1rem", padding: "0.25rem 0.5rem", minWidth: "2rem" }}
                    title="View details and visits"
                  >
                    {userVisitsClient?._id === u._id ? "▼" : "▶"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {userVisitsClient && (
          <div style={{ marginTop: "1rem" }}>
            <h3>User Details & Bookings — {userVisitsClient.name}</h3>
            
            {/* User Details Section */}
            <div style={{ marginBottom: "1rem", padding: "0.75rem", border: "1px solid rgba(148, 163, 184, 0.25)", borderRadius: "0.5rem", background: "rgba(15, 23, 42, 0.55)" }}>
              <h4 style={{ marginTop: 0, marginBottom: "0.5rem" }}>User Information</h4>
              <table className="table" style={{ margin: 0 }}>
                <tbody>
                  <tr>
                    <td style={{ width: "140px", color: "#9ca3af" }}>Name</td>
                    <td>{userVisitsClient.name || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#9ca3af" }}>Email</td>
                    <td>{userVisitsClient.email || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#9ca3af" }}>Phone</td>
                    <td>{userVisitsClient.phone || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#9ca3af" }}>Role</td>
                    <td>{userVisitsClient.role || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* All Bookings Section */}
            <h4>All Bookings</h4>
            {userBookingsMessage && <p className="info">{userBookingsMessage}</p>}
            {!userBookingsMessage && userBookings.length === 0 && (
              <p className="info">No bookings yet.</p>
            )}
            {userBookings.length > 0 && (
              <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Job</th>
                      <th>Worker</th>
                      <th>Status</th>
                      <th>Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userBookings.map((b) => (
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
                        <td>{b.worker?.user?.name || "Not assigned"}</td>
                        <td>{b.status}</td>
                        <td>{b.location?.address || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Workers Who Visited Section */}
            <h4>Workers who visited</h4>
            {userVisitsMessage && <p className="info">{userVisitsMessage}</p>}
            {!userVisitsMessage && userVisits.length === 0 && (
              <p className="info">No visits yet (no bookings accepted by a worker).</p>
            )}
            {userVisits.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Worker</th>
                      <th>Job</th>
                      <th>Status</th>
                      <th>Address</th>
                      <th>Lat, Lng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userVisits.map((v) => (
                      <tr key={v._id}>
                        <td>
                          {new Date(v.scheduledAt).toLocaleDateString()}{" "}
                          {new Date(v.scheduledAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                          {v.scheduledTo && (
                            <>
                              {" "}
                              –{" "}
                              {new Date(v.scheduledTo).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </>
                          )}
                        </td>
                        <td>{v.worker?.user?.name || "Worker"}</td>
                        <td>{v.jobName || "-"}</td>
                        <td>{v.status}</td>
                        <td>{v.location?.address || "-"}</td>
                        <td>
                          {typeof v.location?.lat === "number" &&
                          typeof v.location?.lng === "number"
                            ? `${v.location.lat.toFixed(5)}, ${v.location.lng.toFixed(5)}`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ marginTop: "0.5rem" }}>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => {
                  setUserVisitsClient(null);
                  setUserVisits([]);
                  setUserVisitsMessage("");
                  setUserBookings([]);
                  setUserBookingsMessage("");
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

