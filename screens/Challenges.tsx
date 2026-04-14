import { useState } from "react";
import { Navigate } from "react-router-dom";
import { BadgePill, BottomNav, Icon } from "../components/ui";
import { useAppState } from "../state/appState";

export default function Challenges() {
  const { allChallenges, completeChallenge, levelInfo, player } = useAppState();
  const [startedChallengeIds, setStartedChallengeIds] = useState<string[]>([]);
  const [message, setMessage] = useState(
    "Recompensele se deblochează doar după efort real și finalizare sinceră.",
  );

  if (!player) {
    return <Navigate to="/" replace />;
  }

  const startChallenge = (challengeId: string) => {
    if (!startedChallengeIds.includes(challengeId)) {
      setStartedChallengeIds((current) => [...current, challengeId]);
      setMessage("Provocarea a pornit. Termin-o curat și revino pentru validare.");
    }
  };

  const finishChallenge = async (challengeId: string) => {
    const result = await completeChallenge(challengeId);
    setMessage(result.message);
  };

  return (
    <div className="screen">
      <section className="hero-card hero-card--challenge">
        <span className="hero-card__eyebrow">NEXT LEVEL CHALLENGES</span>
        <h1>Intră în duel cu tine.</h1>
        <p>Scor clar. XP real. Insigne câștigate prin muncă.</p>
      </section>

      <div className="stack">
        <div className="message-banner">
          <Icon name="trophy" className="message-banner__icon" />
          <p>{message}</p>
        </div>

        <div className="stats-grid">
          <div className="metric-card">
            <span>Nivel</span>
            <strong>{levelInfo.level}</strong>
            <small>Accesul tău acum</small>
          </div>
          <div className="metric-card">
            <span>Finalizate</span>
            <strong>{player.completedChallengeIds.length}</strong>
            <small>Provocări validate</small>
          </div>
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
                <span className="tag">{challenge.duration ?? "5-20 min"}</span>
                <span className="tag">{challenge.target}</span>
                <span className="tag">{challenge.rewardText}</span>
              </div>

              <div className="coach-note">
                <strong>Mesaj de coach</strong>
                <p>{challenge.coachNote}</p>
              </div>

              <BadgePill badge={challenge.badge} />

              <div className="task-card__actions">
                <button
                  className="button button--ghost"
                  onClick={() => startChallenge(challenge.id)}
                  disabled={completed || !unlocked}
                >
                  {started ? "În curs" : "Pornește"}
                </button>
                <button
                  className="button button--primary"
                  onClick={() => void finishChallenge(challenge.id)}
                  disabled={completed || !unlocked || !started}
                >
                  {completed ? "Insignă câștigată" : "Confirmă finalizarea"}
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
