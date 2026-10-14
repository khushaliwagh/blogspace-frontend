
import { useState } from "react";
import "./Auth.css";

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      // Get the current CSRF token before sending the request.
      const csrfResponse = await fetch("/api/auth/csrf", {
        credentials: "include",
      });

      if (!csrfResponse.ok) {
        throw new Error("Could not get the security token.");
      }

      const csrf = await csrfResponse.json();

      const endpoint =
        mode === "login"
          ? "/api/auth/login"
          : "/api/auth/register";

      const body =
        mode === "login"
          ? { email: email.trim(), password }
          : { name: name.trim(), email: email.trim(), password };

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          [csrf.headerName]: csrf.token,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
          data.message ||
          (response.status === 409
            ? "This email is already registered."
            : response.status === 403
              ? "Security check failed. Please try again."
              : response.status === 401
                ? "Invalid email or password."
                : "Request failed. Please try again.")
        );
      }

      if (mode === "register") {
        setMode("login");
        setPassword("");
        setMessage("Registration successful! Please log in.");
      } else {
        // Notify App.jsx that login succeeded.
        onLogin(data);
      }
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a className="auth-brand" href="/">
          blogspace<span>.</span>
        </a>

        <p className="auth-kicker">YOUR IDEAS DESERVE A HOME</p>

        <h1>
          {mode === "login" ? (
            <>Welcome <em>back.</em></>
          ) : (
            <>Join the <em>conversation.</em></>
          )}
        </h1>

        <p className="auth-description">
          {mode === "login"
            ? "Log in to share your ideas and stories."
            : "Create an account and share what you discover."}
        </p>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <label>
              YOUR NAME
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your name"
                maxLength={100}
                autoComplete="name"
                required
              />
            </label>
          )}

          <label>
            EMAIL ADDRESS
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              maxLength={150}
              required
            />
          </label>

          <label>
            PASSWORD
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              maxLength={72}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
            />
          </label>

          {message && (
            <p className="auth-message" role="status">
              {message}
            </p>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Log in ↗"
                : "Create account ↗"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login"
            ? "New to BlogSpace?"
            : "Already have an account?"}

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setMessage("");
            }}
          >
            {mode === "login" ? " Create account" : " Log in"}
          </button>
        </p>
      </section>
    </main>
  );
}
