
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(
    () => sessionStorage.getItem("token") || ""
  );
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message ||
          (response.status === 409
            ? "This appointment is no longer available."
            : `Request failed (${response.status}).`)
      );
    }

    return data;
  }

  async function loadData() {
    try {
      const slotPath =
        user?.role === "provider" ? "/slots/mine" : "/slots";

      const slotData = await request(slotPath);
      setSlots(slotData.slots || []);

      if (token) {
        const bookingData = await request("/bookings/mine");
        setBookings(bookingData.bookings || []);
      }
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    if (token && user) {
      loadData();
    }
  }, [token, user]);

  async function handleAuth(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      if (form.name.trim().length < 2 && page === "register") {
        throw new Error("Name must contain at least 2 characters.");
      }

      if (form.password.length < 8 && page === "register") {
        throw new Error("Password must contain at least 8 characters.");
      }

      const endpoint =
        page === "register" ? "/auth/register" : "/auth/login";

      const payload =
        page === "register"
          ? {
              name: form.name.trim(),
              email: form.email.trim(),
              password: form.password,
              role: form.role,
            }
          : {
              email: form.email.trim(),
              password: form.password,
            };

      const data = await request(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);
      setPage("dashboard");
      setMessage(data.message || "Success!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function createSlot(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      if (
        !startAt ||
        !endAt ||
        new Date(startAt) <= new Date() ||
        new Date(endAt) <= new Date(startAt)
      ) {
        throw new Error("Choose a future start time and a later end time.");
      }

      await request("/slots", {
        method: "POST",
        body: JSON.stringify({
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
        }),
      });

      setStartAt("");
      setEndAt("");
      setMessage("Appointment slot created successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function bookSlot(slotId) {
    setBusy(true);
    setMessage("");

    try {
      await request("/bookings", {
        method: "POST",
        body: JSON.stringify({ slotId }),
      });

      setMessage("Appointment booked successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.message);
      await loadData();
    } finally {
      setBusy(false);
    }
  }

  async function cancelBooking(bookingId) {
    setBusy(true);
    setMessage("");

    try {
      await request(`/bookings/${bookingId}/cancel`, {
        method: "PATCH",
      });

      setMessage("Appointment cancelled successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setToken("");
    setUser(null);
    setSlots([]);
    setBookings([]);
    setMessage("You have logged out.");
    setPage("home");
  }

  function formatDate(value) {
    return new Date(value).toLocaleString();
  }

  return (
    <div className="app">
      <nav className="navbar">
        <button className="brand" onClick={() => setPage("home")}>
          <span className="brand-icon">S</span>
          SapphireIQ
        </button>

        <div className="nav-links">
          {!user ? (
            <>
              <button onClick={() => setPage("home")}>Home</button>
              <button onClick={() => setPage("login")}>Login</button>
              <button
                className="nav-cta"
                onClick={() => setPage("register")}
              >
                Get Started
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setPage("dashboard")}>
                Dashboard
              </button>
              <span>{user.name} ({user.role})</span>
              <button onClick={logout}>Logout</button>
            </>
          )}
        </div>
      </nav>

      <main className="main-content">
        {page === "home" && !user && (
          <section className="hero">
            <div className="hero-content">
              <div className="eyebrow">
                YOUR TIME. YOUR HEALTH. YOUR CHOICE.
              </div>
              <h1>
                Better care begins
                <br />
                with a <span>simple booking.</span>
              </h1>
              <p>
                Discover available appointments, book a suitable time,
                and manage your schedule in one place.
              </p>
              <div className="hero-actions">
                <button
                  className="primary-btn"
                  onClick={() => setPage("register")}
                >
                  Create your account →
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => setPage("login")}
                >
                  Sign in
                </button>
              </div>
            </div>
          </section>
        )}

        {(page === "login" || page === "register") && !user && (
          <section className="auth-layout">
            <div className="auth-info">
              <div className="eyebrow">WELCOME TO SAPPHIREIQ</div>
              <h1>
                Your schedule,
                <br />
                <span>made simpler.</span>
              </h1>
              <p>Sign in or create an account to manage appointments.</p>
            </div>

            <form className="auth-card" onSubmit={handleAuth}>
              <h2>
                {page === "register" ? "Create account" : "Sign in"}
              </h2>

              {page === "register" && (
                <>
                  <label>
                    Full name
                    <input
                      required
                      minLength={2}
                      maxLength={80}
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Your full name"
                    />
                  </label>

                  <label>
                    Account type
                    <select
                      value={form.role}
                      onChange={(e) =>
                        setForm({ ...form, role: e.target.value })
                      }
                    >
                      <option value="user">Patient / User</option>
                      <option value="provider">Appointment Provider</option>
                    </select>
                  </label>
                </>
              )}

              <label>
                Email address
                <input
                  required
                  type="email"
                  maxLength={254}
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="you@example.com"
                />
              </label>

              <label>
                Password
                <input
                  required
                  type="password"
                  minLength={page === "register" ? 8 : 1}
                  maxLength={128}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Enter your password"
                />
              </label>

              <button
                className="primary-btn full-btn"
                type="submit"
                disabled={busy}
              >
                {busy
                  ? "Please wait..."
                  : page === "register"
                    ? "Create account"
                    : "Sign in"}
              </button>

              <p>{message}</p>

              <p className="switch-text">
                {page === "register"
                  ? "Already have an account?"
                  : "New to SapphireIQ?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setPage(page === "register" ? "login" : "register");
                  }}
                >
                  {page === "register" ? "Sign in" : "Create account"}
                </button>
              </p>
            </form>
          </section>
        )}

        {page === "dashboard" && user && (
          <section className="dashboard">
            <div className="dashboard-heading">
              <div>
                <div className="eyebrow">YOUR PERSONAL SPACE</div>
                <h1>Welcome, {user.name}!</h1>
                <p>
                  Account type: <strong>{user.role}</strong>
                </p>
              </div>
              <button className="secondary-btn" onClick={loadData}>
                Refresh
              </button>
            </div>

            {message && (
              <p className="message" role="status">
                {message}
              </p>
            )}

            {user.role === "provider" && (
              <section className="dashboard-card">
                <h2>Create an appointment slot</h2>
                <form onSubmit={createSlot} className="slot-form">
                  <label>
                    Start date and time
                    <input
                      type="datetime-local"
                      required
                      value={startAt}
                      onChange={(e) => setStartAt(e.target.value)}
                    />
                  </label>
                  <label>
                    End date and time
                    <input
                      type="datetime-local"
                      required
                      value={endAt}
                      onChange={(e) => setEndAt(e.target.value)}
                    />
                  </label>
                  <button className="primary-btn" disabled={busy}>
                    Create slot
                  </button>
                </form>
              </section>
            )}

            <section className="dashboard-card">
              <h2>
                {user.role === "provider"
                  ? "My appointment slots"
                  : "Available appointments"}
              </h2>

              {slots.length === 0 ? (
                <p>No slots found. Please refresh or check again later.</p>
              ) : (
                <div className="appointment-list">
                  {slots.map((slot) => (
                    <article className="appointment-item" key={slot._id}>
                      <div>
                        <strong>{formatDate(slot.startAt)}</strong>
                        <p>Ends: {formatDate(slot.endAt)}</p>
                        {user.role === "user" && (
                          <p>Provider: {slot.provider?.name || "Provider"}</p>
                        )}
                      </div>

                      {user.role === "user" && (
                        <button
                          className="primary-btn"
                          disabled={busy}
                          onClick={() => bookSlot(slot._id)}
                        >
                          Book appointment
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="dashboard-card">
              <h2>My bookings</h2>

              {bookings.length === 0 ? (
                <p>You have no bookings yet.</p>
              ) : (
                <div className="appointment-list">
                  {bookings.map((booking) => (
                    <article className="appointment-item" key={booking._id}>
                      <div>
                        <strong>
                          {booking.slot?.startAt
                            ? formatDate(booking.slot.startAt)
                            : "Appointment"}
                        </strong>
                        <p>Status: {booking.status}</p>
                        <p>
                          Provider: {booking.provider?.name || "Provider"}
                        </p>
                      </div>

                      {booking.status === "booked" && (
                        <button
                          className="secondary-btn"
                          disabled={busy}
                          onClick={() => cancelBooking(booking._id)}
                        >
                          Cancel booking
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>
        )}
      </main>

      <footer>
        <span>© 2026 SapphireIQ</span>
        <span>Appointment booking made simpler.</span>
      </footer>
    </div>
  );
}
