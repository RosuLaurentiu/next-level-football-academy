import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="screen screen--centered">
      <div className="card card--compact not-found-card">
        <span className="hero-card__eyebrow">404</span>
        <h1>Pagina nu există în academie.</h1>
        <p>Revino în aplicație și continuă antrenamentul.</p>
        <Link className="button button--primary" to="/">
          Înapoi acasă
        </Link>
      </div>
    </div>
  );
}
