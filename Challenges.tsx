import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppState } from "./appState";
import { BadgePill, BottomNav, Icon } from "./ui";

export default function Challenges() {
  const { allChallenges, completeChallenge, levelInfo, player } = useAppState();
  const [startedChallengeIds, setStartedChallengeIds] = useState<string[]>([]);
  const [message, setMessage] = useState("Recompensele se deblochează doar după efort real și finalizare sinceră.");

  if (!player) {
    return <Navigate to="/" replace />;
  }

  const startChallenge = (challengeId: string) => {
    if (!startedChallengeIds.includes(challengeId)) {
      setStartedChallengeIds((current) => [...current, challengeId]);
      setMessage("Provocarea a început. Revino după ce o termini complet.");
    }
  };

  const finishChallenge = async (challengeId: string) => {
    const result = await completeChallenge(challengeId);
    setMessage(result.message);
  };

  return (
    <div className="screen">
      <section className="hero-card hero-card--challenge">
        <span className="hero-card__eyebrow">Ecranul provocărilor</span>
        <h1>Câștigă insigne și deblochează niveluri</h1>
        <p>Provoacă-te cu misiuni de fotbal și adună recompense premium.</p>
      </section>

      <div className="stack">
        <div className="message-banner">
          <Icon name="trophy" className="message-banner__icon" />
          <p>{message}</p>
        </div>

        {allChallenges.map((challenge) => {
          const completed = player.completedChallengeIds.includes(challenge.id);
          const unlocked = levelInfo.level >= challenge.levelRequired;
          const started = startedChallengeIds.includes(challenge.id);

          return (
            <div key={challenge.id} className="challenge-card">
              <div className="challenge-card__header">
                <div>
                  <span className="task-card__eyebrow">{challenge.difficulty}</span>
                  <h2>{challenge.title}</h2>
                </div>
                <div className="challenge-card__lock">
                  {unlocked ? (
                    <span>{challenge.xp} XP</span>
                  ) : (
                    <>
                      <Icon name="lock" className="challenge-card__lock-icon" />
                      <span>Nivel {challenge.levelRequired}</span>
                    </>
                  )}
                </div>
              </div>

              <p>{challenge.description}</p>
              <div className="card-tag-row">
                <span className="tag">{challenge.target}</span>
                <span className="tag">{challenge.rewardText}</span>
              </div>

              <div className="coach-note">
                <strong>Sfatul antrenorului</strong>
                <p>{challenge.coachNote}</p>
              </div>

              <BadgePill badge={challenge.badge} />

              <div className="task-card__actions">
                <button
                  className="button button--ghost"
                  onClick={() => startChallenge(challenge.id)}
                  disabled={completed || !unlocked}
                >
                  Începe provocarea
                </button>
                <button
                  className="button button--primary"
                  onClick={() => void finishChallenge(challenge.id)}
                  disabled={completed || !unlocked || !started}
                >
                  {completed ? "Insignă câștigată" : "Am terminat-o"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
