import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { getTodayKey } from "./appData";
import { useAppState } from "./appState";
import { supabase } from "./supabaseClient";
import { BottomNav, Icon, SectionTitle } from "./ui";

type AdminSection = "dashboard" | "content" | "schedule" | "rankings" | "users" | "settings";
type ModuleCategory = "Mental" | "Fizic" | "Tehnic";

interface CoachModuleRow { id: number; category: ModuleCategory; title: string; duration: string; xp: number; is_active: boolean; }
interface CoachChallengeRow { id: string; title: string; duration: string; xp: number; level_required: number; is_active: boolean; }
interface AdminUserRow { user_id: string; username: string; email: string | null; role: "player" | "admin"; is_suspended: boolean; total_xp: number; streak_days: number; completed_challenges: number; }
interface AdminSettingsRow { challenge_frequency_days: number; daily_reset_time: string; auto_generator_enabled: boolean; xp_mental: number; xp_physical: number; xp_technical: number; xp_challenge: number; app_announcement: string; maintenance_mode: boolean; }
interface DashboardSnapshot { totalUsers: number; activeUsersToday: number; completedTrainingsToday: number; pendingIssues: number; topPlayersWeek: Array<{ username: string; xp: number }>; }

const defaultDashboard: DashboardSnapshot = { totalUsers: 0, activeUsersToday: 0, completedTrainingsToday: 0, pendingIssues: 0, topPlayersWeek: [] };
const defaultSettings: AdminSettingsRow = { challenge_frequency_days: 1, daily_reset_time: "00:00:00", auto_generator_enabled: true, xp_mental: 25, xp_physical: 35, xp_technical: 45, xp_challenge: 120, app_announcement: "", maintenance_mode: false };

function nextDayKey() { const d = new Date(); d.setDate(d.getDate() + 1); return getTodayKey(d); }

export default function CoachPanel() {
  const { isAdmin, monthlyLeaderboard, player, regenerateDailyContent, refreshLeaderboard, weeklyLeaderboard } = useAppState();
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [message, setMessage] = useState("Panoul admin este conectat la baza de date live.");
  const [dashboard, setDashboard] = useState<DashboardSnapshot>(defaultDashboard);
  const [settings, setSettings] = useState<AdminSettingsRow>(defaultSettings);
  const [modules, setModules] = useState<CoachModuleRow[]>([]);
  const [challenges, setChallenges] = useState<CoachChallengeRow[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState("");
  const [manualDate, setManualDate] = useState(getTodayKey());
  const [manualMentalId, setManualMentalId] = useState<number | "">("");
  const [manualPhysicalId, setManualPhysicalId] = useState<number | "">("");
  const [manualTechnicalId, setManualTechnicalId] = useState<number | "">("");
  const [manualChallengeId, setManualChallengeId] = useState("");
  const [previewTomorrow, setPreviewTomorrow] = useState("");
  const [bonusUserId, setBonusUserId] = useState("");
  const [bonusXp, setBonusXp] = useState(100);
  const [fraudUserId, setFraudUserId] = useState("");
  const [newModule, setNewModule] = useState({ category: "Mental" as ModuleCategory, title: "", description: "", duration: "10 min", xp: 35, difficulty: "Mediu", youtube: "", thumbnail: "", step1: "", step2: "", step3: "", step4: "", active: true });
  const [newChallenge, setNewChallenge] = useState({ title: "", description: "", target: "", duration: "5-20 min", xp: 120, level: 1, difficulty: "Alegerea antrenorului", youtube: "", thumbnail: "", active: true });

  const loadData = async (searchText = search) => {
    if (!supabase) { return; }
    const [d, s, m, c, u] = await Promise.all([
      supabase.rpc("admin_dashboard_snapshot"),
      supabase.from("coach_app_settings").select("*").eq("id", 1).single<AdminSettingsRow>(),
      supabase.from("coach_training_modules").select("id, category, title, duration, xp, is_active").order("created_at", { ascending: false }).returns<CoachModuleRow[]>(),
      supabase.from("coach_challenges").select("id, title, duration, xp, level_required, is_active").order("created_at", { ascending: false }).returns<CoachChallengeRow[]>(),
      supabase.rpc("admin_list_users", { search_text: searchText }).returns<AdminUserRow[]>(),
    ]);
    if (d.error || s.error || m.error || c.error || u.error) { setMessage(d.error?.message ?? s.error?.message ?? m.error?.message ?? c.error?.message ?? u.error?.message ?? "Eroare."); return; }
    setDashboard((d.data as DashboardSnapshot) ?? defaultDashboard);
    setSettings(s.data ?? defaultSettings);
    setModules(m.data ?? []);
    setChallenges(c.data ?? []);
    setUsers(Array.isArray(u.data) ? u.data : []);
  };

  useEffect(() => { void loadData(""); }, []);
  useEffect(() => {
    if (!supabase || !isAdmin) { return; }
    const client = supabase;
    const ch = client.channel("coach-panel-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => void loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "coach_training_modules" }, () => void loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "coach_challenges" }, () => void loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "training_completions" }, () => void loadData())
      .subscribe();
    return () => { void client.removeChannel(ch); };
  }, [isAdmin]);

  const mentalOptions = useMemo(() => modules.filter((x) => x.category === "Mental" && x.is_active), [modules]);
  const physicalOptions = useMemo(() => modules.filter((x) => x.category === "Fizic" && x.is_active), [modules]);
  const technicalOptions = useMemo(() => modules.filter((x) => x.category === "Tehnic" && x.is_active), [modules]);

  if (!player) { return <Navigate to="/" replace />; }
  if (!isAdmin) { return <Navigate to="/home" replace />; }

  return (
    <div className="screen">
      <section className="hero-card hero-card--coach">
        <div className="hero-card__icon-wrap"><Icon name="coach" className="hero-card__icon" /></div>
        <span className="hero-card__eyebrow">Coach Admin Panel</span>
        <h1>Control total pentru antrenori</h1>
        <p>Acces securizat. Toate acțiunile admin se salvează în timp real.</p>
      </section>

      <div className="stack">
        <div className="segment-control">
          {(["dashboard", "content", "schedule", "rankings", "users", "settings"] as AdminSection[]).map((key) => (
            <button key={key} className={section === key ? "segment-control__button segment-control__button--active" : "segment-control__button"} onClick={() => setSection(key)}>{key}</button>
          ))}
        </div>

        <div className="message-banner"><Icon name="flag" className="message-banner__icon" /><p>{message}</p></div>

        {section === "dashboard" && (
          <>
            <div className="stats-grid stats-grid--three">
              <div className="metric-card"><span>Total users</span><strong>{dashboard.totalUsers}</strong></div>
              <div className="metric-card"><span>Activi azi</span><strong>{dashboard.activeUsersToday}</strong></div>
              <div className="metric-card"><span>Sesiuni finalizate azi</span><strong>{dashboard.completedTrainingsToday}</strong></div>
              <div className="metric-card"><span>Probleme în așteptare</span><strong>{dashboard.pendingIssues}</strong></div>
              <div className="metric-card"><span>Top #1 săptămâna</span><strong>{dashboard.topPlayersWeek[0]?.username ?? "-"}</strong></div>
              <div className="metric-card"><span>Admin online</span><strong>{player.username}</strong></div>
            </div>
            <div className="card"><SectionTitle eyebrow="Top players this week" title="Top 5" subtitle="Monitorizare rapidă a academiei." /><div className="leaderboard-list">{dashboard.topPlayersWeek.map((x, i) => <div key={`${x.username}-${i}`} className="leaderboard-row"><span className="leaderboard-row__rank">#{i + 1}</span><div className="leaderboard-row__player"><strong>{x.username}</strong><span>{x.xp} XP</span></div></div>)}</div></div>
          </>
        )}

        {section === "content" && (
          <div className="card">
            <SectionTitle eyebrow="Content Management" title="Module și provocări" subtitle="Creează, editează, șterge și activează conținutul." />
            <div className="form-grid">
              <select className="input" value={newModule.category} onChange={(e) => setNewModule((p) => ({ ...p, category: e.target.value as ModuleCategory }))}><option value="Mental">Mental</option><option value="Fizic">Fizic</option><option value="Tehnic">Tehnic</option></select>
              <input className="input" placeholder="Titlu modul" value={newModule.title} onChange={(e) => setNewModule((p) => ({ ...p, title: e.target.value }))} />
              <textarea className="input input--textarea" placeholder="Descriere modul" value={newModule.description} onChange={(e) => setNewModule((p) => ({ ...p, description: e.target.value }))} />
              <input className="input" placeholder="Durată modul" value={newModule.duration} onChange={(e) => setNewModule((p) => ({ ...p, duration: e.target.value }))} />
              <input className="input" type="number" min={0} value={newModule.xp} onChange={(e) => setNewModule((p) => ({ ...p, xp: Number(e.target.value) }))} />
              <input className="input" placeholder="Dificultate modul" value={newModule.difficulty} onChange={(e) => setNewModule((p) => ({ ...p, difficulty: e.target.value }))} />
              <input className="input" placeholder="YouTube URL (optional)" value={newModule.youtube} onChange={(e) => setNewModule((p) => ({ ...p, youtube: e.target.value }))} />
              <input className="input" placeholder="Thumbnail URL (optional)" value={newModule.thumbnail} onChange={(e) => setNewModule((p) => ({ ...p, thumbnail: e.target.value }))} />
              <input className="input" placeholder="Step 1" value={newModule.step1} onChange={(e) => setNewModule((p) => ({ ...p, step1: e.target.value }))} />
              <input className="input" placeholder="Step 2" value={newModule.step2} onChange={(e) => setNewModule((p) => ({ ...p, step2: e.target.value }))} />
              <input className="input" placeholder="Step 3" value={newModule.step3} onChange={(e) => setNewModule((p) => ({ ...p, step3: e.target.value }))} />
              <input className="input" placeholder="Step 4" value={newModule.step4} onChange={(e) => setNewModule((p) => ({ ...p, step4: e.target.value }))} />
              <label className="label">Modul activ <input type="checkbox" checked={newModule.active} onChange={(e) => setNewModule((p) => ({ ...p, active: e.target.checked }))} /></label>
              <button className="button button--primary" onClick={async () => {
                if (!supabase || !newModule.title.trim() || !newModule.description.trim()) { setMessage("Titlu și descriere sunt obligatorii."); return; }
                const steps = [newModule.step1, newModule.step2, newModule.step3, newModule.step4].map((x, i) => x.trim() ? ({ title: `Step ${i + 1}`, description: x.trim() }) : null).filter(Boolean);
                const r = await supabase.from("coach_training_modules").insert({ category: newModule.category, title: newModule.title.trim(), description: newModule.description.trim(), duration: newModule.duration.trim(), focus: newModule.category, xp: newModule.xp, difficulty_level: newModule.difficulty, youtube_url: newModule.youtube.trim() || null, thumbnail_url: newModule.thumbnail.trim() || null, steps, is_active: newModule.active, created_by: player.userId });
                setMessage(r.error ? r.error.message : "Modul creat.");
                if (!r.error) { setNewModule((p) => ({ ...p, title: "", description: "", step1: "", step2: "", step3: "", step4: "" })); await loadData(); }
              }}>Creează modul</button>
            </div>
            <div className="form-grid">
              <input className="input" placeholder="Titlu provocare" value={newChallenge.title} onChange={(e) => setNewChallenge((p) => ({ ...p, title: e.target.value }))} />
              <textarea className="input input--textarea" placeholder="Descriere provocare" value={newChallenge.description} onChange={(e) => setNewChallenge((p) => ({ ...p, description: e.target.value }))} />
              <input className="input" placeholder="Obiectiv măsurabil" value={newChallenge.target} onChange={(e) => setNewChallenge((p) => ({ ...p, target: e.target.value }))} />
              <input className="input" placeholder="Durată" value={newChallenge.duration} onChange={(e) => setNewChallenge((p) => ({ ...p, duration: e.target.value }))} />
              <input className="input" type="number" min={0} value={newChallenge.xp} onChange={(e) => setNewChallenge((p) => ({ ...p, xp: Number(e.target.value) }))} />
              <input className="input" type="number" min={1} value={newChallenge.level} onChange={(e) => setNewChallenge((p) => ({ ...p, level: Number(e.target.value) }))} />
              <input className="input" placeholder="Dificultate" value={newChallenge.difficulty} onChange={(e) => setNewChallenge((p) => ({ ...p, difficulty: e.target.value }))} />
              <input className="input" placeholder="YouTube URL (optional)" value={newChallenge.youtube} onChange={(e) => setNewChallenge((p) => ({ ...p, youtube: e.target.value }))} />
              <input className="input" placeholder="Thumbnail URL (optional)" value={newChallenge.thumbnail} onChange={(e) => setNewChallenge((p) => ({ ...p, thumbnail: e.target.value }))} />
              <label className="label">Provocare activă <input type="checkbox" checked={newChallenge.active} onChange={(e) => setNewChallenge((p) => ({ ...p, active: e.target.checked }))} /></label>
              <button className="button button--secondary" onClick={async () => {
                if (!supabase || !newChallenge.title.trim() || !newChallenge.description.trim()) { setMessage("Titlu și descriere sunt obligatorii."); return; }
                const stamp = Date.now();
                const r = await supabase.from("coach_challenges").insert({ id: `coach-${stamp}`, title: newChallenge.title.trim(), description: newChallenge.description.trim(), target: newChallenge.target.trim() || "Scor măsurabil", duration: newChallenge.duration.trim(), xp: newChallenge.xp, level_required: newChallenge.level, difficulty: newChallenge.difficulty, coach_note: "Provocare validată de antrenor.", reward_text: "Ai câștigat bonus XP!", badge: { id: `coach-badge-${stamp}`, label: "Alegerea antrenorului", description: "Provocare completată.", rarity: "Legendară", accent: "gold" }, is_active: newChallenge.active, youtube_url: newChallenge.youtube.trim() || null, thumbnail_url: newChallenge.thumbnail.trim() || null, created_by: player.userId });
                setMessage(r.error ? r.error.message : "Provocare creată.");
                if (!r.error) { setNewChallenge((p) => ({ ...p, title: "", description: "", target: "" })); await loadData(); }
              }}>Creează provocare</button>
            </div>
            <div className="leaderboard-list">
              {modules.map((m) => <div key={`m-${m.id}`} className="leaderboard-row"><div className="leaderboard-row__player"><strong>{m.title}</strong><span>{m.category} | {m.duration} | {m.xp} XP</span></div><button className="button button--ghost" onClick={async () => { if (!supabase) { return; } const r = await supabase.from("coach_training_modules").update({ is_active: !m.is_active }).eq("id", m.id); setMessage(r.error ? r.error.message : "Modul actualizat."); if (!r.error) { await loadData(); } }}>{m.is_active ? "Dezactivează" : "Activează"}</button><button className="button button--dark" onClick={async () => { if (!supabase) { return; } const r = await supabase.from("coach_training_modules").delete().eq("id", m.id); setMessage(r.error ? r.error.message : "Modul șters."); if (!r.error) { await loadData(); } }}>Șterge</button></div>)}
              {challenges.map((c) => <div key={`c-${c.id}`} className="leaderboard-row"><div className="leaderboard-row__player"><strong>{c.title}</strong><span>{c.duration} | nivel {c.level_required} | {c.xp} XP</span></div><button className="button button--ghost" onClick={async () => { if (!supabase) { return; } const r = await supabase.from("coach_challenges").update({ is_active: !c.is_active }).eq("id", c.id); setMessage(r.error ? r.error.message : "Provocare actualizată."); if (!r.error) { await loadData(); } }}>{c.is_active ? "Dezactivează" : "Activează"}</button><button className="button button--dark" onClick={async () => { if (!supabase) { return; } const r = await supabase.from("coach_challenges").delete().eq("id", c.id); setMessage(r.error ? r.error.message : "Provocare ștearsă."); if (!r.error) { await loadData(); } }}>Șterge</button></div>)}
            </div>
          </div>
        )}

        {section === "schedule" && (
          <div className="card">
            <SectionTitle eyebrow="Daily Schedule" title="Programare manuală și generator" subtitle="Alege modulele pe zi sau regenerează conținutul." />
            <div className="form-grid">
              <input className="input" type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} />
              <select className="input" value={manualMentalId} onChange={(e) => setManualMentalId(Number(e.target.value))}><option value="">Mental</option>{mentalOptions.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select>
              <select className="input" value={manualPhysicalId} onChange={(e) => setManualPhysicalId(Number(e.target.value))}><option value="">Physical</option>{physicalOptions.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select>
              <select className="input" value={manualTechnicalId} onChange={(e) => setManualTechnicalId(Number(e.target.value))}><option value="">Technical</option>{technicalOptions.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select>
              <select className="input" value={manualChallengeId} onChange={(e) => setManualChallengeId(e.target.value)}><option value="">Challenge optional</option>{challenges.filter((x) => x.is_active).map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select>
              <button className="button button--primary" onClick={async () => { if (!supabase || !manualMentalId || !manualPhysicalId || !manualTechnicalId) { setMessage("Alege toate cele 3 module de bază."); return; } const r = await supabase.rpc("admin_set_manual_daily_schedule", { target_date: manualDate, mental_id: manualMentalId, physical_id: manualPhysicalId, technical_id: manualTechnicalId, challenge_text_id: manualChallengeId || null }); setMessage(r.error ? r.error.message : "Program manual salvat."); }}>Salvează programarea</button>
              <button className="button button--secondary" onClick={async () => { const r = await regenerateDailyContent(manualDate); setMessage(r.message); }}>Force regenerate</button>
              <button className="button button--dark" onClick={async () => { if (!supabase) { return; } const tomorrow = nextDayKey(); const r = await supabase.rpc("fetch_daily_training_content", { target_date: tomorrow, force_regenerate: false }); if (r.error) { setMessage(r.error.message); return; } const d = r.data as Record<string, unknown>; const m = (d.mental as Record<string, unknown>)?.title; const p = (d.physical as Record<string, unknown>)?.title; const t = (d.technical as Record<string, unknown>)?.title; setPreviewTomorrow(`Mâine: ${String(m ?? "-")} | ${String(p ?? "-")} | ${String(t ?? "-")}`); }}>Preview tomorrow</button>
              {previewTomorrow ? <p className="empty-copy">{previewTomorrow}</p> : null}
            </div>
          </div>
        )}

        {section === "rankings" && (
          <>
            <div className="card">
              <SectionTitle eyebrow="Rankings" title="Leaderboard control" subtitle="Reset săptămânal, bonus XP, scoruri frauduloase." />
              <div className="leaderboard-list">{weeklyLeaderboard.slice(0, 5).map((x) => <div key={`w-${x.username}`} className="leaderboard-row"><span className="leaderboard-row__rank">#{x.rank}</span><div className="leaderboard-row__player"><strong>{x.username}</strong><span>{x.xp} XP weekly</span></div></div>)}{monthlyLeaderboard.slice(0, 5).map((x) => <div key={`m-${x.username}`} className="leaderboard-row"><span className="leaderboard-row__rank">#{x.rank}</span><div className="leaderboard-row__player"><strong>{x.username}</strong><span>{x.xp} XP monthly</span></div></div>)}</div>
              <button className="button button--secondary" onClick={async () => { if (!supabase) { return; } const r = await supabase.rpc("admin_reset_weekly_ranking"); if (r.error) { setMessage(r.error.message); return; } const rr = await refreshLeaderboard(); setMessage(rr.message); }}>Reset weekly ranking</button>
            </div>
            <div className="card"><div className="form-grid"><select className="input" value={bonusUserId} onChange={(e) => setBonusUserId(e.target.value)}><option value="">Jucător bonus XP</option>{users.map((u) => <option key={u.user_id} value={u.user_id}>{u.username}</option>)}</select><input className="input" type="number" value={bonusXp} onChange={(e) => setBonusXp(Number(e.target.value))} /><button className="button button--primary" onClick={async () => { if (!supabase || !bonusUserId) { return; } const r = await supabase.rpc("admin_award_bonus_xp", { target_user_id: bonusUserId, xp_amount: bonusXp, reason_text: "Bonus manual" }); setMessage(r.error ? r.error.message : "Bonus XP acordat."); if (!r.error) { await loadData(); } }}>Acordă bonus</button></div></div>
            <div className="card"><div className="form-grid"><select className="input" value={fraudUserId} onChange={(e) => setFraudUserId(e.target.value)}><option value="">Jucător cu scor suspect</option>{users.map((u) => <option key={u.user_id} value={u.user_id}>{u.username}</option>)}</select><button className="button button--dark" onClick={async () => { if (!supabase || !fraudUserId) { return; } const r = await supabase.rpc("admin_remove_fraudulent_scores", { target_user_id: fraudUserId, from_date: getTodayKey(), reason_text: "fraud" }); setMessage(r.error ? r.error.message : "Scoruri eliminate."); if (!r.error) { await loadData(); } }}>Elimină scorurile</button></div></div>
          </>
        )}

        {section === "users" && (
          <div className="card">
            <SectionTitle eyebrow="Users" title="Search, suspend, role, reset password" subtitle="Gestionează jucătorii direct din panou." />
            <div className="form-grid"><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Caută jucător" /><button className="button button--secondary" onClick={() => void loadData(search)}>Caută</button></div>
            <div className="leaderboard-list">
              {users.map((u) => <div key={u.user_id} className="leaderboard-row"><div className="leaderboard-row__player"><strong>{u.username}</strong><span>{u.email ?? "fără email"} | XP {u.total_xp} | streak {u.streak_days}</span></div><select className="input" value={u.role} onChange={async (e) => { if (!supabase) { return; } const r = await supabase.rpc("admin_set_user_role", { target_user_id: u.user_id, next_role: e.target.value }); setMessage(r.error ? r.error.message : "Rol actualizat."); if (!r.error) { await loadData(); } }}><option value="player">player</option><option value="admin">admin</option></select><button className="button button--ghost" onClick={async () => { if (!supabase) { return; } const r = await supabase.rpc("admin_set_user_suspension", { target_user_id: u.user_id, suspended: !u.is_suspended }); setMessage(r.error ? r.error.message : u.is_suspended ? "Cont activat." : "Cont suspendat."); if (!r.error) { await loadData(); } }}>{u.is_suspended ? "Reactivează" : "Suspendă"}</button><button className="button button--dark" onClick={async () => { if (!supabase || !u.email) { setMessage("Email indisponibil."); return; } const r = await supabase.auth.resetPasswordForEmail(u.email); setMessage(r.error ? r.error.message : "Email reset trimis."); }}>Reset</button></div>)}
            </div>
          </div>
        )}

        {section === "settings" && (
          <div className="card">
            <SectionTitle eyebrow="Settings" title="Frecvență, XP, reset, anunț, mentenanță" subtitle="Setări globale ale academiei." />
            <div className="form-grid">
              <input className="input" type="number" min={1} value={settings.challenge_frequency_days} onChange={(e) => setSettings((p) => ({ ...p, challenge_frequency_days: Number(e.target.value) }))} />
              <input className="input" type="time" value={settings.daily_reset_time.slice(0, 5)} onChange={(e) => setSettings((p) => ({ ...p, daily_reset_time: `${e.target.value}:00` }))} />
              <label className="label">Generator automat <input type="checkbox" checked={settings.auto_generator_enabled} onChange={(e) => setSettings((p) => ({ ...p, auto_generator_enabled: e.target.checked }))} /></label>
              <input className="input" type="number" min={0} value={settings.xp_mental} onChange={(e) => setSettings((p) => ({ ...p, xp_mental: Number(e.target.value) }))} />
              <input className="input" type="number" min={0} value={settings.xp_physical} onChange={(e) => setSettings((p) => ({ ...p, xp_physical: Number(e.target.value) }))} />
              <input className="input" type="number" min={0} value={settings.xp_technical} onChange={(e) => setSettings((p) => ({ ...p, xp_technical: Number(e.target.value) }))} />
              <input className="input" type="number" min={0} value={settings.xp_challenge} onChange={(e) => setSettings((p) => ({ ...p, xp_challenge: Number(e.target.value) }))} />
              <textarea className="input input--textarea" value={settings.app_announcement} onChange={(e) => setSettings((p) => ({ ...p, app_announcement: e.target.value }))} />
              <label className="label">Maintenance mode <input type="checkbox" checked={settings.maintenance_mode} onChange={(e) => setSettings((p) => ({ ...p, maintenance_mode: e.target.checked }))} /></label>
              <button className="button button--primary" onClick={async () => { if (!supabase) { return; } const r = await supabase.rpc("admin_update_settings", { challenge_frequency: settings.challenge_frequency_days, reset_clock: settings.daily_reset_time, auto_generator: settings.auto_generator_enabled, xp_mental_input: settings.xp_mental, xp_physical_input: settings.xp_physical, xp_technical_input: settings.xp_technical, xp_challenge_input: settings.xp_challenge, announcement_text: settings.app_announcement, maintenance_enabled: settings.maintenance_mode }); setMessage(r.error ? r.error.message : "Setări salvate."); if (!r.error) { await loadData(); } }}>Salvează setările</button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
