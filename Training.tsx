import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { SESSION_BONUS_XP, formatLongDate, getQuoteOfTheDay } from "./appData";
import { useAppState } from "./appState";
import type { Challenge, TrainingTask } from "./types";
import { BottomNav, Icon, ProgressBar } from "./ui";

interface TrainingHistoryEntry {
  uid: string;
  completedAt: string;
  dateKey: string;
  task: TrainingTask;
}

function getStorageKeys(userKey: string) {
  return {
    favorites: `next-level-favorites-${userKey}`,
    history: `next-level-history-${userKey}`,
  };
}

function extractYouTubeId(url?: string): string | null {
  if (!url) {
    return null;
  }

  const clean = url.trim();
  const match =
    clean.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/) ??
    clean.match(/[?&]v=([A-Za-z0-9_-]{6,})/);

  return match?.[1] ?? null;
}

function getEmbedUrl(url?: string, autoplay = false): string | null {
  const id = extractYouTubeId(url);
  if (!id) {
    return null;
  }

  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&autoplay=${autoplay ? "1" : "0"}`;
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

function postYouTubeCommand(iframe: HTMLIFrameElement | null, command: "playVideo" | "pauseVideo") {
  if (!iframe?.contentWindow) {
    return;
  }

  iframe.contentWindow.postMessage(
    JSON.stringify({
      event: "command",
      func: command,
      args: [],
    }),
    "*",
  );
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

  const [message, setMessage] = useState("Urmează ordinea modulelor și confirmă doar după antrenament real.");
  const [activeTask, setActiveTask] = useState<TrainingTask | null>(null);
  const [modalSource, setModalSource] = useState<"today" | "history">("today");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [videoReloadKey, setVideoReloadKey] = useState(0);
  const [videoPaused, setVideoPaused] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [history, setHistory] = useState<TrainingHistoryEntry[]>([]);
  const videoFrameRef = useRef<HTMLIFrameElement | null>(null);

  if (!player) {
    return <Navigate to="/" replace />;
  }

  const userKey = player.userId ?? player.username;
  const storageKeys = getStorageKeys(userKey);

  useEffect(() => {
    try {
      const rawFavorites = window.localStorage.getItem(storageKeys.favorites);
      const rawHistory = window.localStorage.getItem(storageKeys.history);
      if (rawFavorites) {
        setFavoriteIds(JSON.parse(rawFavorites) as string[]);
      }
      if (rawHistory) {
        setHistory(JSON.parse(rawHistory) as TrainingHistoryEntry[]);
      }
    } catch {
      setFavoriteIds([]);
      setHistory([]);
    }
  }, [storageKeys.favorites, storageKeys.history]);

  useEffect(() => {
    window.localStorage.setItem(storageKeys.favorites, JSON.stringify(favoriteIds));
  }, [favoriteIds, storageKeys.favorites]);

  useEffect(() => {
    window.localStorage.setItem(storageKeys.history, JSON.stringify(history.slice(0, 40)));
  }, [history, storageKeys.history]);

  const completedCount = todayCompletedTaskIds.length;
  const progress = Math.round((completedCount / todayPlan.tasks.length) * 100);
  const sessionBonusEarned = player.trainingLog.some(
    (entry) => entry.dateKey === todayKey && entry.taskId === "session-bonus",
  );
  const coreModulesDone = completedCount === todayPlan.tasks.length;
  const bonusChallenge = todayChallenge;
  const bonusCompleted = bonusChallenge ? player.completedChallengeIds.includes(bonusChallenge.id) : false;
  const uniqueHistory = useMemo(
    () =>
      [...history]
        .sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1))
        .filter((entry, index, list) => list.findIndex((item) => item.uid === entry.uid) === index),
    [history],
  );

  const steps = activeTask && activeTask.steps.length > 0
    ? activeTask.steps
    : activeTask
      ? [{ title: "Instrucțiuni", description: activeTask.description }]
      : [];
  const currentStep = steps[activeStepIndex];
  const stepVideoUrl = currentStep?.videoUrl ?? activeTask?.videoUrl;
  const embedUrl = getEmbedUrl(stepVideoUrl, true);

  const openTrainingModal = (task: TrainingTask, source: "today" | "history") => {
    setActiveTask(task);
    setModalSource(source);
    setActiveStepIndex(0);
    setVideoReloadKey((current) => current + 1);
    setVideoPaused(false);
    setShowSuccess(false);
  };

  const closeTrainingModal = () => {
    setActiveTask(null);
    setVideoPaused(false);
    setShowSuccess(false);
  };

  const toggleFavorite = (taskId: string) => {
    setFavoriteIds((current) => (
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId]
    ));
  };

  const handleReplay = () => {
    setVideoReloadKey((current) => current + 1);
    setVideoPaused(false);
  };

  const handlePauseResume = () => {
    if (!videoFrameRef.current) {
      return;
    }

    if (videoPaused) {
      postYouTubeCommand(videoFrameRef.current, "playVideo");
      setVideoPaused(false);
      return;
    }

    postYouTubeCommand(videoFrameRef.current, "pauseVideo");
    setVideoPaused(true);
  };

  const goToNextStep = () => {
    if (activeStepIndex >= steps.length - 1) {
      return;
    }

    setActiveStepIndex((current) => current + 1);
    setVideoReloadKey((current) => current + 1);
    setVideoPaused(false);
  };

  const finishModule = async () => {
    if (!activeTask) {
      return;
    }

    if (modalSource === "history") {
      setShowSuccess(true);
      return;
    }

    const result = await completeTrainingTask(activeTask.id);
    setMessage(result.message);

    if (!result.ok) {
      return;
    }

    const historyEntry: TrainingHistoryEntry = {
      uid: `${activeTask.id}-${todayKey}`,
      completedAt: new Date().toISOString(),
      dateKey: todayKey,
      task: activeTask,
    };

    setHistory((current) => [historyEntry, ...current.filter((entry) => entry.uid !== historyEntry.uid)]);
    setShowSuccess(true);
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
          const completed = todayCompletedTaskIds.includes(task.id);
          const isFavorite = favoriteIds.includes(task.id);
          const stepCount = task.steps.length > 0 ? task.steps.length : 1;

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
                <span className="tag">{stepCount} pași</span>
                <span className="tag">{getModuleStateLabel(task, completed)}</span>
              </div>

              <div className="task-card__actions">
                <button className="button button--ghost" onClick={() => toggleFavorite(task.id)}>
                  {isFavorite ? "Scoate de la favorite" : "Adaugă la favorite"}
                </button>
                <button className="button button--primary" onClick={() => openTrainingModal(task, "today")}>
                  Deschide modulul
                </button>
              </div>
            </div>
          );
        })}

        {favoriteIds.length > 0 && (
          <div className="card">
            <span className="card__eyebrow">Favorite</span>
            <h2>Module salvate</h2>
            <div className="challenge-name-list">
              {todayPlan.tasks
                .filter((task) => favoriteIds.includes(task.id))
                .map((task) => (
                  <button key={task.id} className="tag tag--wide" onClick={() => openTrainingModal(task, "today")}>
                    {task.title}
                  </button>
                ))}
            </div>
          </div>
        )}

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

        <div className="card">
          <span className="card__eyebrow">Istoric</span>
          <h2>Revezi module finalizate</h2>
          {uniqueHistory.length === 0 ? (
            <p className="empty-copy">Când finalizezi module, ele apar aici pentru revedere.</p>
          ) : (
            <div className="leaderboard-list">
              {uniqueHistory.slice(0, 8).map((entry) => (
                <div key={entry.uid} className="leaderboard-row">
                  <div className="leaderboard-row__player">
                    <strong>{entry.task.title}</strong>
                    <span>{entry.task.category} | {entry.task.duration} | {entry.dateKey}</span>
                  </div>
                  <button className="button button--secondary" onClick={() => openTrainingModal(entry.task, "history")}>
                    Revede
                  </button>
                </div>
              ))}
            </div>
          )}
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

      {activeTask && (
        <div className="training-modal" role="dialog" aria-modal="true">
          <div className="training-modal__sheet">
            {!showSuccess ? (
              <>
                <div className="training-modal__header">
                  <div>
                    <span className="task-card__eyebrow">{activeTask.category}</span>
                    <h2>{activeTask.title}</h2>
                    <p>{activeTask.duration}</p>
                  </div>
                  <button className="button button--ghost training-modal__close" onClick={closeTrainingModal}>
                    Închide
                  </button>
                </div>

                <div className="training-modal__progress">
                  <strong>Pasul {Math.min(activeStepIndex + 1, steps.length)} din {steps.length}</strong>
                  <p>{currentStep?.title ?? "Instrucțiuni"}</p>
                </div>

                <div className="training-modal__video">
                  {embedUrl ? (
                    <iframe
                      key={`${embedUrl}-${videoReloadKey}`}
                      ref={videoFrameRef}
                      src={embedUrl}
                      title={`Video ${activeTask.title}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="training-modal__video-fallback">
                      Video indisponibil pentru acest pas. Continuă cu instrucțiunile.
                    </div>
                  )}
                </div>

                <div className="coach-note">
                  <strong>Instrucțiuni simple</strong>
                  <p>{currentStep?.description ?? activeTask.description}</p>
                </div>

                <div className="training-modal__actions">
                  <button className="button button--secondary" onClick={handleReplay}>Repetă video</button>
                  <button className="button button--ghost" onClick={handlePauseResume}>
                    {videoPaused ? "Reia video" : "Pauză video"}
                  </button>
                  {activeStepIndex < steps.length - 1 ? (
                    <button className="button button--dark" onClick={goToNextStep}>Pasul următor</button>
                  ) : (
                    <button
                      className="button button--primary"
                      onClick={() => void finishModule()}
                      disabled={modalSource === "today" && todayCompletedTaskIds.includes(activeTask.id)}
                    >
                      {modalSource === "history" ? "Am revăzut modulul" : "Completează modulul"}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="training-modal__success">
                <h2>Bravo! Ai terminat acest modul!</h2>
                <p>Punctele XP au fost acordate, progresul este salvat, iar clasamentul s-a actualizat.</p>
                <button className="button button--primary" onClick={closeTrainingModal}>Continuă</button>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
