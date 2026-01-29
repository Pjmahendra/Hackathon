import { useEffect, useState } from "react";
import axios from "axios";

export default function WorkerDashboard() {
  const [workerId, setWorkerId] = useState("");
  const [newRequests, setNewRequests] = useState([]);
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [message, setMessage] = useState("");
  const [ratingInfo, setRatingInfo] = useState({ averageRating: 0, reviewCount: 0 });

  const loadBookings = async (workerId) => {
    try {
      setMessage(""); // Clear any previous errors
      // Load new requests (pending, unassigned)
      const resNewRequests = await axios.get(
        `/api/bookings/open-for-worker/${workerId}`
      );
      setNewRequests(resNewRequests.data || []);

      // Load assigned jobs (accepted)
      const resAssigned = await axios.get(`/api/bookings/worker/${workerId}`);
      const accepted = (resAssigned.data || []).filter((b) => b.status === "accepted");
      setAssignedJobs(accepted);
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not load your bookings.");
    }
  };

  useEffect(() => {
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

      // find worker profile by user id
      try {
        const resWorkers = await axios.get("/api/workers", { params: { byUser: user.id } });
        const worker = resWorkers.data?.[0];
        if (!worker?._id) {
          setMessage("Please complete your worker profile first.");
          return;
        }
        setRatingInfo({
          averageRating: worker.averageRating || 0,
          reviewCount: worker.reviewCount || 0
        });
        setWorkerId(worker._id);
        await loadBookings(worker._id);
      } catch (err) {
        setMessage(err.response?.data?.message || "Could not load your bookings.");
      }
    };
    load();
  }, []);

  const acceptBooking = async (id) => {
    try {
      await axios.patch(`/api/bookings/${id}/accept`, { workerId });
      await loadBookings(workerId);
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not accept booking.");
    }
  };

  const markDone = async (id) => {
    try {
      await axios.patch(`/api/bookings/${id}/mark-done`, { by: "worker" });
      await loadBookings(workerId);
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not mark as done.");
    }
  };

  const cancelBooking = async (id) => {
    try {
      await axios.patch(`/api/bookings/${id}/cancel-worker`);
      await loadBookings(workerId);
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not cancel booking.");
    }
  };

  return (
    <div className="card">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <div className="subtle">Manage new requests and your current jobs.</div>
        </div>
        <div className="stats-row">
          <div className="stat-pill">
            Rating: {Number(ratingInfo.averageRating || 0).toFixed(1)} ({ratingInfo.reviewCount})
          </div>
          <div className="stat-pill">New requests: {newRequests.length}</div>
          <div className="stat-pill">Assigned: {assignedJobs.length}</div>
        </div>
      </div>

      {message && <p className="info">{message}</p>}

      <div className="worker-grid">
        <section className="panel">
          <div className="panel-header">
            <h3>New requests</h3>
            <span className="status-pill pending">{newRequests.length}</span>
          </div>

          {newRequests.length === 0 ? (
            <p className="subtle">No new requests right now.</p>
          ) : (
            <ul className="item-list">
              {newRequests.map((b) => (
                <li key={b._id} className="item-card">
                  <div className="item-row">
                    <strong>{b.jobName || "Job request"}</strong>
                    <span className="status-pill pending">pending</span>
                  </div>
                  {b.description && <div className="item-meta">{b.description}</div>}
                  <div className="item-meta">
                    <div>
                      <strong>Client:</strong> {b.user?.name || "Client"}
                    </div>
                    <div>
                      <strong>When:</strong>{" "}
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
                    </div>
                  </div>
                  <div className="actions-row">
                    <button className="btn-primary" onClick={() => acceptBooking(b._id)}>
                      Accept
                    </button>
                    <button className="btn-secondary" onClick={() => cancelBooking(b._id)}>
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <h3>Your assigned jobs</h3>
            <span className="status-pill accepted">{assignedJobs.length}</span>
          </div>

          {assignedJobs.length === 0 ? (
            <p className="subtle">No active jobs yet.</p>
          ) : (
            <ul className="item-list">
              {assignedJobs.map((b) => (
                <li key={b._id} className="item-card">
                  <div className="item-row">
                    <strong>{b.jobName || "Job"}</strong>
                    <span className="status-pill accepted">accepted</span>
                  </div>
                  {b.description && <div className="item-meta">{b.description}</div>}
                  <div className="item-meta">
                    <div>
                      <strong>Client:</strong> {b.user?.name || "Client"}
                    </div>
                    <div>
                      <strong>When:</strong>{" "}
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
                    </div>
                  </div>
                  <div className="actions-row">
                    <button className="btn-primary" onClick={() => markDone(b._id)}>
                      Mark done
                    </button>
                    <button className="btn-danger" onClick={() => cancelBooking(b._id)}>
                      Cancel
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

