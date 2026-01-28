import { Link, Route, Routes, useNavigate, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import HomePage from "./pages/HomePage.jsx";
import WorkerRegisterPage from "./pages/WorkerRegisterPage.jsx";
import BookingPage from "./pages/BookingPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ClientDashboard from "./pages/ClientDashboard.jsx";
import WorkerDashboard from "./pages/WorkerDashboard.jsx";

function AppShell() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">Worker Booking</div>
        <nav className="nav">
          {user?.role === "user" && <Link to="/client">Client</Link>}
          {user?.role === "worker" && <Link to="/worker">Worker</Link>}
          {user?.role === "admin" && <Link to="/admin">Admin</Link>}
          <Link to="/book">Book Worker</Link>
          {!user && <Link to="/login">Login</Link>}
          {!user && <Link to="/register">Register</Link>}
          {user && (
            <button className="btn-secondary" onClick={handleLogout}>
              Logout ({user.role})
            </button>
          )}
        </nav>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage onRegister={handleLogin} />} />
          <Route path="/client" element={<ClientDashboard />} />
          <Route path="/worker" element={<WorkerDashboard />} />
          <Route path="/book" element={requireAuth(<BookingPage />)} />
          <Route path="/worker/register" element={<WorkerRegisterPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return <AppShell />;
}

