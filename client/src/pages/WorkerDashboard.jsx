import { Link } from "react-router-dom";

export default function WorkerDashboard() {
  return (
    <div className="card">
      <h2>Worker dashboard</h2>
      <p>
        Here workers can manage their profile and see assigned jobs. First, make sure your
        worker profile is registered and approved by the admin.
      </p>
      <Link to="/worker/register" className="btn-secondary">
        Go to worker registration
      </Link>
    </div>
  );
}

