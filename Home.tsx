import { Navigate, useNavigate } from "react-router-dom";
import { formatLongDate } from "./appData";
import { useAppState } from "./appState";
import { BottomNav, Icon, ProgressBar } from "./ui";

export default function Home() {
  const navigate = useNavigate();
  const {
    player,
    allChallenges,
    currentDailyRank,
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
  const xpToNextLevel = levelInfo.nextXp ? Math.max(0, levelInfo.nextXp - player.totalXp) : 0;
  const missionCopy = todayCompletedTaskIds.length === 0
    ? "E timpul sa urci nivelul!"
    : todayCompletedTaskIds.length < todayPlan.tasks.length
      ? "Continua, campionule! Academia te urmareste."
      : "Antrenament finalizat. Progres real.";
  const retentionCopy = todayCompletedTaskIds.length === todayPlan.tasks.length
    ? "Misiunea de maine se pregateste..."
    : "Nu rupe seria! Esti la 1 pas de urmatorul nivel!";

  return (
    <div className="screen">
      <section className="hero-card">
        <div className="hero-card__top">
          <div>
            <span className="hero-card__eyebrow">NEXT LEVEL FOOTBALL ACADEMY</span>
            <h1>{player.username}</h1>
            <p>{formatLongDate(todayKey)}</p>
          </div>
          <div className="hero-chip-row hero-chip-row--academy">
            <div className="academy-level-badge">
              <span>NIVEL</span>
              <strong>{levelInfo.level}</strong>
            </div>
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
              ? `Nivel ${levelInfo.level} ${levelInfo.title} | ${xpToNextLevel} XP pana la urmatorul nivel`
              : `Nivel ${levelInfo.level} ${levelInfo.title}`
          }
        />
      </section>

      <div className="stack">
        <div className="card card--highlight">
          <span className="card__eyebrow">Misiunea ta de azi</span>
          <h2>{missionCopy}</h2>
          <p>{nextTask.title} | {nextTask.duration} | {nextTask.xp} XP</p>
          <button className="button button--primary button--large" onClick={() => navigate("/training")}>
            Incepe antrenamentul
          </button>
        </div>

        <div className="action-grid">
          <button className="action-card" onClick={() => navigate("/training")}>
            <Icon name="training" className="action-card__icon" />
            <strong>Baza ta de antrenament</strong>
            <span>{todayCompletedTaskIds.length} din 3 module finalizate</span>
            <div className="mini-track">
              <div className="mini-track__fill" style={{ width: `${sessionProgress}%` }} />
            </div>
          </button>

          <button className="action-card action-card--warm" onClick={() => navigate("/challenges")}>
            <Icon name="trophy" className="action-card__icon" />
            <strong>Zona provocarilor</strong>
            <span>{player.completedChallengeIds.length} insigne castigate pana acum</span>
          </button>
        </div>

        <div className="card card--highlight">
          <span className="card__eyebrow">Provocarea focus</span>
          <h2>{nextChallenge ? nextChallenge.title : "Ai terminat toate provocarile deblocate"}</h2>
          <p>
            {nextChallenge
              ? `${nextChallenge.target} | Recompensa: ${nextChallenge.xp} XP`
              : "Misiunea de maine se pregateste... Revino pentru progres nou."}
          </p>
          <button className="button button--secondary" onClick={() => navigate("/challenges")}>
            Deschide provocarile
          </button>
        </div>

        <div className="card">
          <span className="card__eyebrow">Modulul urmator</span>
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
            <span>Loc zilnic</span>
            <strong>#{currentDailyRank?.rank ?? "-"}</strong>
            <small>Sprintul de azi</small>
          </div>
          <div className="metric-card">
            <span>Loc saptamanal</span>
            <strong>#{currentWeeklyRank?.rank ?? "-"}</strong>
            <small>Competitie prietenoasa</small>
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
            <p>{retentionCopy}</p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
