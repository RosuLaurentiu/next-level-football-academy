import { useState } from "react";
import { Navigate } from "react-router-dom";
import { SESSION_BONUS_XP, formatLongDate } from "./appData";
import { useAppState } from "./appState";
import { BottomNav, Icon, ProgressBar } from "./ui";

export default function Training() {
  const {
    player,
    completeTrainingTask,
    todayCompletedTaskIds,
    todayKey,
    todayPlan,
  } = useAppState();
  const [startedTaskIds, setStartedTaskIds] = useState<string[]>([]);
  const [message, setMessage] = useState("Press Start Drill first, then confirm only after you really finish it.");

  if (!player) {
    return <Navigate to="/" replace />;
  }

  const completedCount = todayCompletedTaskIds.length;
  const progress = Math.round((completedCount / todayPlan.tasks.length) * 100);
  const sessionBonusEarned = player.trainingLog.some(
    (entry) => entry.dateKey === todayKey && entry.taskId === "session-bonus",
  );

  const startDrill = (taskId: string) => {
    if (!startedTaskIds.includes(taskId)) {
      setStartedTaskIds((current) => [...current, taskId]);
      setMessage("Drill started. Complete it fully, then come back to claim your progress.");
    }
  };

  const completeDrill = async (taskId: string) => {
    const result = await completeTrainingTask(taskId);
    setMessage(result.message);
  };

  return (
    <div className="screen">
      <section className="hero-card hero-card--training">
        <span className="hero-card__eyebrow">Daily Training</span>
        <h1>{todayPlan.title}</h1>
        <p>{todayPlan.theme}</p>
        <div className="hero-card__quote hero-card__quote--light">
          <Icon name="training" className="hero-card__quote-icon" />
          <p>{formatLongDate(todayKey)}</p>
        </div>
        <ProgressBar value={progress} label={`${completedCount}/5 drills complete today`} />
      </section>

      <div className="stack">
        <div className="message-banner">
          <Icon name="flag" className="message-banner__icon" />
          <p>{message}</p>
        </div>

        {todayPlan.tasks.map((task) => {
          const started = startedTaskIds.includes(task.id);
          const completed = todayCompletedTaskIds.includes(task.id);

          return (
            <div key={task.id} className={`task-card task-card--${task.accent}`}>
              <div className="task-card__header">
                <div>
                  <span className="task-card__eyebrow">{task.category}</span>
                  <h2>{task.title}</h2>
                </div>
                <div className="task-card__xp">{task.xp} XP</div>
              </div>

              <p>{task.description}</p>

              <div className="card-tag-row">
                <span className="tag">{task.duration}</span>
                <span className="tag">{task.focus}</span>
              </div>

              <ul className="task-steps">
                {task.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>

              <div className="task-card__actions">
                <button
                  className="button button--ghost"
                  onClick={() => startDrill(task.id)}
                  disabled={completed}
                >
                  Start Drill
                </button>
                <button
                  className="button button--primary"
                  onClick={() => void completeDrill(task.id)}
                  disabled={completed || !started}
                >
                  {completed ? "Completed" : "I Finished It"}
                </button>
              </div>
            </div>
          );
        })}

        <div className="card card--compact">
          <div className="truth-row">
            <Icon name="bolt" className="truth-row__icon" />
            <p>
              Finish all 5 drills to unlock the full session bonus of {SESSION_BONUS_XP} XP.
              {sessionBonusEarned ? " Bonus already earned today." : ""}
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
