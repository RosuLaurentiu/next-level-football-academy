import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { BottomNav, Icon, SectionTitle } from "../components/ui";
import { getTodayKey } from "../data/appData";
import { supabase } from "../lib/supabaseClient";
import { useAppState } from "../state/appState";

type AdminSection = "dashboard" | "content" | "schedule" | "rankings" | "users" | "settings";
type ModuleCategory = "Mental" | "Fizic" | "Tehnic";

interface CoachModuleRow {
  id: number;
  category: ModuleCategory;
  title: string;
  duration: string;
  xp: number;
  is_active: boolean;
}

interface CoachChallengeRow {
  id: string;
  title: string;
  duration: string;
  xp: number;
  level_required: number;
  is_active: boolean;
}

interface AdminUserRow {
  user_id: string;
  username: string;
  email: string | null;
  role: "player" | "admin";
  is_suspended: boolean;
  total_xp: number;
  streak_days: number;
  completed_challenges: number;
}

interface AdminSettingsRow {
  challenge_frequency_days: number;
  daily_reset_time: string;
  auto_generator_enabled: boolean;
  xp_mental: number;
  xp_physical: number;
  xp_technical: number;
  xp_challenge: number;
  session_bonus_xp: number;
  streak_bonus_3: number;
  streak_bonus_7: number;
  streak_bonus_14: number;
  streak_penalty_mode: "reset" | "partial";
  app_announcement: string;
  maintenance_mode: boolean;
}

interface DashboardSnapshot {
  totalUsers: number;
  activeUsersToday: number;
  completedTrainingsToday: number;
  pendingIssues: number;
  topPlayersWeek: Array<{ username: string; xp: number }>;
}

const defaultDashboard: DashboardSnapshot = {
  totalUsers: 0,
  activeUsersToday: 0,
  completedTrainingsToday: 0,
  pendingIssues: 0,
  topPlayersWeek: [],
};

const defaultSettings: AdminSettingsRow = {
  challenge_frequency_days: 1,
  daily_reset_time: "00:00:00",
  auto_generator_enabled: true,
  xp_mental: 25,
  xp_physical: 35,
  xp_technical: 45,
  xp_challenge: 120,
  session_bonus_xp: 60,
  streak_bonus_3: 45,
  streak_bonus_7: 120,
  streak_bonus_14: 260,
  streak_penalty_mode: "reset",
  app_announcement: "",
  maintenance_mode: false,
};

const adminSections: Array<{ key: AdminSection; label: string }> = [
  { key: "dashboard", label: "Tablou" },
  { key: "content", label: "Conținut" },
  { key: "schedule", label: "Program" },
  { key: "rankings", label: "Clasament" },
  { key: "users", label: "Jucători" },
  { key: "settings", label: "Setări" },
];

function nextDayKey() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return getTodayKey(next);
}

export default function CoachPanel() {
  const { isAdmin, player, regenerateDailyContent, refreshLeaderboard, weeklyLeaderboard } = useAppState();
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [message, setMessage] = useState("Panoul antrenorului este conectat live la academie.");
  const [confirmationText, setConfirmationText] = useState("");
  const [confirmedActionId, setConfirmedActionId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardSnapshot>(defaultDashboard);
  const [settings, setSettings] = useState<AdminSettingsRow>(defaultSettings);
  const [modules, setModules] = useState<CoachModuleRow[]>([]);
  const [challenges, setChallenges] = useState<CoachChallengeRow[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState("");
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [manualDate, setManualDate] = useState(getTodayKey());
  const [manualMentalId, setManualMentalId] = useState<number | "">("");
  const [manualPhysicalId, setManualPhysicalId] = useState<number | "">("");
  const [manualTechnicalId, setManualTechnicalId] = useState<number | "">("");
  const [manualChallengeId, setManualChallengeId] = useState("");
  const [previewTomorrow, setPreviewTomorrow] = useState("");
  const [bonusUserId, setBonusUserId] = useState("");
  const [bonusXp, setBonusXp] = useState(100);
  const [fraudUserId, setFraudUserId] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [newModule, setNewModule] = useState({
    category: "Mental" as ModuleCategory,
    title: "",
    description: "",
    duration: "8 min",
    xp: 35,
    difficulty: "Mediu",
    youtube: "",
    thumbnail: "",
    step1: "",
    step2: "",
    step3: "",
    step4: "",
    active: true,
  });
  const [newChallenge, setNewChallenge] = useState({
    title: "",
    description: "",
    target: "",
    duration: "5-20 min",
    xp: 120,
    level: 1,
    difficulty: "Alegerea antrenorului",
    youtube: "",
    thumbnail: "",
    active: true,
  });

  const showActionError = (text: string) => {
    setMessage(text);
    setConfirmationText("");
    setConfirmedActionId(null);
  };

  const showActionSuccess = (text: string, actionId?: string) => {
    setMessage(text);
    setConfirmationText(text);
    setConfirmedActionId(actionId ?? null);
  };

  const getActionButtonClass = (baseClassName: string, actionId?: string) =>
    confirmedActionId === actionId ? `${baseClassName} button--confirmed` : baseClassName;

  const getDeleteButtonClass = (actionId: string) =>
    pendingDeleteId === actionId ? "button button--danger button--inline" : "button button--dark button--inline";

  const clearPendingDelete = () => {
    setPendingDeleteId(null);
  };

  const loadData = async (searchText = search) => {
    if (!supabase) {
      return false;
    }

    const [dashboardResult, settingsResult, modulesResult, challengesResult, usersResult] = await Promise.all([
      supabase.rpc("admin_dashboard_snapshot"),
      supabase.from("coach_app_settings").select("*").eq("id", 1).single<AdminSettingsRow>(),
      supabase
        .from("coach_training_modules")
        .select("id, category, title, duration, xp, is_active")
        .order("created_at", { ascending: false })
        .returns<CoachModuleRow[]>(),
      supabase
        .from("coach_challenges")
        .select("id, title, duration, xp, level_required, is_active")
        .order("created_at", { ascending: false })
        .returns<CoachChallengeRow[]>(),
      supabase.rpc("admin_list_users", { search_text: searchText }).returns<AdminUserRow[]>(),
    ]);

    const error =
      dashboardResult.error ??
      settingsResult.error ??
      modulesResult.error ??
      challengesResult.error ??
      usersResult.error;

    if (error) {
      showActionError(error.message);
      return false;
    }

    setDashboard((dashboardResult.data as DashboardSnapshot) ?? defaultDashboard);
    setSettings(settingsResult.data ?? defaultSettings);
    setModules(modulesResult.data ?? []);
    setChallenges(challengesResult.data ?? []);
    setUsers(Array.isArray(usersResult.data) ? usersResult.data : []);
    return true;
  };

  useEffect(() => {
    void loadData("");
  }, []);

  useEffect(() => {
    if (!supabase || !isAdmin) {
      return;
    }

    const client = supabase;
    const channel = client
      .channel("coach-panel-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => void loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "coach_training_modules" }, () => void loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "coach_challenges" }, () => void loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "training_completions" }, () => void loadData())
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!confirmationText && !confirmedActionId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setConfirmationText("");
      setConfirmedActionId(null);
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [confirmationText, confirmedActionId]);

  useEffect(() => {
    clearPendingDelete();
  }, [section]);

  const mentalOptions = useMemo(
    () => modules.filter((module) => module.category === "Mental" && module.is_active),
    [modules],
  );
  const physicalOptions = useMemo(
    () => modules.filter((module) => module.category === "Fizic" && module.is_active),
    [modules],
  );
  const technicalOptions = useMemo(
    () => modules.filter((module) => module.category === "Tehnic" && module.is_active),
    [modules],
  );

  if (!player) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  const createModule = async () => {
    if (!supabase || !newModule.title.trim() || !newModule.description.trim()) {
      showActionError("Completează titlul și descrierea modulului.");
      return;
    }

    const steps = [newModule.step1, newModule.step2, newModule.step3, newModule.step4]
      .map((value, index) =>
        value.trim()
          ? {
              title: `Pasul ${index + 1}`,
              description: value.trim(),
            }
          : null,
      )
      .filter(Boolean);

    const result = await supabase.from("coach_training_modules").insert({
      category: newModule.category,
      title: newModule.title.trim(),
      description: newModule.description.trim(),
      duration: newModule.duration.trim(),
      focus: newModule.category,
      xp: newModule.xp,
      difficulty_level: newModule.difficulty,
      youtube_url: newModule.youtube.trim() || null,
      thumbnail_url: newModule.thumbnail.trim() || null,
      steps,
      is_active: newModule.active,
      created_by: player.userId ?? null,
    });

    if (result.error) {
      showActionError(result.error.message);
    } else {
      showActionSuccess("Modul nou salvat.", "create-module");
    }

    if (!result.error) {
      setNewModule((current) => ({
        ...current,
        title: "",
        description: "",
        step1: "",
        step2: "",
        step3: "",
        step4: "",
      }));
      await loadData();
    }
  };

  const createChallenge = async () => {
    if (!supabase || !newChallenge.title.trim() || !newChallenge.description.trim()) {
      showActionError("Completează titlul și descrierea provocării.");
      return;
    }

    const stamp = Date.now();
    const result = await supabase.from("coach_challenges").insert({
      id: `coach-${stamp}`,
      title: newChallenge.title.trim(),
      description: newChallenge.description.trim(),
      target: newChallenge.target.trim() || "Scor măsurabil",
      duration: newChallenge.duration.trim(),
      xp: newChallenge.xp,
      level_required: newChallenge.level,
      difficulty: newChallenge.difficulty,
      coach_note: "Provocare validată de antrenor.",
      reward_text: "Ai câștigat bonus XP!",
      badge: {
        id: `coach-badge-${stamp}`,
        label: "Alegerea antrenorului",
        description: "Provocare finalizată curat.",
        rarity: "Legendară",
        accent: "gold",
      },
      is_active: newChallenge.active,
      youtube_url: newChallenge.youtube.trim() || null,
      thumbnail_url: newChallenge.thumbnail.trim() || null,
      created_by: player.userId ?? null,
    });

    if (result.error) {
      showActionError(result.error.message);
    } else {
      showActionSuccess("Provocare nouă salvată.", "create-challenge");
    }

    if (!result.error) {
      setNewChallenge((current) => ({
        ...current,
        title: "",
        description: "",
        target: "",
      }));
      await loadData();
    }
  };

  const saveSettings = async () => {
    if (!supabase) {
      return;
    }

    const result = await supabase.rpc("admin_update_settings", {
      challenge_frequency: settings.challenge_frequency_days,
      reset_clock: settings.daily_reset_time,
      auto_generator: settings.auto_generator_enabled,
      xp_mental_input: settings.xp_mental,
      xp_physical_input: settings.xp_physical,
      xp_technical_input: settings.xp_technical,
      xp_challenge_input: settings.xp_challenge,
      session_bonus_xp_input: settings.session_bonus_xp,
      streak_bonus_3_input: settings.streak_bonus_3,
      streak_bonus_7_input: settings.streak_bonus_7,
      streak_bonus_14_input: settings.streak_bonus_14,
      streak_penalty_mode_input: settings.streak_penalty_mode,
      announcement_text: settings.app_announcement,
      maintenance_enabled: settings.maintenance_mode,
    });

    if (result.error) {
      showActionError(result.error.message);
    } else {
      showActionSuccess("Setările academiei au fost salvate.", "save-settings");
    }

    if (!result.error) {
      await loadData();
    }
  };

  return (
    <div className="screen">
      <section className="hero-card hero-card--coach">
        <div className="hero-card__icon-wrap">
          <Icon name="coach" className="hero-card__icon" />
        </div>
        <span className="hero-card__eyebrow">PANOU ANTRENOR</span>
        <h1>Control clar pentru academie.</h1>
        <p>Mai puțin zgomot. Mai mult control asupra progresului real.</p>
      </section>

      <div className="stack">
        <div className="segment-control segment-control--admin">
          {adminSections.map((item) => (
            <button
              key={item.key}
              className={
                section === item.key
                  ? "segment-control__button segment-control__button--active"
                  : "segment-control__button"
              }
              onClick={() => setSection(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={confirmationText ? "message-banner message-banner--success" : "message-banner"}>
          <Icon name="flag" className="message-banner__icon" />
          <p>{message}</p>
        </div>

        {confirmationText ? (
          <div className="coach-confirmation" aria-live="polite">
            <Icon name="check" className="coach-confirmation__icon" />
            <span>{confirmationText}</span>
          </div>
        ) : null}

        {section === "dashboard" && (
          <>
            <div className="stats-grid stats-grid--three">
              <div className="metric-card">
                <span>Total jucători</span>
                <strong>{dashboard.totalUsers}</strong>
                <small>În academie</small>
              </div>
              <div className="metric-card">
                <span>Activi azi</span>
                <strong>{dashboard.activeUsersToday}</strong>
                <small>Prezență live</small>
              </div>
              <div className="metric-card">
                <span>Sesiuni azi</span>
                <strong>{dashboard.completedTrainingsToday}</strong>
                <small>Antrenamente finalizate</small>
              </div>
              <div className="metric-card">
                <span>Top săptămână</span>
                <strong>{dashboard.topPlayersWeek[0]?.username ?? "-"}</strong>
                <small>Cel mai bun ritm</small>
              </div>
              <div className="metric-card">
                <span>Probleme</span>
                <strong>{dashboard.pendingIssues}</strong>
                <small>Necesită atenție</small>
              </div>
              <div className="metric-card">
                <span>Coach online</span>
                <strong>{player.username}</strong>
                <small>Sesiune sigură</small>
              </div>
            </div>

            <div className="card admin-card">
              <SectionTitle
                eyebrow="Acțiuni rapide"
                title="Controlul zilei"
                subtitle="Cele mai folosite acțiuni stau aici."
              />
              <div className="task-card__actions">
                <button
                  className={getActionButtonClass("button button--primary", "regenerate-day")}
                  onClick={async () => {
                    const result = await regenerateDailyContent();
                    if (result.ok) {
                      showActionSuccess(result.message, "regenerate-day");
                    } else {
                      showActionError(result.message);
                    }
                  }}
                >
                  Regenerează ziua
                </button>
                <button
                  className={getActionButtonClass("button button--secondary", "refresh-leaderboard")}
                  onClick={async () => {
                    const result = await refreshLeaderboard();
                    if (result.ok) {
                      showActionSuccess(result.message, "refresh-leaderboard");
                    } else {
                      showActionError(result.message);
                    }
                  }}
                >
                  Actualizează clasamentul
                </button>
              </div>
            </div>

            <div className="card admin-card">
              <SectionTitle
                eyebrow="Top săptămânal"
                title="Cine trage academia înainte"
                subtitle="Primele poziții din această săptămână."
              />
              <div className="leaderboard-list">
                {dashboard.topPlayersWeek.map((entry, index) => (
                  <div key={`${entry.username}-${index}`} className="leaderboard-row">
                    <strong className="leaderboard-row__rank">#{index + 1}</strong>
                    <div className="leaderboard-row__player">
                      <strong>{entry.username}</strong>
                      <span>{entry.xp} XP în această săptămână</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {section === "content" && (
          <>
            <div className="card admin-card">
              <SectionTitle
                eyebrow="Module noi"
                title="Creează un modul"
                subtitle="Folosește pași scurți și clari pentru copii."
              />
              <div className="form-grid form-grid--two">
                <label className="label">
                  Categorie
                  <select
                    className="input"
                    value={newModule.category}
                    onChange={(event) =>
                      setNewModule((current) => ({ ...current, category: event.target.value as ModuleCategory }))
                    }
                  >
                    <option value="Mental">Mental</option>
                    <option value="Fizic">Fizic</option>
                    <option value="Tehnic">Tehnic</option>
                  </select>
                </label>
                <label className="label">
                  Durată
                  <input
                    className="input"
                    value={newModule.duration}
                    onChange={(event) => setNewModule((current) => ({ ...current, duration: event.target.value }))}
                  />
                </label>
                <label className="label">
                  Titlu
                  <input
                    className="input"
                    value={newModule.title}
                    onChange={(event) => setNewModule((current) => ({ ...current, title: event.target.value }))}
                  />
                </label>
                <label className="label">
                  XP
                  <input
                    className="input"
                    type="number"
                    min={0}
                    value={newModule.xp}
                    onChange={(event) => setNewModule((current) => ({ ...current, xp: Number(event.target.value) }))}
                  />
                </label>
                <label className="label form-grid__full">
                  Descriere
                  <textarea
                    className="input input--textarea"
                    value={newModule.description}
                    onChange={(event) => setNewModule((current) => ({ ...current, description: event.target.value }))}
                  />
                </label>
                <label className="label">
                  Video YouTube
                  <input
                    className="input"
                    value={newModule.youtube}
                    onChange={(event) => setNewModule((current) => ({ ...current, youtube: event.target.value }))}
                  />
                </label>
                <label className="label">
                  Thumbnail opțional
                  <input
                    className="input"
                    value={newModule.thumbnail}
                    onChange={(event) => setNewModule((current) => ({ ...current, thumbnail: event.target.value }))}
                  />
                </label>
                <label className="label">
                  Pas 1
                  <input
                    className="input"
                    value={newModule.step1}
                    onChange={(event) => setNewModule((current) => ({ ...current, step1: event.target.value }))}
                  />
                </label>
                <label className="label">
                  Pas 2
                  <input
                    className="input"
                    value={newModule.step2}
                    onChange={(event) => setNewModule((current) => ({ ...current, step2: event.target.value }))}
                  />
                </label>
                <label className="label">
                  Pas 3
                  <input
                    className="input"
                    value={newModule.step3}
                    onChange={(event) => setNewModule((current) => ({ ...current, step3: event.target.value }))}
                  />
                </label>
                <label className="label">
                  Pas 4
                  <input
                    className="input"
                    value={newModule.step4}
                    onChange={(event) => setNewModule((current) => ({ ...current, step4: event.target.value }))}
                  />
                </label>
                <label className="label">
                  Dificultate
                  <input
                    className="input"
                    value={newModule.difficulty}
                    onChange={(event) => setNewModule((current) => ({ ...current, difficulty: event.target.value }))}
                  />
                </label>
                <label className="label label--toggle">
                  Activ
                  <input
                    type="checkbox"
                    checked={newModule.active}
                    onChange={(event) => setNewModule((current) => ({ ...current, active: event.target.checked }))}
                  />
                </label>
              </div>
              <button className={getActionButtonClass("button button--primary", "create-module")} onClick={createModule}>
                Salvează modulul
              </button>
            </div>

            <div className="card admin-card">
              <SectionTitle
                eyebrow="Provocare nouă"
                title="Adaugă o provocare"
                subtitle="Scurtă, măsurabilă și cu miză clară."
              />
              <div className="form-grid form-grid--two">
                <label className="label">
                  Titlu
                  <input
                    className="input"
                    value={newChallenge.title}
                    onChange={(event) => setNewChallenge((current) => ({ ...current, title: event.target.value }))}
                  />
                </label>
                <label className="label">
                  Nivel minim
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={newChallenge.level}
                    onChange={(event) => setNewChallenge((current) => ({ ...current, level: Number(event.target.value) }))}
                  />
                </label>
                <label className="label form-grid__full">
                  Descriere
                  <textarea
                    className="input input--textarea"
                    value={newChallenge.description}
                    onChange={(event) => setNewChallenge((current) => ({ ...current, description: event.target.value }))}
                  />
                </label>
                <label className="label">
                  Obiectiv
                  <input
                    className="input"
                    value={newChallenge.target}
                    onChange={(event) => setNewChallenge((current) => ({ ...current, target: event.target.value }))}
                  />
                </label>
                <label className="label">
                  XP
                  <input
                    className="input"
                    type="number"
                    min={0}
                    value={newChallenge.xp}
                    onChange={(event) => setNewChallenge((current) => ({ ...current, xp: Number(event.target.value) }))}
                  />
                </label>
                <label className="label">
                  Durată
                  <input
                    className="input"
                    value={newChallenge.duration}
                    onChange={(event) => setNewChallenge((current) => ({ ...current, duration: event.target.value }))}
                  />
                </label>
                <label className="label">
                  Dificultate
                  <input
                    className="input"
                    value={newChallenge.difficulty}
                    onChange={(event) => setNewChallenge((current) => ({ ...current, difficulty: event.target.value }))}
                  />
                </label>
                <label className="label">
                  Video YouTube
                  <input
                    className="input"
                    value={newChallenge.youtube}
                    onChange={(event) => setNewChallenge((current) => ({ ...current, youtube: event.target.value }))}
                  />
                </label>
                <label className="label">
                  Thumbnail opțional
                  <input
                    className="input"
                    value={newChallenge.thumbnail}
                    onChange={(event) => setNewChallenge((current) => ({ ...current, thumbnail: event.target.value }))}
                  />
                </label>
                <label className="label label--toggle">
                  Activ
                  <input
                    type="checkbox"
                    checked={newChallenge.active}
                    onChange={(event) => setNewChallenge((current) => ({ ...current, active: event.target.checked }))}
                  />
                </label>
              </div>
              <button className={getActionButtonClass("button button--secondary", "create-challenge")} onClick={createChallenge}>
                Salvează provocarea
              </button>
            </div>

            <div className="card admin-card">
              <SectionTitle
                eyebrow="Conținut activ"
                title="Module și provocări"
                subtitle="Activează, dezactivează sau șterge elementele existente."
              />
              <div className="leaderboard-list">
                {modules.map((module) => (
                  <div key={`module-${module.id}`} className="leaderboard-row leaderboard-row--admin">
                    <div className="leaderboard-row__player">
                      <strong>{module.title}</strong>
                      <span>
                        {module.category} • {module.duration} • {module.xp} XP
                      </span>
                    </div>
                    <button
                      className={getActionButtonClass("button button--ghost button--inline", `toggle-module-${module.id}`)}
                      onClick={async () => {
                        if (!supabase) {
                          return;
                        }
                        const result = await supabase
                          .from("coach_training_modules")
                          .update({ is_active: !module.is_active })
                          .eq("id", module.id);
                        if (result.error) {
                          showActionError(result.error.message);
                        } else {
                          setPendingDeleteId(null);
                          showActionSuccess("Modul actualizat.", `toggle-module-${module.id}`);
                        }
                        if (!result.error) {
                          await loadData();
                        }
                      }}
                    >
                      {module.is_active ? "Dezactivează" : "Activează"}
                    </button>
                    <button
                      className={getDeleteButtonClass(`delete-module-${module.id}`)}
                      onClick={async () => {
                        const deleteKey = `delete-module-${module.id}`;
                        if (pendingDeleteId !== deleteKey) {
                          setPendingDeleteId(deleteKey);
                          showActionError("Apasă din nou pentru a șterge modulul.");
                          return;
                        }
                        if (!supabase) {
                          return;
                        }
                        const result = await supabase.from("coach_training_modules").delete().eq("id", module.id);
                        if (result.error) {
                          showActionError(result.error.message);
                        } else {
                          showActionSuccess("Modul șters.", deleteKey);
                        }
                        setPendingDeleteId(null);
                        if (!result.error) {
                          await loadData();
                        }
                      }}
                    >
                      {pendingDeleteId === `delete-module-${module.id}` ? "Confirmă ștergerea" : "Șterge"}
                    </button>
                  </div>
                ))}

                {challenges.map((challenge) => (
                  <div key={`challenge-${challenge.id}`} className="leaderboard-row leaderboard-row--admin">
                    <div className="leaderboard-row__player">
                      <strong>{challenge.title}</strong>
                      <span>
                        {challenge.duration} • Nivel {challenge.level_required} • {challenge.xp} XP
                      </span>
                    </div>
                    <button
                      className={getActionButtonClass("button button--ghost button--inline", `toggle-challenge-${challenge.id}`)}
                      onClick={async () => {
                        if (!supabase) {
                          return;
                        }
                        const result = await supabase
                          .from("coach_challenges")
                          .update({ is_active: !challenge.is_active })
                          .eq("id", challenge.id);
                        if (result.error) {
                          showActionError(result.error.message);
                        } else {
                          setPendingDeleteId(null);
                          showActionSuccess("Provocare actualizată.", `toggle-challenge-${challenge.id}`);
                        }
                        if (!result.error) {
                          await loadData();
                        }
                      }}
                    >
                      {challenge.is_active ? "Dezactivează" : "Activează"}
                    </button>
                    <button
                      className={getDeleteButtonClass(`delete-challenge-${challenge.id}`)}
                      onClick={async () => {
                        const deleteKey = `delete-challenge-${challenge.id}`;
                        if (pendingDeleteId !== deleteKey) {
                          setPendingDeleteId(deleteKey);
                          showActionError("Apasă din nou pentru a șterge provocarea.");
                          return;
                        }
                        if (!supabase) {
                          return;
                        }
                        const result = await supabase.from("coach_challenges").delete().eq("id", challenge.id);
                        if (result.error) {
                          showActionError(result.error.message);
                        } else {
                          showActionSuccess("Provocare ștearsă.", deleteKey);
                        }
                        setPendingDeleteId(null);
                        if (!result.error) {
                          await loadData();
                        }
                      }}
                    >
                      {pendingDeleteId === `delete-challenge-${challenge.id}` ? "Confirmă ștergerea" : "Șterge"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {section === "schedule" && (
          <div className="card admin-card">
            <SectionTitle
              eyebrow="Program zilnic"
              title="Controlează ziua de antrenament"
              subtitle="Poți lăsa generatorul automat sau poți fixa manual o zi."
            />
            <div className="admin-help">
              Generator automat: alege conținut nou din baza de date. Programare manuală: blochează exact
              ce apare într-o anumită zi.
            </div>
            <div className="form-grid form-grid--two">
              <label className="label">
                Data
                <input className="input" type="date" value={manualDate} onChange={(event) => setManualDate(event.target.value)} />
              </label>
              <label className="label">
                Modul mental
                <select className="input" value={manualMentalId} onChange={(event) => setManualMentalId(Number(event.target.value))}>
                  <option value="">Alege</option>
                  {mentalOptions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
              </label>
              <label className="label">
                Modul fizic
                <select className="input" value={manualPhysicalId} onChange={(event) => setManualPhysicalId(Number(event.target.value))}>
                  <option value="">Alege</option>
                  {physicalOptions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
              </label>
              <label className="label">
                Modul tehnic
                <select className="input" value={manualTechnicalId} onChange={(event) => setManualTechnicalId(Number(event.target.value))}>
                  <option value="">Alege</option>
                  {technicalOptions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
              </label>
              <label className="label form-grid__full">
                Provocare bonus
                <select className="input" value={manualChallengeId} onChange={(event) => setManualChallengeId(event.target.value)}>
                  <option value="">Fără provocare fixată</option>
                  {challenges.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
              </label>
            </div>
            <div className="task-card__actions">
              <button
                className={getActionButtonClass("button button--primary", "save-day")}
                onClick={async () => {
                  if (!supabase || !manualMentalId || !manualPhysicalId || !manualTechnicalId) {
                    showActionError("Alege toate cele 3 module de bază.");
                    return;
                  }
                  const result = await supabase.rpc("admin_set_manual_daily_schedule", {
                    target_date: manualDate,
                    mental_id: manualMentalId,
                    physical_id: manualPhysicalId,
                    technical_id: manualTechnicalId,
                    challenge_text_id: manualChallengeId || null,
                  });
                  if (result.error) {
                    showActionError(result.error.message);
                  } else {
                    showActionSuccess("Programul manual a fost salvat.", "save-day");
                  }
                }}
              >
                Salvează ziua
              </button>
              <button
                className={getActionButtonClass("button button--secondary", "regenerate-date")}
                onClick={async () => {
                  const result = await regenerateDailyContent(manualDate);
                  if (result.ok) {
                    showActionSuccess(result.message, "regenerate-date");
                  } else {
                    showActionError(result.message);
                  }
                }}
              >
                Regenerează data
              </button>
            </div>
            <button
              className={getActionButtonClass("button button--ghost", "preview-tomorrow")}
              onClick={async () => {
                if (!supabase) {
                  return;
                }
                const result = await supabase.rpc("fetch_daily_training_content", {
                  target_date: nextDayKey(),
                  force_regenerate: false,
                });
                if (result.error) {
                  showActionError(result.error.message);
                  return;
                }
                const data = result.data as Record<string, unknown>;
                const mental = (data.mental as Record<string, unknown>)?.title;
                const physical = (data.physical as Record<string, unknown>)?.title;
                const technical = (data.technical as Record<string, unknown>)?.title;
                setPreviewTomorrow(`Mâine: ${String(mental ?? "-")} • ${String(physical ?? "-")} • ${String(technical ?? "-")}`);
                showActionSuccess("Previzualizarea pentru mâine este gata.", "preview-tomorrow");
              }}
            >
              Previzualizează mâine
            </button>
            {previewTomorrow ? <p className="empty-copy">{previewTomorrow}</p> : null}
          </div>
        )}

        {section === "rankings" && (
          <>
            <div className="card admin-card">
              <SectionTitle
                eyebrow="Top academia"
                title="Clasament rapid"
                subtitle="Primele poziții din clasamentul săptămânal."
              />
              <div className="leaderboard-list">
                {weeklyLeaderboard.slice(0, 5).map((entry) => (
                  <div key={`weekly-${entry.username}`} className="leaderboard-row">
                    <strong className="leaderboard-row__rank">#{entry.rank}</strong>
                    <div className="leaderboard-row__player">
                      <strong>{entry.username}</strong>
                      <span>{entry.xp} XP săptămânal</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className={getActionButtonClass("button button--secondary", "reset-weekly")}
                onClick={async () => {
                  if (!supabase) {
                    return;
                  }
                  const result = await supabase.rpc("admin_reset_weekly_ranking");
                  if (result.error) {
                    showActionError(result.error.message);
                    return;
                  }
                  const refreshResult = await refreshLeaderboard();
                  if (refreshResult.ok) {
                    showActionSuccess(refreshResult.message, "reset-weekly");
                  } else {
                    showActionError(refreshResult.message);
                  }
                }}
              >
                Resetează clasamentul săptămânal
              </button>
            </div>

            <div className="card admin-card">
              <SectionTitle
                eyebrow="Intervenții"
                title="Bonus și scoruri suspecte"
                subtitle="Folosește aceste opțiuni doar când chiar este nevoie."
              />
              <div className="form-grid form-grid--two">
                <label className="label">
                  Jucător bonus
                  <select className="input" value={bonusUserId} onChange={(event) => setBonusUserId(event.target.value)}>
                    <option value="">Alege jucător</option>
                    {users.map((user) => <option key={user.user_id} value={user.user_id}>{user.username}</option>)}
                  </select>
                </label>
                <label className="label">
                  Bonus XP
                  <input className="input" type="number" min={0} value={bonusXp} onChange={(event) => setBonusXp(Number(event.target.value))} />
                </label>
              </div>
              <button
                className={getActionButtonClass("button button--primary", "award-bonus")}
                onClick={async () => {
                  if (!supabase || !bonusUserId) {
                    showActionError("Alege jucătorul pentru bonus.");
                    return;
                  }
                  const result = await supabase.rpc("admin_award_bonus_xp", {
                    target_user_id: bonusUserId,
                    xp_amount: bonusXp,
                    reason_text: "Bonus manual coach",
                  });
                  if (result.error) {
                    showActionError(result.error.message);
                  } else {
                    showActionSuccess("Bonusul a fost acordat.", "award-bonus");
                  }
                  if (!result.error) {
                    await loadData();
                  }
                }}
              >
                Acordă bonus
              </button>

              <div className="form-grid">
                <label className="label">
                  Scor suspect
                  <select className="input" value={fraudUserId} onChange={(event) => setFraudUserId(event.target.value)}>
                    <option value="">Alege jucător</option>
                    {users.map((user) => <option key={user.user_id} value={user.user_id}>{user.username}</option>)}
                  </select>
                </label>
                <button
                  className={getActionButtonClass("button button--dark", "remove-fraud")}
                  onClick={async () => {
                    if (!supabase || !fraudUserId) {
                      showActionError("Alege jucătorul verificat.");
                      return;
                    }
                    const result = await supabase.rpc("admin_remove_fraudulent_scores", {
                      target_user_id: fraudUserId,
                      from_date: getTodayKey(),
                      reason_text: "Verificare coach",
                    });
                    if (result.error) {
                      showActionError(result.error.message);
                    } else {
                      showActionSuccess("Scorurile suspecte au fost eliminate.", "remove-fraud");
                    }
                    if (!result.error) {
                      await loadData();
                    }
                  }}
                >
                  Elimină scorurile suspecte
                </button>
              </div>
            </div>
          </>
        )}

        {section === "users" && (
          <div className="card admin-card">
            <SectionTitle
              eyebrow="Jucători"
              title="Caută și administrează conturile"
              subtitle="Roluri, suspendare și resetarea parolei."
            />
            <div className="form-grid form-grid--two">
              <label className="label form-grid__full">
                Caută jucător
                <input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nume sau email" />
              </label>
              <button
                className={`form-grid__full ${getActionButtonClass("button button--secondary", "refresh-users")}`}
                onClick={async () => {
                  const loaded = await loadData(search);
                  if (loaded) {
                    showActionSuccess("Lista jucătorilor a fost actualizată.", "refresh-users");
                  }
                }}
              >
                Actualizează lista
              </button>
            </div>

            <div className="leaderboard-list">
              {users.map((user) => (
                <div key={user.user_id} className="leaderboard-row leaderboard-row--admin">
                  <div className="leaderboard-row__player">
                    <strong>{user.username}</strong>
                    <span>
                      {user.email ?? "fără email"} • XP {user.total_xp} • serie {user.streak_days} • provocări{" "}
                      {user.completed_challenges}
                    </span>
                  </div>
                  <select
                    className="input input--compact"
                    value={user.role}
                    onChange={async (event) => {
                      if (!supabase) {
                        return;
                      }
                      const result = await supabase.rpc("admin_set_user_role", {
                        target_user_id: user.user_id,
                        next_role: event.target.value,
                      });
                      if (result.error) {
                        showActionError(result.error.message);
                      } else {
                        showActionSuccess("Rolul a fost actualizat.", `role-${user.user_id}`);
                      }
                      if (!result.error) {
                        await loadData();
                      }
                    }}
                  >
                    <option value="player">player</option>
                    <option value="admin">admin</option>
                  </select>
                  <div className="leaderboard-row__actions">
                    <button
                      className={getActionButtonClass("button button--ghost button--inline", `suspend-${user.user_id}`)}
                      onClick={async () => {
                        if (!supabase) {
                          return;
                        }
                        const result = await supabase.rpc("admin_set_user_suspension", {
                          target_user_id: user.user_id,
                          suspended: !user.is_suspended,
                        });
                        if (result.error) {
                          showActionError(result.error.message);
                        } else {
                          showActionSuccess(user.is_suspended ? "Cont reactivat." : "Cont suspendat.", `suspend-${user.user_id}`);
                        }
                        if (!result.error) {
                          await loadData();
                        }
                      }}
                    >
                      {user.is_suspended ? "Reactivează" : "Suspendă"}
                    </button>
                    <button
                      className={getActionButtonClass("button button--dark button--inline", `reset-${user.user_id}`)}
                      onClick={async () => {
                        if (!supabase || !user.email) {
                          showActionError("Acest cont nu are email disponibil.");
                          return;
                        }
                        const result = await supabase.auth.resetPasswordForEmail(user.email);
                        if (result.error) {
                          showActionError(result.error.message);
                        } else {
                          showActionSuccess("Emailul de resetare a fost trimis.", `reset-${user.user_id}`);
                        }
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === "settings" && (
          <div className="card admin-card">
            <SectionTitle
              eyebrow="Setări academie"
              title="Păstrează doar ce contează"
              subtitle="Setările importante sunt sus. Opțiunile rare sunt ascunse mai jos."
            />

            <div className="admin-help">
              Frecvență provocări: la câte zile apare provocarea bonus. Reset zilnic: ora la care se
              pregătește noua zi. Generator automat: alege singur conținutul zilei.
            </div>
            <div className="form-grid form-grid--two">
              <label className="label">
                Frecvență provocări
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={settings.challenge_frequency_days}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, challenge_frequency_days: Number(event.target.value) }))
                  }
                />
              </label>
              <label className="label">
                Reset zilnic
                <input
                  className="input"
                  type="time"
                  value={settings.daily_reset_time.slice(0, 5)}
                  onChange={(event) => setSettings((current) => ({ ...current, daily_reset_time: `${event.target.value}:00` }))}
                />
              </label>
              <label className="label label--toggle form-grid__full">
                Generator automat
                <input
                  type="checkbox"
                  checked={settings.auto_generator_enabled}
                  onChange={(event) => setSettings((current) => ({ ...current, auto_generator_enabled: event.target.checked }))}
                />
              </label>
            </div>

            <div className="admin-settings-grid">
              <div className="admin-setting-card">
                <strong>XP pe module</strong>
                <p>Mental, fizic, tehnic și provocare.</p>
                <div className="form-grid form-grid--two">
                  <label className="label">Mental<input className="input" type="number" min={0} value={settings.xp_mental} onChange={(event) => setSettings((current) => ({ ...current, xp_mental: Number(event.target.value) }))} /></label>
                  <label className="label">Fizic<input className="input" type="number" min={0} value={settings.xp_physical} onChange={(event) => setSettings((current) => ({ ...current, xp_physical: Number(event.target.value) }))} /></label>
                  <label className="label">Tehnic<input className="input" type="number" min={0} value={settings.xp_technical} onChange={(event) => setSettings((current) => ({ ...current, xp_technical: Number(event.target.value) }))} /></label>
                  <label className="label">Provocare<input className="input" type="number" min={0} value={settings.xp_challenge} onChange={(event) => setSettings((current) => ({ ...current, xp_challenge: Number(event.target.value) }))} /></label>
                </div>
              </div>

              <div className="admin-setting-card">
                <strong>Bonusuri de progres</strong>
                <p>Bonus sesiune completă și bonusuri pentru serie.</p>
                <div className="form-grid form-grid--two">
                  <label className="label">Sesiune completă<input className="input" type="number" min={0} value={settings.session_bonus_xp} onChange={(event) => setSettings((current) => ({ ...current, session_bonus_xp: Number(event.target.value) }))} /></label>
                  <label className="label">Penalty serie<select className="input" value={settings.streak_penalty_mode} onChange={(event) => setSettings((current) => ({ ...current, streak_penalty_mode: event.target.value as "reset" | "partial" }))}><option value="reset">Reset total</option><option value="partial">Scade o zi</option></select></label>
                  <label className="label">Bonus 3 zile<input className="input" type="number" min={0} value={settings.streak_bonus_3} onChange={(event) => setSettings((current) => ({ ...current, streak_bonus_3: Number(event.target.value) }))} /></label>
                  <label className="label">Bonus 7 zile<input className="input" type="number" min={0} value={settings.streak_bonus_7} onChange={(event) => setSettings((current) => ({ ...current, streak_bonus_7: Number(event.target.value) }))} /></label>
                  <label className="label form-grid__full">Bonus 14 zile<input className="input" type="number" min={0} value={settings.streak_bonus_14} onChange={(event) => setSettings((current) => ({ ...current, streak_bonus_14: Number(event.target.value) }))} /></label>
                </div>
              </div>
            </div>

            <button className="admin-toggle" onClick={() => setShowAdvancedSettings((current) => !current)}>
              {showAdvancedSettings ? "Ascunde setările avansate" : "Arată setările avansate"}
            </button>

            {showAdvancedSettings && (
              <div className="admin-setting-card">
                <strong>Setări avansate</strong>
                <p>Anunțul și mentenanța sunt rareori necesare. Le păstrăm separate ca să nu aglomereze panoul.</p>
                <div className="form-grid">
                  <label className="label">
                    Anunț în aplicație
                    <textarea
                      className="input input--textarea"
                      value={settings.app_announcement}
                      onChange={(event) => setSettings((current) => ({ ...current, app_announcement: event.target.value }))}
                    />
                  </label>
                  <label className="label label--toggle">
                    Mod mentenanță
                    <input
                      type="checkbox"
                      checked={settings.maintenance_mode}
                      onChange={(event) => setSettings((current) => ({ ...current, maintenance_mode: event.target.checked }))}
                    />
                  </label>
                </div>
              </div>
            )}

            <button className={getActionButtonClass("button button--primary", "save-settings")} onClick={saveSettings}>
              Salvează setările
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
