import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="screen screen--centered">
      <div className="card card--compact not-found-card">
        <span className="hero-card__eyebrow">404</span>
        <h1>Această pagină nu face parte din academie.</h1>
        <p>Folosește butonul de mai jos ca să revii la ecranul principal al aplicației.</p>
        <Link className="button button--primary" to="/">
          Înapoi acasă
        </Link>
      </div>
    </div>
  );
}
