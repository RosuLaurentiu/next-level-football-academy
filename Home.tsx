import { Navigate, useNavigate } from "react-router-dom";
import { formatLongDate } from "./appData";
import { useAppState } from "./appState";
import { BottomNav, Icon, ProgressBar } from "./ui";

export default function Home() {
  const navigate = useNavigate();
  const {
    player,
    allChallenges,
    currentWeeklyRank,
    levelInfo,
    streakDays,
    todayChallenge,
    todayCompletedTaskIds,
    todayKey,
    todayPlan,
    todayQuote,
  } = useAppState();

  if (!player) {
    return <Navigate to="/" replace />;
  }

  const fallbackChallenge = allChallenges.find(
    (challenge) =>
      challenge.levelRequired <= levelInfo.level &&
      !player.completedChallengeIds.includes(challenge.id),
  );
  const nextChallenge = todayChallenge ?? fallbackChallenge;
  const nextTask = todayPlan.tasks.find((task) => !todayCompletedTaskIds.includes(task.id)) ?? todayPlan.tasks[0];
  const sessionProgress = Math.round((todayCompletedTaskIds.length / todayPlan.tasks.length) * 100);

  return (
    <div className="screen">
      <section className="hero-card">
        <div className="hero-card__top">
          <div>
            <span className="hero-card__eyebrow">Bine ai revenit, campionule!</span>
            <h1>{player.username}</h1>
            <p>{formatLongDate(todayKey)}</p>
          </div>
          <div className="hero-chip-row">
            <div className="hero-chip">
              <Icon name="bolt" className="hero-chip__icon" />
              <span>{player.totalXp} puncte XP</span>
            </div>
            <div className="hero-chip">
              <Icon name="flag" className="hero-chip__icon" />
              <span>{streakDays} zile consecutive</span>
            </div>
          </div>
        </div>

        <div className="hero-card__quote">
          <Icon name="ball" className="hero-card__quote-icon" />
          <p>{todayQuote}</p>
        </div>

        <ProgressBar
          value={levelInfo.progress}
          label={
            levelInfo.nextXp
              ? `Nivel ${levelInfo.level} ${levelInfo.title} | ${levelInfo.nextXp - player.totalXp} XP până la nivelul următor`
              : `Nivel ${levelInfo.level} ${levelInfo.title}`
          }
        />
      </section>

      <div className="stack">
        <div className="action-grid">
          <button className="action-card" onClick={() => navigate("/training")}>
            <Icon name="training" className="action-card__icon" />
            <strong>Antrenamentul Zilei</strong>
            <span>{todayCompletedTaskIds.length} din 3 module finalizate</span>
            <div className="mini-track">
              <div className="mini-track__fill" style={{ width: `${sessionProgress}%` }} />
            </div>
          </button>

          <button className="action-card action-card--warm" onClick={() => navigate("/challenges")}>
            <Icon name="trophy" className="action-card__icon" />
            <strong>Zona Provocărilor</strong>
            <span>{player.completedChallengeIds.length} insigne câștigate până acum</span>
          </button>
        </div>

        <div className="card card--highlight">
          <span className="card__eyebrow">Misiunea ta de azi</span>
          <h2>{nextChallenge ? nextChallenge.title : "Ai terminat toate provocările deblocate"}</h2>
          <p>
            {nextChallenge
              ? `${nextChallenge.target} | Recompensă: ${nextChallenge.xp} XP`
              : "Repetă mâine exercițiile preferate ca să-ți păstrezi seria activă."}
          </p>
          <button className="button button--secondary" onClick={() => navigate("/challenges")}>
            Deschide provocările
          </button>
        </div>

        <div className="card">
          <span className="card__eyebrow">Modulul următor</span>
          <h2>{nextTask.title}</h2>
          <p>{nextTask.description}</p>
          <div className="card-tag-row">
            <span className="tag">{nextTask.category}</span>
            <span className="tag">{nextTask.duration}</span>
            <span className="tag">{nextTask.xp} XP</span>
          </div>
        </div>

        <div className="stats-grid">
          <div className="metric-card">
            <span>Nivel curent</span>
            <strong>{levelInfo.level}</strong>
            <small>{levelInfo.title}</small>
          </div>
          <div className="metric-card">
            <span>Loc săptămânal</span>
            <strong>#{currentWeeklyRank?.rank ?? "-"}</strong>
            <small>Competiție prietenoasă</small>
          </div>
          <div className="metric-card">
            <span>Insigne</span>
            <strong>{player.unlockedBadges.length}</strong>
            <small>Recompense speciale</small>
          </div>
        </div>

        <div className="card card--compact">
          <div className="truth-row">
            <Icon name="check" className="truth-row__icon" />
            <p>
              Progresul se câștigă doar când modulele și provocările sunt marcate după antrenament real.
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
