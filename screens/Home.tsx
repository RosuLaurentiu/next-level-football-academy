import { Navigate, useNavigate } from "react-router-dom";
import { BottomNav, Icon, ProgressBar } from "../components/ui";
import { formatLongDate } from "../data/appData";
import { useAppState } from "../state/appState";

export default function Home() {
  const navigate = useNavigate();
  const {
    player,
    allChallenges,
    currentDailyRank,
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
  const nextChallenge = todayChallenge ?? fallbackChallenge ?? null;
  const nextTask =
    todayPlan.tasks.find((task) => !todayCompletedTaskIds.includes(task.id)) ?? todayPlan.tasks[0];
  const completedModules = todayCompletedTaskIds.length;
  const totalModules = todayPlan.tasks.length;
  const sessionProgress = Math.round((completedModules / totalModules) * 100);
  const coreModulesDone = completedModules === totalModules;
  const xpToNextLevel = levelInfo.nextXp ? Math.max(0, levelInfo.nextXp - player.totalXp) : 0;
  const missionTitle = coreModulesDone ? "Antrenamentul de azi este gata!" : nextTask.title;
  const missionCopy = coreModulesDone
    ? "Progres real. Misiunea de mâine se pregătește."
    : completedModules === 0
      ? "Mental, fizic, tehnic. În ordinea academiei."
      : "Mai ai puțin. Închide ziua și păstrează seria.";
  const ctaLabel = coreModulesDone
    ? "Vezi antrenamentul"
    : completedModules === 0
      ? "Începe antrenamentul"
      : "Continuă antrenamentul";
  const retentionCopy = coreModulesDone
    ? "Mâine revii pentru o nouă misiune."
    : "Nu rupe seria. Ești aproape de următorul nivel.";

  return (
    <div className="screen">
      <section className="hero-card">
        <div className="hero-card__top">
          <div>
            <span className="hero-card__eyebrow">ACADEMIA TA</span>
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
              <span>{player.totalXp} XP</span>
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
              ? `Nivel ${levelInfo.level} ${levelInfo.title} | ${xpToNextLevel} XP până la următorul nivel`
              : `Nivel ${levelInfo.level} ${levelInfo.title}`
          }
        />
      </section>

      <div className="stack">
        <div className="card card--highlight">
          <span className="card__eyebrow">Misiunea ta de azi</span>
          <h2>{missionTitle}</h2>
          <p>{missionCopy}</p>

          {!coreModulesDone && (
            <div className="card-tag-row">
              <span className="tag">{nextTask.category}</span>
              <span className="tag">{nextTask.duration}</span>
              <span className="tag">{nextTask.xp} XP</span>
            </div>
          )}

          <div className="task-card__actions">
            <button className="button button--primary" onClick={() => navigate("/training")}>
              {ctaLabel}
            </button>
            <button className="button button--ghost" onClick={() => navigate("/leaderboard")}>
              Clasament
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="metric-card">
            <span>Module gata</span>
            <strong>
              {completedModules}/{totalModules}
            </strong>
            <small>Ritmul tău de azi</small>
          </div>
          <div className="metric-card">
            <span>Loc zilnic</span>
            <strong>#{currentDailyRank?.rank ?? "-"}</strong>
            <small>Cursa de azi</small>
          </div>
          <div className="metric-card">
            <span>Serie</span>
            <strong>{streakDays}</strong>
            <small>Zile consecutive</small>
          </div>
          <div className="metric-card">
            <span>Insigne</span>
            <strong>{player.unlockedBadges.length}</strong>
            <small>Progres vizibil</small>
          </div>
        </div>

        <div className="action-grid">
          <button className="action-card" onClick={() => navigate("/training")}>
            <Icon name="training" className="action-card__icon" />
            <strong>Antrenament</strong>
            <span>{completedModules} din {totalModules} module gata</span>
            <div className="mini-track">
              <div className="mini-track__fill" style={{ width: `${sessionProgress}%` }} />
            </div>
          </button>

          <button className="action-card action-card--warm" onClick={() => navigate("/challenges")}>
            <Icon name="trophy" className="action-card__icon" />
            <strong>Provocări</strong>
            <span>{player.completedChallengeIds.length} provocări validate</span>
          </button>
        </div>

        {nextChallenge && (
          <div className="card">
            <span className="card__eyebrow">Provocarea focus</span>
            <h2>{nextChallenge.title}</h2>
            <p>{nextChallenge.description}</p>
            <div className="card-tag-row">
              <span className="tag">{nextChallenge.duration ?? "5-20 min"}</span>
              <span className="tag">{nextChallenge.xp} XP</span>
              <span className="tag">Nivel {nextChallenge.levelRequired}</span>
            </div>
            <button className="button button--secondary" onClick={() => navigate("/challenges")}>
              Intră în provocare
            </button>
          </div>
        )}

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
