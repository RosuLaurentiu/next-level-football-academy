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
  const [message, setMessage] = useState("Câștigă progres doar după ce termini cu adevărat exercițiile de antrenament.");

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
    setMessage("Jucătorul demo este pregătit. Apasă butonul și intră în academie.");
  };

  return (
    <div className="screen screen--login">
      <section className="login-hero">
        <div className="login-hero__ball">
          <Icon name="ball" className="login-hero__ball-icon" />
        </div>
        <div className="login-hero__content">
          <span className="hero-card__eyebrow">Next Level Football Academy</span>
          <h1>Antrenează-te acasă. Crește în fiecare zi.</h1>
          <p>
            O lume de fotbal plină de energie pentru copii de 8-13 ani, unde îți crești
            tehnica, disciplina și încrederea.
          </p>
        </div>
      </section>

      <div className="login-tabs">
        <button
          className={mode === "login" ? "login-tabs__button login-tabs__button--active" : "login-tabs__button"}
          onClick={() => setMode("login")}
        >
          Autentificare
        </button>
        <button
          className={mode === "signup" ? "login-tabs__button login-tabs__button--active" : "login-tabs__button"}
          onClick={() => setMode("signup")}
        >
          Creează cont
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
              {requiresEmailAuth ? "Email" : "Nume utilizator"}
              <input
                className="input"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={requiresEmailAuth ? "jucator@email.com" : "Numele tău de jucător"}
              />
            </label>
          ) : (
            <>
              <label className="label">
                Nume utilizator
                <input
                  className="input"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Numele tău de jucător"
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
                    placeholder="jucator@email.com"
                  />
                </label>
              )}
            </>
          )}

          <label className="label">
            Parolă
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Introdu parola"
              onKeyDown={(event) => event.key === "Enter" && void handleSubmit()}
            />
          </label>

          {mode === "signup" && (
            <div className="avatar-picker">
              <span className="label">Alege avatarul</span>
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
              Supabase este conectat, așa că autentificarea se face cu email, iar progresul se sincronizează între dispozitive.
            </p>
          )}

          <button
            className="button button--primary button--large"
            onClick={() => void handleSubmit()}
            disabled={submitting}
          >
            {submitting
              ? "Se încarcă..."
              : mode === "login"
                ? "Intră în joc"
                : "Pornește aventura mea"}
          </button>
        </div>
      </div>

      {!usesSupabase && (
        <div className="card card--compact">
          <div className="demo-row">
            <div>
              <strong>Încearcă jucătorul demo</strong>
              <p>Nume utilizator: sam10 | Parolă: academy</p>
            </div>
            <button className="button button--secondary" onClick={useDemoPlayer}>
              Folosește demo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
