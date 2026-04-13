import { Navigate, useNavigate } from "react-router-dom";
import { formatLongDate } from "./appData";
import { useAppState } from "./appState";
import { AvatarBadge, BadgePill, BottomNav, Icon, ProgressBar } from "./ui";

export default function Profile() {
  const navigate = useNavigate();
  const { allChallenges, levelInfo, logout, player, streakDays } = useAppState();

  if (!player) {
    return <Navigate to="/" replace />;
  }

  const completedSessions = player.trainingLog.filter((entry) => entry.taskId === "session-bonus").length;
  const completedChallengeNames = allChallenges
    .filter((challenge) => player.completedChallengeIds.includes(challenge.id))
    .map((challenge) => challenge.title);

  return (
    <div className="screen">
      <section className="hero-card hero-card--profile">
        <AvatarBadge avatarId={player.avatarId} size="large" />
        <span className="hero-card__eyebrow">Profile Screen</span>
        <h1>{player.username}</h1>
        <p>
          Level {levelInfo.level} | {levelInfo.title}
        </p>
        <ProgressBar
          value={levelInfo.progress}
          label={
            levelInfo.nextXp
              ? `${levelInfo.nextXp - player.totalXp} XP until the next level`
              : "Top academy level reached"
          }
        />
      </section>

      <div className="stack">
        <div className="stats-grid">
          <div className="metric-card">
            <span>Total XP</span>
            <strong>{player.totalXp}</strong>
            <small>All earned through training</small>
          </div>
          <div className="metric-card">
            <span>Streak Days</span>
            <strong>{streakDays}</strong>
            <small>Stay consistent</small>
          </div>
          <div className="metric-card">
            <span>Challenges</span>
            <strong>{player.completedChallengeIds.length}</strong>
            <small>Completed</small>
          </div>
        </div>

        <div className="card">
          <span className="card__eyebrow">Player Summary</span>
          <div className="profile-summary">
            <div>
              <strong>Started</strong>
              <p>{formatLongDate(player.createdAt)}</p>
            </div>
            <div>
              <strong>Full Sessions</strong>
              <p>{completedSessions}</p>
            </div>
            <div>
              <strong>Avatar</strong>
              <p>{player.avatarId}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <span className="card__eyebrow">Badges Earned</span>
          {player.unlockedBadges.length > 0 ? (
            <div className="badge-grid">
              {player.unlockedBadges.map((badge) => (
                <BadgePill key={badge.id} badge={badge} />
              ))}
            </div>
          ) : (
            <p className="empty-copy">Complete challenges and consistency goals to unlock rare badges.</p>
          )}
        </div>

        <div className="card">
          <span className="card__eyebrow">Completed Challenges</span>
          {completedChallengeNames.length > 0 ? (
            <div className="challenge-name-list">
              {completedChallengeNames.map((name) => (
                <span key={name} className="tag tag--wide">
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="empty-copy">No challenge completed yet. Head to the challenge screen and earn your first badge.</p>
          )}
        </div>

        <button className="button button--secondary" onClick={() => navigate("/coach")}>
          <Icon name="coach" className="button__icon" />
          Open Coach Panel
        </button>

        <button
          className="button button--dark"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          <Icon name="profile" className="button__icon" />
          Log Out
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
