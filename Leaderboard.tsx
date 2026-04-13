import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppState } from "./appState";
import { AvatarBadge, BottomNav, Icon } from "./ui";

export default function Leaderboard() {
  const {
    monthlyLeaderboard,
    currentMonthlyRank,
    currentWeeklyRank,
    player,
    weeklyLeaderboard,
  } = useAppState();
  const [tab, setTab] = useState<"weekly" | "monthly">("weekly");

  if (!player) {
    return <Navigate to="/" replace />;
  }

  const activeBoard = tab === "weekly" ? weeklyLeaderboard : monthlyLeaderboard;
  const currentRank = tab === "weekly" ? currentWeeklyRank : currentMonthlyRank;
  const podium = activeBoard.slice(0, 3);
  const rest = activeBoard.slice(3);

  return (
    <div className="screen">
      <section className="hero-card hero-card--leaderboard">
        <span className="hero-card__eyebrow">Leaderboard Screen</span>
        <h1>Top 10 Players</h1>
        <p>Friendly weekly and monthly rankings keep the academy competitive and fun.</p>
        <div className="segment-control">
          <button
            className={tab === "weekly" ? "segment-control__button segment-control__button--active" : "segment-control__button"}
            onClick={() => setTab("weekly")}
          >
            Weekly Ranking
          </button>
          <button
            className={tab === "monthly" ? "segment-control__button segment-control__button--active" : "segment-control__button"}
            onClick={() => setTab("monthly")}
          >
            Monthly Ranking
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
                <span>Level {entry.level} | {entry.streak} day streak</span>
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
                Your current {tab} position is #{currentRank.rank}. Keep training and you can climb into the top 10.
              </p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
