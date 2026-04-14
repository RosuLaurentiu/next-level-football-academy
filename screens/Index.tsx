import { Icon } from "../components/ui";
import { useAppState } from "../state/appState";
import Home from "./Home";
import Login from "./Login";

export default function Index() {
  const { initializing, player, usesSupabase } = useAppState();

  if (initializing) {
    return (
      <div className="screen screen--login">
        <section className="hero-card">
          <div className="hero-card__icon-wrap">
            <Icon name="ball" className="hero-card__icon" />
          </div>
          <span className="hero-card__eyebrow">NEXT LEVEL FOOTBALL ACADEMY</span>
          <h1>Se pregateste academia</h1>
          <p>
            {usesSupabase
              ? "Conectam progresul tau live."
              : "Pregatim profilul local."}
          </p>
        </section>
      </div>
    );
  }

  return player ? <Home /> : <Login />;
}
