import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminPage() {
  const [workers, setWorkers] = useState([]);
  const [users, setUsers] = useState([]);

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

  return (
    <div className="card">
      <h2>Admin dashboard</h2>
      <section>
        <h3>Workers</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Skills</th>
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
                <td>{w.skills?.join(", ")}</td>
                <td>{w.isApproved ? "Yes" : "No"}</td>
                <td>{w.isActive ? "Yes" : "No"}</td>
                <td>
                  {w.averageRating?.toFixed(1) || 0} ({w.reviewCount} reviews)
                </td>
                <td>
                  {!w.isApproved && (
                    <button onClick={() => approveWorker(w._id)}>Approve</button>
                  )}
                  {w.isActive && (
                    <button onClick={() => fireWorker(w._id)}>Fire</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Users</h3>
        <ul>
          {users.map((u) => (
            <li key={u._id}>
              {u.name} — {u.email}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

