import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { SESSION_BONUS_XP, formatLongDate, getQuoteOfTheDay } from "./appData";
import { useAppState } from "./appState";
import type { Challenge, TrainingTask } from "./types";
import { BottomNav, Icon, ProgressBar } from "./ui";

function getStepLabels(task: TrainingTask): string[] {
  if (task.category === "Fizic") {
    return ["Tehnică lentă", "Repetare", "Viteză", "Reacție și coordonare"];
  }

  if (task.category === "Tehnic") {
    return ["Repetare", "Complexitate", "Viteză", "Provocare cognitivă"];
  }

  return [];
}

function getModuleStateLabel(task: TrainingTask, completed: boolean) {
  if (completed) {
    return "Finalizat";
  }

  if (task.category === "Mental") {
    return "Pregătit pentru focus";
  }

  if (task.category === "Fizic") {
    return "Pregătit pentru mișcare";
  }

  return "Pregătit pentru minge";
}

export default function Training() {
  const navigate = useNavigate();
  const {
    completeTrainingTask,
    player,
    todayChallenge,
    todayCompletedTaskIds,
    todayKey,
    todayPlan,
    todayQuote,
  } = useAppState();
  const [startedTaskIds, setStartedTaskIds] = useState<string[]>([]);
  const [message, setMessage] = useState("Urmează modulele în ordine și confirmă fiecare parte doar după ce o termini cu adevărat.");

  if (!player) {
    return <Navigate to="/" replace />;
  }

  const completedCount = todayCompletedTaskIds.length;
  const progress = Math.round((completedCount / todayPlan.tasks.length) * 100);
  const sessionBonusEarned = player.trainingLog.some(
    (entry) => entry.dateKey === todayKey && entry.taskId === "session-bonus",
  );
  const coreModulesDone = completedCount === todayPlan.tasks.length;
  const bonusChallenge = todayChallenge;
  const bonusCompleted = bonusChallenge ? player.completedChallengeIds.includes(bonusChallenge.id) : false;

  const startModule = (taskId: string) => {
    if (!startedTaskIds.includes(taskId)) {
      setStartedTaskIds((current) => [...current, taskId]);
      setMessage("Modulul a început. Termină toți pașii, apoi apasă butonul de finalizare.");
    }
  };

  const finishModule = async (taskId: string) => {
    const result = await completeTrainingTask(taskId);
    setMessage(result.message);
  };

  const openBonusChallenge = (challenge: Challenge) => {
    setMessage(`Provocarea bonus este pregătită: ${challenge.title}. Intră în zona provocărilor și atacă scorul.`);
    navigate("/challenges");
  };

  return (
    <div className="screen">
      <section className="hero-card hero-card--training">
        <span className="hero-card__eyebrow">Antrenamentul Zilei</span>
        <h1>{todayPlan.title}</h1>
        <p>{todayPlan.theme}</p>
        <div className="hero-card__quote hero-card__quote--light">
          <Icon name="training" className="hero-card__quote-icon" />
          <p>{formatLongDate(todayKey)}</p>
        </div>
        <ProgressBar value={progress} label={`${completedCount}/${todayPlan.tasks.length} module de bază finalizate`} />
      </section>

      <div className="stack">
        <div className="message-banner">
          <Icon name="flag" className="message-banner__icon" />
          <p>{message}</p>
        </div>

        {todayPlan.tasks.map((task, index) => {
          const started = startedTaskIds.includes(task.id);
          const completed = todayCompletedTaskIds.includes(task.id);
          const stepLabels = getStepLabels(task);

          return (
            <div key={task.id} className={`task-card task-card--${task.accent}`}>
              <div className="task-card__header">
                <div>
                  <span className="task-card__eyebrow">{`${index + 1}. ${task.category}`}</span>
                  <h2>{task.title}</h2>
                </div>
                <div className="task-card__xp">{task.xp} XP</div>
              </div>

              <p>{task.description}</p>

              <div className="card-tag-row">
                <span className="tag">{task.duration}</span>
                <span className="tag">{task.focus}</span>
                <span className="tag">{getModuleStateLabel(task, completed)}</span>
              </div>

              {task.category === "Mental" ? (
                <div className="stack">
                  <div className="coach-note">
                    <strong>Citatul zilei</strong>
                    <p>{todayQuote}</p>
                  </div>
                  <div className="coach-note">
                    <strong>{task.exerciseType}</strong>
                    <p>{task.description}</p>
                  </div>
                </div>
              ) : (
                <ul className="task-steps">
                  {task.steps.map((step, stepIndex) => (
                    <li key={step}>
                      <strong>{stepLabels[stepIndex]}:</strong> {step}
                    </li>
                  ))}
                </ul>
              )}

              <div className="task-card__actions">
                <button
                  className="button button--ghost"
                  onClick={() => startModule(task.id)}
                  disabled={completed}
                >
                  Începe
                </button>
                <button
                  className="button button--primary"
                  onClick={() => void finishModule(task.id)}
                  disabled={completed || !started}
                >
                  {completed ? "Finalizat" : "Completează modulul"}
                </button>
              </div>
            </div>
          );
        })}

        <div className="challenge-card">
          <div className="challenge-card__header">
            <div>
              <span className="task-card__eyebrow">4. Provocare bonus</span>
              <h2>{bonusChallenge ? bonusChallenge.title : "Provocarea bonus se pregătește"}</h2>
            </div>
            <div className="challenge-card__lock">
              <span>{bonusChallenge ? `${bonusChallenge.xp} XP` : "Bonus"}</span>
            </div>
          </div>

          <p>
            {bonusChallenge
              ? bonusChallenge.description
              : "Astăzi nu ai o provocare bonus nouă. Revino după ce îți crește nivelul sau păstrează seria activă."}
          </p>

          <div className="card-tag-row">
            <span className="tag">{bonusChallenge?.duration ?? "5-20 min"}</span>
            <span className="tag">{bonusChallenge?.target ?? "Scor bonus"}</span>
            <span className="tag">Impact în clasament</span>
          </div>

          {bonusChallenge && (
            <div className="coach-note">
              <strong>Provocarea zilei</strong>
              <p>{getQuoteOfTheDay([bonusChallenge.rewardText, bonusChallenge.coachNote], todayKey)}</p>
            </div>
          )}

          <div className="task-card__actions">
            <button
              className="button button--ghost"
              onClick={() => bonusChallenge && openBonusChallenge(bonusChallenge)}
              disabled={!bonusChallenge}
            >
              Începe
            </button>
            <button
              className="button button--primary"
              onClick={() => navigate("/challenges")}
              disabled={!bonusChallenge}
            >
              {bonusCompleted ? "Deja finalizată" : "Vezi provocarea"}
            </button>
          </div>
        </div>

        <div className="card card--compact">
          <div className="truth-row">
            <Icon name="bolt" className="truth-row__icon" />
            <p>
              Termină cele 3 module de bază ca să deblochezi bonusul complet de {SESSION_BONUS_XP} XP.
              {sessionBonusEarned ? " Bonusul a fost deja câștigat azi." : ""}
            </p>
          </div>
        </div>

        {coreModulesDone && (
          <div className="card card--highlight">
            <span className="card__eyebrow">Succes!</span>
            <h2>Antrenamentul de azi este gata!</h2>
            <p>Ai terminat modulele Mental, Fizic și Tehnic. Dacă vrei extra puncte XP, atacă și provocarea bonus.</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
