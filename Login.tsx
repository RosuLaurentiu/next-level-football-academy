import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AVATARS } from "./appData";
import { useAppState } from "./appState";
import { AvatarBadge, Icon } from "./ui";

export default function Login() {
  const navigate = useNavigate();
  const { login, signUp, requiresEmailAuth, usesSupabase } = useAppState();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarId, setAvatarId] = useState(AVATARS[0].id);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("Earn progress by completing real training drills every day.");

  const handleSubmit = async () => {
    setSubmitting(true);
    const result = mode === "login"
      ? await login(identifier, password)
      : await signUp(username, password, avatarId, email);
    setSubmitting(false);

    setMessage(result.message);

    if (result.ok && !result.requiresVerification) {
      navigate("/");
    }
  };

  const useDemoPlayer = () => {
    setMode("login");
    setIdentifier("sam10");
    setPassword("academy");
    setMessage("Demo player ready. Tap the button to enter the academy.");
  };

  return (
    <div className="screen screen--login">
      <section className="login-hero">
        <div className="login-hero__ball">
          <Icon name="ball" className="login-hero__ball-icon" />
        </div>
        <div className="login-hero__content">
          <span className="hero-card__eyebrow">Next Level Football Academy</span>
          <h1>Train at Home. Grow Every Day.</h1>
          <p>
            A bright football world for children aged 8 to 13 to build skill, discipline,
            and confidence.
          </p>
        </div>
      </section>

      <div className="login-tabs">
        <button
          className={mode === "login" ? "login-tabs__button login-tabs__button--active" : "login-tabs__button"}
          onClick={() => setMode("login")}
        >
          Log In
        </button>
        <button
          className={mode === "signup" ? "login-tabs__button login-tabs__button--active" : "login-tabs__button"}
          onClick={() => setMode("signup")}
        >
          Create Account
        </button>
      </div>

      <div className="card login-card">
        <div className="message-banner">
          <Icon name="flag" className="message-banner__icon" />
          <p>{message}</p>
        </div>

        <div className="form-grid">
          {mode === "login" ? (
            <label className="label">
              {requiresEmailAuth ? "Email" : "Username"}
              <input
                className="input"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={requiresEmailAuth ? "player@email.com" : "Your player name"}
              />
            </label>
          ) : (
            <>
              <label className="label">
                Username
                <input
                  className="input"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Your player name"
                />
              </label>

              {requiresEmailAuth && (
                <label className="label">
                  Email
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="player@email.com"
                  />
                </label>
              )}
            </>
          )}

          <label className="label">
            Password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              onKeyDown={(event) => event.key === "Enter" && void handleSubmit()}
            />
          </label>

          {mode === "signup" && (
            <div className="avatar-picker">
              <span className="label">Choose Avatar</span>
              <div className="avatar-picker__grid">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    className={avatarId === avatar.id ? "avatar-option avatar-option--active" : "avatar-option"}
                    onClick={() => setAvatarId(avatar.id)}
                  >
                    <AvatarBadge avatarId={avatar.id} size="small" />
                    <span>{avatar.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {usesSupabase && (
            <p className="empty-copy">
              Supabase is connected, so account login uses email and progress syncs between devices.
            </p>
          )}

          <button
            className="button button--primary button--large"
            onClick={() => void handleSubmit()}
            disabled={submitting}
          >
            {submitting
              ? "Saving..."
              : mode === "login"
                ? "Enter Training App"
                : "Start My Academy"}
          </button>
        </div>
      </div>

      {!usesSupabase && (
        <div className="card card--compact">
          <div className="demo-row">
            <div>
              <strong>Try the demo player</strong>
              <p>Username: sam10 | Password: academy</p>
            </div>
            <button className="button button--secondary" onClick={useDemoPlayer}>
              Use Demo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
