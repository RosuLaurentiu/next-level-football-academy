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
    todayCompletedTaskIds,
    todayKey,
    todayPlan,
    todayQuote,
  } = useAppState();

  if (!player) {
    return <Navigate to="/" replace />;
  }

  const nextChallenge = allChallenges.find(
    (challenge) =>
      challenge.levelRequired <= levelInfo.level &&
      !player.completedChallengeIds.includes(challenge.id),
  );
  const nextTask = todayPlan.tasks.find((task) => !todayCompletedTaskIds.includes(task.id)) ?? todayPlan.tasks[0];
  const sessionProgress = Math.round((todayCompletedTaskIds.length / todayPlan.tasks.length) * 100);

  return (
    <div className="screen">
      <section className="hero-card">
        <div className="hero-card__top">
          <div>
            <span className="hero-card__eyebrow">Welcome Back</span>
            <h1>{player.username}</h1>
            <p>{formatLongDate(todayKey)}</p>
          </div>
          <div className="hero-chip-row">
            <div className="hero-chip">
              <Icon name="bolt" className="hero-chip__icon" />
              <span>{player.totalXp} XP</span>
            </div>
            <div className="hero-chip">
              <Icon name="flag" className="hero-chip__icon" />
              <span>{streakDays} Day Streak</span>
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
              ? `Level ${levelInfo.level} ${levelInfo.title} | ${levelInfo.nextXp - player.totalXp} XP to next level`
              : `Level ${levelInfo.level} ${levelInfo.title}`
          }
        />
      </section>

      <div className="stack">
        <div className="action-grid">
          <button className="action-card" onClick={() => navigate("/training")}>
            <Icon name="training" className="action-card__icon" />
            <strong>Today's Training</strong>
            <span>{todayCompletedTaskIds.length} of 5 drills complete</span>
            <div className="mini-track">
              <div className="mini-track__fill" style={{ width: `${sessionProgress}%` }} />
            </div>
          </button>

          <button className="action-card action-card--warm" onClick={() => navigate("/challenges")}>
            <Icon name="trophy" className="action-card__icon" />
            <strong>Challenge Zone</strong>
            <span>{player.completedChallengeIds.length} badges earned so far</span>
          </button>
        </div>

        <div className="card card--highlight">
          <span className="card__eyebrow">Today's Challenge</span>
          <h2>{nextChallenge ? nextChallenge.title : "Every unlocked challenge completed"}</h2>
          <p>
            {nextChallenge
              ? `${nextChallenge.target} | ${nextChallenge.xp} XP reward`
              : "Replay favourite drills tomorrow to keep your streak alive."}
          </p>
          <button className="button button--secondary" onClick={() => navigate("/challenges")}>
            Open Challenges
          </button>
        </div>

        <div className="card">
          <span className="card__eyebrow">Today's Training Task</span>
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
            <span>Current Level</span>
            <strong>{levelInfo.level}</strong>
            <small>{levelInfo.title}</small>
          </div>
          <div className="metric-card">
            <span>Weekly Rank</span>
            <strong>#{currentWeeklyRank?.rank ?? "-"}</strong>
            <small>Friendly competition</small>
          </div>
          <div className="metric-card">
            <span>Badges</span>
            <strong>{player.unlockedBadges.length}</strong>
            <small>Rare rewards</small>
          </div>
        </div>

        <div className="card card--compact">
          <div className="truth-row">
            <Icon name="check" className="truth-row__icon" />
            <p>
              Progress is earned only when drills and challenges are marked complete after real practice.
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
