import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../components/ui";
import { useAppState } from "../state/appState";

export default function Login() {
  const navigate = useNavigate();
  const { login, signUp, requiresEmailAuth, usesSupabase } = useAppState();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("Progresul vine doar după antrenament real.");

  const handleSubmit = async () => {
    setSubmitting(true);
    const result =
      mode === "login"
        ? await login(identifier, password)
        : await signUp(username, password, email);
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
    setMessage("Contul demo este pregătit.");
  };

  return (
    <div className="screen screen--login">
      <section className="login-hero">
        <div className="login-hero__ball">
          <Icon name="ball" className="login-hero__ball-icon" />
        </div>

        <div className="login-hero__content">
          <span className="hero-card__eyebrow">BINE AI VENIT ÎN ACADEMIE</span>
          <h1>Intră în academie.</h1>
          <p>Un sistem clar. Un progres real. O experiență mai curată.</p>
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
        <div className="login-card__intro">
          <span className="card__eyebrow">{mode === "login" ? "Acces jucător" : "Cont nou"}</span>
          <h2>{mode === "login" ? "Continuă antrenamentul" : "Intră în program"}</h2>
          <p>{mode === "login" ? "Autentificare rapidă și clară." : "Ai nevoie doar de nume, email și parolă."}</p>
        </div>

        <div className="form-grid">
          {mode === "login" ? (
            <label className="label">
              {requiresEmailAuth ? "Email" : "Nume utilizator"}
              <input
                className="input"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={requiresEmailAuth ? "jucator@email.com" : "Nume utilizator"}
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
                  placeholder="Nume utilizator"
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

          {usesSupabase && <p className="login-note">Progresul tău este sincronizat live.</p>}

          <button
            className="button button--primary button--large"
            onClick={() => void handleSubmit()}
            disabled={submitting}
          >
            {submitting ? "Se încarcă..." : mode === "login" ? "Intră în joc" : "Creează cont"}
          </button>

          <p className="login-feedback">{message}</p>
        </div>
      </div>

      {!usesSupabase && (
        <div className="card card--compact">
          <div className="demo-row">
            <div>
              <strong>Cont demo</strong>
              <p>sam10 / academy</p>
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
