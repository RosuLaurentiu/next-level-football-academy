import { useState } from "react";
import { Navigate } from "react-router-dom";
import { BottomNav, Icon } from "../components/ui";
import { useAppState } from "../state/appState";

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

  const activeBoard =
    tab === "daily" ? dailyLeaderboard : tab === "weekly" ? weeklyLeaderboard : monthlyLeaderboard;
  const currentRank =
    tab === "daily" ? currentDailyRank : tab === "weekly" ? currentWeeklyRank : currentMonthlyRank;
  const podium = activeBoard.slice(0, 3);
  const rest = activeBoard.slice(3);

  return (
    <div className="screen">
      <section className="hero-card hero-card--leaderboard">
        <span className="hero-card__eyebrow">CLASAMENTUL ACADEMIEI</span>
        <h1>Urcă în top.</h1>
        <p>XP-ul, seria și constanța te duc în față.</p>

        <div className="segment-control">
          <button
            className={
              tab === "daily"
                ? "segment-control__button segment-control__button--active"
                : "segment-control__button"
            }
            onClick={() => setTab("daily")}
          >
            Zilnic
          </button>
          <button
            className={
              tab === "weekly"
                ? "segment-control__button segment-control__button--active"
                : "segment-control__button"
            }
            onClick={() => setTab("weekly")}
          >
            Săptămânal
          </button>
          <button
            className={
              tab === "monthly"
                ? "segment-control__button segment-control__button--active"
                : "segment-control__button"
            }
            onClick={() => setTab("monthly")}
          >
            Lunar
          </button>
        </div>
      </section>

      <div className="stack">
        <div className="card card--highlight">
          <span className="card__eyebrow">Poziția ta</span>
          <h2>{currentRank ? `Locul #${currentRank.rank}` : "Intră în cursă"}</h2>
          <p>
            {currentRank
              ? `${currentRank.xp} XP | Nivel ${currentRank.level} | Serie ${currentRank.streak} zile`
              : "Primele tale module completate îți vor deschide locul în clasament."}
          </p>
        </div>

        {podium.length > 0 && (
          <div className="podium-card">
            <div className="podium">
              {podium.map((entry, index) => (
                <div
                  key={entry.username}
                  className={index === 0 ? "podium__item podium__item--first" : "podium__item"}
                >
                  <div className={`podium__medal podium__medal--${index + 1}`}>#{entry.rank}</div>
                  <strong>{entry.username}</strong>
                  <span>{entry.xp} XP</span>
                  <div className={`podium__stand podium__stand--${index + 1}`}>
                    <span>Nivel {entry.level}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="leaderboard-list">
          {rest.map((entry) => (
            <div
              key={entry.username}
              className={entry.isCurrentUser ? "leaderboard-row leaderboard-row--active" : "leaderboard-row"}
            >
              <strong className="leaderboard-row__rank">#{entry.rank}</strong>
              <div className="leaderboard-row__player">
                <strong>{entry.username}</strong>
                <span>Nivel {entry.level} | Serie {entry.streak} | {entry.completedTrainings} sesiuni</span>
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
                Locul tău {tab === "daily" ? "zilnic" : tab === "weekly" ? "săptămânal" : "lunar"} este #
                {currentRank.rank}. Continuă și intri în top 10.
              </p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
