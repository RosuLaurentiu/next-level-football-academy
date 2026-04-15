import { NavLink } from "react-router-dom";
import { useAppState } from "../state/appState";
import type { Badge } from "../data/types";

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type IconName =
  | "home"
  | "training"
  | "challenge"
  | "leaderboard"
  | "profile"
  | "ball"
  | "bolt"
  | "star"
  | "trophy"
  | "flag"
  | "check"
  | "lock"
  | "coach";

export function Icon({ name, className }: { name: IconName; className?: string }) {
  const baseClassName = joinClasses("icon", className);

  switch (name) {
    case "training":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={baseClassName}>
          <path d="M6 20 2 9l7 2 3-7 4 11-7-2-3 7Z" fill="currentColor" />
        </svg>
      );
    case "challenge":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={baseClassName}>
          <path d="M12 3 4 7v6c0 5 3.4 7.9 8 9 4.6-1.1 8-4 8-9V7l-8-4Z" fill="currentColor" />
        </svg>
      );
    case "leaderboard":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={baseClassName}>
          <path d="M4 21V11h4v10H4Zm6 0V3h4v18h-4Zm6 0v-7h4v7h-4Z" fill="currentColor" />
        </svg>
      );
    case "profile":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={baseClassName}>
          <path
            d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-4.4 0-8 2.3-8 5v1h16v-1c0-2.7-3.6-5-8-5Z"
            fill="currentColor"
          />
        </svg>
      );
    case "ball":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={baseClassName}>
          <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.18" />
          <path
            d="m12 5 3 2 1 3-2 3h-4l-2-3 1-3 3-2Zm-5 7 2 4-2 3m10-7-2 4 2 3M9 19h6"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "bolt":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={baseClassName}>
          <path d="M13 2 5 13h5l-1 9 10-13h-6l0-7Z" fill="currentColor" />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={baseClassName}>
          <path d="m12 2 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17l-5.9 3 1.2-6.5L2.5 9l6.6-.9L12 2Z" fill="currentColor" />
        </svg>
      );
    case "trophy":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={baseClassName}>
          <path d="M7 3h10v3h2a2 2 0 0 1 2 2c0 3-2.3 5.2-5.5 5.7A5.5 5.5 0 0 1 13 17v2h4v2H7v-2h4v-2a5.5 5.5 0 0 1-2.5-3.3C5.3 13.2 3 11 3 8a2 2 0 0 1 2-2h2V3Zm-2 5c0 1.5 1 2.8 2.5 3.3V8H5Zm14 0h-2.5v3.3C18 10.8 19 9.5 19 8Z" fill="currentColor" />
        </svg>
      );
    case "flag":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={baseClassName}>
          <path d="M6 2h2v20H6V2Zm3 2h9l-2 4 2 4H9V4Z" fill="currentColor" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={baseClassName}>
          <path
            d="m5 12 4 4 10-10"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
          />
        </svg>
      );
    case "lock":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={baseClassName}>
          <path d="M7 10V8a5 5 0 0 1 10 0v2h1a2 2 0 0 1 2 2v8H4v-8a2 2 0 0 1 2-2h1Zm2 0h6V8a3 3 0 0 0-6 0v2Z" fill="currentColor" />
        </svg>
      );
    case "coach":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={baseClassName}>
          <path d="M7 3h10a2 2 0 0 1 2 2v16l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2h2Z" fill="currentColor" opacity="0.24" />
          <path d="M8 7h8M8 11h8M8 15h5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </svg>
      );
    case "home":
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={baseClassName}>
          <path d="M4 10.5 12 4l8 6.5V20h-5v-5H9v5H4v-9.5Z" fill="currentColor" />
        </svg>
      );
  }
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="progress-card">
      <div className="progress-card__meta">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function BadgePill({ badge }: { badge: Badge }) {
  return (
    <div className={joinClasses("badge-pill", `badge-pill--${badge.accent}`)}>
      <div>
        <strong>{badge.label}</strong>
        <span>{badge.rarity}</span>
      </div>
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="section-title">
      <span className="section-title__eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

export function BottomNav() {
  const { player } = useAppState();

  if (!player) {
    return null;
  }

  const navItems = [
    { to: "/", label: "Acasă", icon: "home" as const },
    { to: "/training", label: "Antren.", icon: "training" as const },
    { to: "/challenges", label: "Provocări", icon: "challenge" as const },
    { to: "/leaderboard", label: "Top", icon: "leaderboard" as const },
    { to: "/profile", label: "Profil", icon: "profile" as const },
  ];

  return (
    <nav className="bottom-nav" aria-label="Navigație principală">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => joinClasses("bottom-nav__link", isActive && "bottom-nav__link--active")}
        >
          <Icon name={item.icon} className="bottom-nav__icon" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
