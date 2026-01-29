import { Link, Route, Routes, useNavigate, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import HomePage from "./pages/HomePage.jsx";
import WorkerRegisterPage from "./pages/WorkerRegisterPage.jsx";
import BookingPage from "./pages/BookingPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import ClientDashboard from "./pages/ClientDashboard.jsx";
import WorkerDashboard from "./pages/WorkerDashboard.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

function AppShell() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleLogin = (u) => {
    setUser(u);
    localStorage.setItem("currentUser", JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const requireAuth = (element) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return element;
  };

  const isAuthRoute =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <div className="app">
      {!isAuthRoute && (
        <header className="topbar">
          <div className="logo">Worker Booking</div>
          <nav className="nav">
            {user?.role === "user" && <Link to="/book">Book Worker</Link>}
            {user?.role === "user" && <Link to="/client">Client</Link>}
            {user?.role === "worker" && (
              <>
                <Link to="/worker">Dashboard</Link>
                <Link to="/worker/profile">Edit Profile</Link>
              </>
            )}
            {user?.role === "admin" && <Link to="/admin">Admin</Link>}
            {user && <Link to="/profile">Profile</Link>}
            {!user && <Link to="/login">Login</Link>}
            {!user && <Link to="/register">Register</Link>}
            {user && (
              <button className="btn-secondary" onClick={handleLogout}>
                Logout ({user.role})
              </button>
            )}
          </nav>
        </header>
      )}
      <main className={isAuthRoute ? "auth-content" : "content"}>
        <Routes>
          <Route path="/" element={<AuthPage onAuth={handleLogin} />} />
          <Route path="/login" element={<AuthPage onAuth={handleLogin} />} />
          <Route path="/register" element={<AuthPage onAuth={handleLogin} />} />
          <Route path="/client" element={<ClientDashboard />} />
          <Route path="/worker" element={<WorkerDashboard />} />
          <Route path="/book" element={requireAuth(<BookingPage />)} />
          <Route path="/worker/profile" element={<WorkerRegisterPage />} />
          <Route path="/worker/register" element={<WorkerRegisterPage />} />
          <Route path="/profile" element={requireAuth(<ProfilePage />)} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return <AppShell />;
}

