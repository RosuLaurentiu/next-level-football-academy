import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppState } from "./appState";
import { BottomNav, Icon, SectionTitle } from "./ui";

export default function CoachPanel() {
  const {
    player,
    addCoachChallenge,
    addCoachQuote,
    activeUsers,
    allChallenges,
    refreshLeaderboard,
  } = useAppState();
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengeTarget, setChallengeTarget] = useState("");
  const [quote, setQuote] = useState("");
  const [message, setMessage] = useState("Coach tools help keep the academy fresh and motivating.");

  if (!player) {
    return <Navigate to="/" replace />;
  }

  const customChallengeCount = allChallenges.filter((challenge) => challenge.difficulty === "Coach Pick").length;

  const handleChallengeSubmit = () => {
    if (!challengeTitle.trim() || !challengeDescription.trim() || !challengeTarget.trim()) {
      setMessage("Add a title, challenge idea, and target before publishing.");
      return;
    }

    addCoachChallenge(challengeTitle, challengeDescription, challengeTarget);
    setChallengeTitle("");
    setChallengeDescription("");
    setChallengeTarget("");
    setMessage("New coach challenge published for the academy.");
  };

  const handleQuoteSubmit = () => {
    if (!quote.trim()) {
      setMessage("Write a motivational quote first.");
      return;
    }

    addCoachQuote(quote);
    setQuote("");
    setMessage("New motivational quote added to the daily rotation.");
  };

  return (
    <div className="screen">
      <section className="hero-card hero-card--coach">
        <div className="hero-card__icon-wrap">
          <Icon name="coach" className="hero-card__icon" />
        </div>
        <span className="hero-card__eyebrow">Coach Panel</span>
        <h1>Guide the Academy</h1>
        <p>Add fresh challenges, update quotes, and keep competition active.</p>
      </section>

      <div className="stack">
        <div className="stats-grid stats-grid--three">
          <div className="metric-card">
            <span>Active Users</span>
            <strong>{activeUsers}</strong>
          </div>
          <div className="metric-card">
            <span>Coach Challenges</span>
            <strong>{customChallengeCount}</strong>
          </div>
          <div className="metric-card">
            <span>Player View</span>
            <strong>{player.username}</strong>
          </div>
        </div>

        <div className="message-banner">
          <Icon name="flag" className="message-banner__icon" />
          <p>{message}</p>
        </div>

        <div className="card">
          <SectionTitle
            eyebrow="New Challenge"
            title="Create a Coach Pick"
            subtitle="Design extra work that rewards real practice and discipline."
          />
          <div className="form-grid">
            <input
              className="input"
              value={challengeTitle}
              onChange={(event) => setChallengeTitle(event.target.value)}
              placeholder="Challenge title"
            />
            <textarea
              className="input input--textarea"
              value={challengeDescription}
              onChange={(event) => setChallengeDescription(event.target.value)}
              placeholder="What should the player do?"
            />
            <input
              className="input"
              value={challengeTarget}
              onChange={(event) => setChallengeTarget(event.target.value)}
              placeholder="Target or success rule"
            />
            <button className="button button--primary" onClick={handleChallengeSubmit}>
              Publish Challenge
            </button>
          </div>
        </div>

        <div className="card">
          <SectionTitle
            eyebrow="Daily Quote"
            title="Add Motivation"
            subtitle="Fresh words keep children excited to train again tomorrow."
          />
          <div className="form-grid">
            <textarea
              className="input input--textarea"
              value={quote}
              onChange={(event) => setQuote(event.target.value)}
              placeholder="Write a short motivational quote"
            />
            <button className="button button--secondary" onClick={handleQuoteSubmit}>
              Save Quote
            </button>
          </div>
        </div>

        <div className="card card--compact">
          <SectionTitle
            eyebrow="Rankings"
            title="Refresh Competition"
            subtitle="Use this when you want the weekly and monthly table to feel alive."
          />
          <button className="button button--dark" onClick={refreshLeaderboard}>
            Update Rankings
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
