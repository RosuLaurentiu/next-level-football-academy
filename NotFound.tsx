import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="screen screen--centered">
      <div className="card card--compact not-found-card">
        <span className="hero-card__eyebrow">404</span>
        <h1>That page is not part of the academy.</h1>
        <p>Use the button below to head back to the football app home screen.</p>
        <Link className="button button--primary" to="/">
          Return Home
        </Link>
      </div>
    </div>
  );
}
