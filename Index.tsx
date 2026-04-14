import Home from "./Home";
import Login from "./Login";
import { useAppState } from "./appState";
import { Icon } from "./ui";

export default function Index() {
  const { initializing, player, usesSupabase } = useAppState();

  if (initializing) {
    return (
      <div className="screen screen--login">
        <section className="hero-card">
          <div className="hero-card__icon-wrap">
            <Icon name="ball" className="hero-card__icon" />
          </div>
          <span className="hero-card__eyebrow">Next Level Football Academy</span>
          <h1>Loading Your Training World</h1>
          <p>
            {usesSupabase
              ? "Connecting to your live football profile and latest academy progress."
              : "Preparing your local training profile."}
          </p>
        </section>
      </div>
    );
  }

  return player ? <Home /> : <Login />;
}
