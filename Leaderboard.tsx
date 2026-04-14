import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppState } from "./appState";
import { AvatarBadge, BottomNav, Icon } from "./ui";

export default function Leaderboard() {
  const {
    dailyLeaderboard,
    currentDailyRank,
    monthlyLeaderboard,
    currentMonthlyRank,
    currentWeeklyRank,
    player,
    weeklyLeaderboard,
  } = useAppState();
  const [tab, setTab] = useState<"daily" | "weekly" | "monthly">("daily");

  if (!player) {
    return <Navigate to="/" replace />;
  }

  const activeBoard = tab === "daily"
    ? dailyLeaderboard
    : tab === "weekly"
      ? weeklyLeaderboard
      : monthlyLeaderboard;
  const currentRank = tab === "daily"
    ? currentDailyRank
    : tab === "weekly"
      ? currentWeeklyRank
      : currentMonthlyRank;
  const podium = activeBoard.slice(0, 3);
  const rest = activeBoard.slice(3);

  return (
    <div className="screen">
      <section className="hero-card hero-card--leaderboard">
        <span className="hero-card__eyebrow">Ecranul clasamentului</span>
        <h1>Top 10 jucători</h1>
        <p>Clasamentele zilnice, săptămânale și lunare păstrează academia competitivă și distractivă.</p>
        <div className="segment-control">
          <button
            className={tab === "daily" ? "segment-control__button segment-control__button--active" : "segment-control__button"}
            onClick={() => setTab("daily")}
          >
            Clasament zilnic
          </button>
          <button
            className={tab === "weekly" ? "segment-control__button segment-control__button--active" : "segment-control__button"}
            onClick={() => setTab("weekly")}
          >
            Clasament săptămânal
          </button>
          <button
            className={tab === "monthly" ? "segment-control__button segment-control__button--active" : "segment-control__button"}
            onClick={() => setTab("monthly")}
          >
            Clasament lunar
          </button>
        </div>
      </section>

      <div className="stack">
        <div className="podium-card">
          <div className="podium">
            {podium.map((entry, index) => (
              <div
                key={entry.username}
                className={index === 0 ? "podium__item podium__item--first" : "podium__item"}
              >
                <AvatarBadge avatarId={entry.avatarId} size={index === 0 ? "large" : "medium"} />
                <strong>{entry.username}</strong>
                <span>{entry.xp} XP</span>
                <div className={`podium__stand podium__stand--${index + 1}`}>
                  <span>#{entry.rank}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="leaderboard-list">
          {rest.map((entry) => (
            <div
              key={entry.username}
              className={entry.isCurrentUser ? "leaderboard-row leaderboard-row--active" : "leaderboard-row"}
            >
              <strong className="leaderboard-row__rank">#{entry.rank}</strong>
              <AvatarBadge avatarId={entry.avatarId} size="small" />
              <div className="leaderboard-row__player">
                <strong>{entry.username}</strong>
                <span>Nivel {entry.level} | {entry.streak} zile consecutive | {entry.completedTrainings} antrenamente</span>
              </div>
              <div className="leaderboard-row__xp">{entry.xp} XP</div>
            </div>
          ))}
        </div>

        {currentRank && currentRank.rank > 10 && (
          <div className="card card--compact">
            <div className="truth-row">
              <Icon name="leaderboard" className="truth-row__icon" />
              <p>
                Locul tău {tab === "daily" ? "zilnic" : tab === "weekly" ? "săptămânal" : "lunar"} este #{currentRank.rank}. Continuă tot așa și poți urca în top 10.
              </p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
