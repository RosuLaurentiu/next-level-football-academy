import { Navigate, useNavigate } from "react-router-dom";
import { formatLongDate } from "./appData";
import { useAppState } from "./appState";
import { AvatarBadge, BadgePill, BottomNav, Icon, ProgressBar } from "./ui";

export default function Profile() {
  const navigate = useNavigate();
  const { allChallenges, isAdmin, levelInfo, logout, player, streakDays } = useAppState();

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
        <span className="hero-card__eyebrow">Ecranul profilului</span>
        <h1>{player.username}</h1>
        <p>
          Nivel {levelInfo.level} | {levelInfo.title}
        </p>
        <ProgressBar
          value={levelInfo.progress}
          label={
            levelInfo.nextXp
              ? `${levelInfo.nextXp - player.totalXp} XP până la nivelul următor`
              : "Ai atins nivelul maxim al academiei"
          }
        />
      </section>

      <div className="stack">
        <div className="stats-grid">
          <div className="metric-card">
            <span>Total XP</span>
            <strong>{player.totalXp}</strong>
            <small>Totul câștigat prin antrenament</small>
          </div>
          <div className="metric-card">
            <span>Zile consecutive</span>
            <strong>{streakDays}</strong>
            <small>Rămâi constant</small>
          </div>
          <div className="metric-card">
            <span>Provocări</span>
            <strong>{player.completedChallengeIds.length}</strong>
            <small>Finalizate</small>
          </div>
        </div>

        <div className="card">
          <span className="card__eyebrow">Rezumatul jucătorului</span>
          <div className="profile-summary">
            <div>
              <strong>Început</strong>
              <p>{formatLongDate(player.createdAt)}</p>
            </div>
            <div>
              <strong>Sesiuni complete</strong>
              <p>{completedSessions}</p>
            </div>
            <div>
              <strong>Avatar</strong>
              <p>{player.avatarId}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <span className="card__eyebrow">Insigne câștigate</span>
          {player.unlockedBadges.length > 0 ? (
            <div className="badge-grid">
              {player.unlockedBadges.map((badge) => (
                <BadgePill key={badge.id} badge={badge} />
              ))}
            </div>
          ) : (
            <p className="empty-copy">Termină provocări și obiective de constanță ca să deblochezi insigne speciale.</p>
          )}
        </div>

        <div className="card">
          <span className="card__eyebrow">Provocări finalizate</span>
          {completedChallengeNames.length > 0 ? (
            <div className="challenge-name-list">
              {completedChallengeNames.map((name) => (
                <span key={name} className="tag tag--wide">
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="empty-copy">Încă nu ai terminat nicio provocare. Intră în zona provocărilor și câștigă prima ta insignă.</p>
          )}
        </div>

        {isAdmin && (
          <button className="button button--secondary" onClick={() => navigate("/coach")}>
            <Icon name="coach" className="button__icon" />
            Deschide panoul antrenorului
          </button>
        )}

        <button
          className="button button--dark"
          onClick={async () => {
            await logout();
            navigate("/");
          }}
        >
          <Icon name="profile" className="button__icon" />
          Ieșire
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
