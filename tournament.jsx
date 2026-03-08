import { useState, useEffect, useMemo } from "react";

/* ───────────────────────── helpers ───────────────────────── */
const STORAGE_KEY = "rr-tournament-v2";

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const uid = () => Math.random().toString(36).slice(2, 8);

const createMatch = (id, home, away) => ({ id, home, away, homeScore: null, awayScore: null, played: false });

const computeTeamStats = (teams, rounds) => {
  const s = {};
  teams.forEach((t) => {
    s[t.id] = { id: t.id, name: t.name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
  });
  rounds.forEach((r) =>
    r.matches.forEach((m) => {
      if (!m.played) return;
      const h = s[m.home], a = s[m.away];
      if (!h || !a) return;
      h.p++; a.p++;
      h.gf += m.homeScore; h.ga += m.awayScore;
      a.gf += m.awayScore; a.ga += m.homeScore;
      if (m.homeScore > m.awayScore) { h.w++; a.l++; h.pts += 3; }
      else if (m.homeScore < m.awayScore) { a.w++; h.l++; a.pts += 3; }
      else { h.d++; a.d++; h.pts++; a.pts++; }
    })
  );
  return Object.values(s).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
};

const generateRoundRobin = (teams) => {
  const t = [...teams];
  if (t.length % 2 !== 0) t.push({ id: "BYE", name: "BYE" });
  const n = t.length;
  const rounds = [];
  const fixed = t[0];
  const rotating = t.slice(1);

  for (let r = 0; r < n - 1; r++) {
    const current = [fixed, ...rotating];
    const matches = [];
    for (let i = 0; i < n / 2; i++) {
      const home = current[i];
      const away = current[n - 1 - i];
      if (home.id !== "BYE" && away.id !== "BYE") {
        matches.push({ ...createMatch(`R${r + 1}-M${i + 1}`, home.id, away.id), round: r + 1 });
      }
    }
    rounds.push({ round: r + 1, matches });
    rotating.push(rotating.shift());
  }
  return rounds;
};

/* ───────────────────────── storage ───────────────────────── */
const save = async (state) => {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Save failed", e);
  }
};

const load = async () => {
  try {
    const r = await window.storage.get(STORAGE_KEY);
    return r ? JSON.parse(r.value) : null;
  } catch {
    return null;
  }
};

/* ───────────────────────── constants ───────────────────────── */
const PHASES = { GROUP: "group", SEMI: "semi", FINAL: "final", DONE: "done" };

const COLORS = {
  bg: "#0a0e17",
  surface: "#111827",
  surfaceAlt: "#1a2235",
  border: "#1e293b",
  accent: "#22d3ee",
  gold: "#f59e0b",
  green: "#10b981",
  red: "#ef4444",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textDim: "#475569",
};

/* ───────────────────────── components ───────────────────────── */

const Badge = ({ children, color = COLORS.accent }) => (
  <span
    style={{
      background: color + "18",
      color,
      padding: "2px 10px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      border: `1px solid ${color}33`,
    }}
  >
    {children}
  </span>
);

const Button = ({ children, onClick, variant = "primary", disabled, small, style: extra }) => {
  const base = {
    padding: small ? "6px 14px" : "10px 22px",
    borderRadius: 8,
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 700,
    fontSize: small ? 12 : 14,
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: 0.3,
    transition: "all .2s",
    opacity: disabled ? 0.4 : 1,
  };
  const variants = {
    primary: { background: COLORS.accent, color: COLORS.bg },
    secondary: { background: COLORS.surfaceAlt, color: COLORS.textPrimary, border: `1px solid ${COLORS.border}` },
    danger: { background: COLORS.red + "22", color: COLORS.red, border: `1px solid ${COLORS.red}33` },
    gold: { background: COLORS.gold, color: COLORS.bg },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...extra }}>
      {children}
    </button>
  );
};

const Card = ({ children, style: extra, glow }) => (
  <div
    style={{
      background: COLORS.surface,
      border: `1px solid ${glow ? COLORS.accent + "44" : COLORS.border}`,
      borderRadius: 14,
      padding: 20,
      boxShadow: glow ? `0 0 30px ${COLORS.accent}11` : "0 2px 12px #0004",
      ...extra,
    }}
  >
    {children}
  </div>
);

const Input = ({ value, onChange, placeholder, style: extra, type = "text" }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    style={{
      background: COLORS.surfaceAlt,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 8,
      padding: "10px 14px",
      color: COLORS.textPrimary,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 14,
      outline: "none",
      width: "100%",
      boxSizing: "border-box",
      ...extra,
    }}
  />
);

/* ──── Setup Phase ──── */
const SetupView = ({ onStart }) => {
  const [teams, setTeams] = useState(["", "", "", ""]);
  const [name, setName] = useState("Tournament");

  const addTeam = () => {
    if (teams.length < 12) setTeams([...teams, ""]);
  };
  const removeTeam = (i) => {
    if (teams.length > 4) setTeams(teams.filter((_, idx) => idx !== i));
  };
  const updateTeam = (i, v) => {
    const t = [...teams];
    t[i] = v;
    setTeams(t);
  };
  const canStart = teams.every((t) => t.trim().length > 0) && new Set(teams.map((t) => t.trim().toLowerCase())).size === teams.length;

  return (
    <div style={{ maxWidth: 540, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>⚽</div>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 32,
            color: COLORS.textPrimary,
            margin: 0,
          }}
        >
          Tournament Setup
        </h1>
        <p style={{ color: COLORS.textSecondary, margin: "8px 0 0", fontSize: 14 }}>
          Round Robin · Semifinals · Final
        </p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <label style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>
          Tournament Name
        </label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Tournament" />
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <label style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
            Teams ({teams.length}/12)
          </label>
          <Button small onClick={addTeam} disabled={teams.length >= 12}>
            + Add Team
          </Button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {teams.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: COLORS.textDim, fontWeight: 700, fontSize: 13, width: 24, textAlign: "right" }}>{i + 1}</span>
              <Input value={t} onChange={(e) => updateTeam(i, e.target.value)} placeholder={`Team ${i + 1}`} />
              {teams.length > 4 && (
                <button
                  onClick={() => removeTeam(i)}
                  style={{
                    background: "none",
                    border: "none",
                    color: COLORS.red,
                    cursor: "pointer",
                    fontSize: 18,
                    padding: "0 4px",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div style={{ textAlign: "center", marginTop: 28 }}>
        <Button
          onClick={() =>
            onStart(
              name.trim() || "Tournament",
              shuffle(teams.map((t) => ({ id: uid(), name: t.trim() })))
            )
          }
          disabled={!canStart}
          style={{ padding: "14px 48px", fontSize: 16 }}
        >
          Generate Draw & Start →
        </Button>
        {!canStart && <p style={{ color: COLORS.red, fontSize: 12, marginTop: 8 }}>All team names must be unique and non-empty</p>}
      </div>
    </div>
  );
};

/* ──── Standings Table ──── */
const StandingsTable = ({ teams, rounds }) => {
  const stats = useMemo(() => computeTeamStats(teams, rounds), [teams, rounds]);

  const cols = ["#", "Team", "P", "W", "D", "L", "GF", "GA", "GD", "Pts"];
  const cellStyle = { padding: "10px 8px", textAlign: "center", fontSize: 13 };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th
                key={c}
                style={{
                  ...cellStyle,
                  color: COLORS.textDim,
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  borderBottom: `1px solid ${COLORS.border}`,
                  textAlign: c === "Team" ? "left" : "center",
                }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.map((t, i) => (
            <tr
              key={t.id}
              style={{
                background: i < 4 ? COLORS.accent + "08" : "transparent",
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              <td style={{ ...cellStyle, color: i < 4 ? COLORS.accent : COLORS.textDim, fontWeight: 700 }}>{i + 1}</td>
              <td style={{ ...cellStyle, textAlign: "left", color: COLORS.textPrimary, fontWeight: 600 }}>
                {t.name} {i < 4 && <span style={{ color: COLORS.accent, fontSize: 10 }}>●</span>}
              </td>
              <td style={{ ...cellStyle, color: COLORS.textSecondary }}>{t.p}</td>
              <td style={{ ...cellStyle, color: COLORS.green }}>{t.w}</td>
              <td style={{ ...cellStyle, color: COLORS.textSecondary }}>{t.d}</td>
              <td style={{ ...cellStyle, color: COLORS.red }}>{t.l}</td>
              <td style={{ ...cellStyle, color: COLORS.textSecondary }}>{t.gf}</td>
              <td style={{ ...cellStyle, color: COLORS.textSecondary }}>{t.ga}</td>
              <td style={{ ...cellStyle, color: t.gf - t.ga > 0 ? COLORS.green : t.gf - t.ga < 0 ? COLORS.red : COLORS.textSecondary, fontWeight: 600 }}>
                {t.gf - t.ga > 0 ? "+" : ""}
                {t.gf - t.ga}
              </td>
              <td style={{ ...cellStyle, color: COLORS.gold, fontWeight: 800, fontSize: 15 }}>{t.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ color: COLORS.textDim, fontSize: 11, marginTop: 8 }}>
        <span style={{ color: COLORS.accent }}>●</span> Top 4 qualify for Semifinals
      </p>
    </div>
  );
};

/* ──── Match Card ──── */
const MatchCard = ({ match, teams, isAdmin, onSave }) => {
  const home = teams.find((t) => t.id === match.home);
  const away = teams.find((t) => t.id === match.away);
  const [hs, setHs] = useState(match.homeScore ?? "");
  const [as_, setAs] = useState(match.awayScore ?? "");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setHs(match.homeScore ?? "");
    setAs(match.awayScore ?? "");
    setEditing(false);
  }, [match.homeScore, match.awayScore]);

  const handleSave = () => {
    const h = parseInt(hs, 10);
    const a = parseInt(as_, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    onSave(match.id, h, a);
    setEditing(false);
  };

  const scoreInputStyle = {
    width: 44, textAlign: "center", background: COLORS.bg,
    border: `1px solid ${COLORS.border}`, borderRadius: 6,
    color: COLORS.textPrimary, fontSize: 18, fontWeight: 800,
    padding: "6px 0", fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div
      style={{
        background: match.played ? COLORS.surfaceAlt : COLORS.surface,
        border: `1px solid ${match.played ? COLORS.border : COLORS.accent + "33"}`,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1, minWidth: 80, textAlign: "right" }}>
        <span style={{ color: COLORS.textPrimary, fontWeight: 700, fontSize: 14 }}>{home?.name ?? "TBD"}</span>
      </div>

      {isAdmin && (editing || !match.played) ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="number" min="0" value={hs} onChange={(e) => setHs(e.target.value)} style={scoreInputStyle} />
          <span style={{ color: COLORS.textDim, fontWeight: 800 }}>:</span>
          <input type="number" min="0" value={as_} onChange={(e) => setAs(e.target.value)} style={scoreInputStyle} />
          <Button small onClick={handleSave}>
            ✓
          </Button>
        </div>
      ) : (
        <div
          onClick={() => isAdmin && setEditing(true)}
          style={{
            cursor: isAdmin ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: COLORS.bg,
            borderRadius: 8,
            padding: "6px 16px",
          }}
        >
          <span style={{ color: match.played ? COLORS.textPrimary : COLORS.textDim, fontWeight: 800, fontSize: 20 }}>
            {match.played ? match.homeScore : "–"}
          </span>
          <span style={{ color: COLORS.textDim }}>:</span>
          <span style={{ color: match.played ? COLORS.textPrimary : COLORS.textDim, fontWeight: 800, fontSize: 20 }}>
            {match.played ? match.awayScore : "–"}
          </span>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 80, textAlign: "left" }}>
        <span style={{ color: COLORS.textPrimary, fontWeight: 700, fontSize: 14 }}>{away?.name ?? "TBD"}</span>
      </div>
    </div>
  );
};

/* ──── Knockout Bracket ──── */
const KnockoutView = ({ matches, teams, isAdmin, onSave, label }) => (
  <div>
    <h3
      style={{
        fontFamily: "'Playfair Display', serif",
        color: COLORS.textPrimary,
        fontSize: 20,
        marginBottom: 16,
      }}
    >
      {label}
    </h3>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {matches.map((m) => (
        <MatchCard key={m.id} match={m} teams={teams} isAdmin={isAdmin} onSave={onSave} />
      ))}
    </div>
  </div>
);

/* ──── Winner Banner ──── */
const WinnerBanner = ({ name }) => (
  <div
    style={{
      textAlign: "center",
      padding: "40px 20px",
      background: `linear-gradient(135deg, ${COLORS.gold}15, ${COLORS.accent}10)`,
      borderRadius: 16,
      border: `2px solid ${COLORS.gold}44`,
      marginBottom: 24,
    }}
  >
    <div style={{ fontSize: 56, marginBottom: 4 }}>🏆</div>
    <p style={{ color: COLORS.gold, fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 8px" }}>Champion</p>
    <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.textPrimary, fontSize: 36, margin: 0 }}>{name}</h2>
  </div>
);

/* ──────────────────── MAIN APP ──────────────────── */
export default function TournamentApp() {
  const [state, setState] = useState(null);
  const [view, setView] = useState("public"); // "admin" | "public"
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("standings"); // "standings" | "matches" | "knockout"

  // Load
  useEffect(() => {
    (async () => {
      const d = await load();
      if (d) setState(d);
      setLoading(false);
    })();
  }, []);

  // Save on change
  useEffect(() => {
    if (state) save(state);
  }, [state]);

  const getTopFour = () => {
    if (!state) return [];
    return computeTeamStats(state.teams, state.rounds).slice(0, 4);
  };

  const allGroupMatchesPlayed = useMemo(() => {
    if (!state || !state.rounds) return false;
    return state.rounds.every((r) => r.matches.every((m) => m.played));
  }, [state]);

  const allSemiPlayed = useMemo(() => {
    if (!state || !state.semis) return false;
    return state.semis.every((m) => m.played);
  }, [state]);

  /* ── Actions ── */
  const handleStart = (name, teams) => {
    const rounds = generateRoundRobin(teams);
    setState({ name, teams, rounds, phase: PHASES.GROUP, semis: null, final: null, thirdPlace: null, winner: null });
    setTab("matches");
  };

  const handleScoreSave = (matchId, hs, as_) => {
    setState((prev) => ({
      ...prev,
      rounds: prev.rounds.map((r) => ({
        ...r,
        matches: r.matches.map((m) =>
          m.id === matchId ? { ...m, homeScore: hs, awayScore: as_, played: true } : m
        ),
      })),
    }));
  };

  const handleGenerateSemis = () => {
    const top4 = getTopFour();
    // 1 vs 4, 2 vs 3
    const semis = [
      createMatch("SF1", top4[0].id, top4[3].id),
      createMatch("SF2", top4[1].id, top4[2].id),
    ];
    setState((prev) => ({ ...prev, phase: PHASES.SEMI, semis }));
    setTab("knockout");
  };

  const handleSemiSave = (matchId, hs, as_) => {
    setState((prev) => ({
      ...prev,
      semis: prev.semis.map((m) =>
        m.id === matchId ? { ...m, homeScore: hs, awayScore: as_, played: true } : m
      ),
    }));
  };

  const handleGenerateFinal = () => {
    const w1 = state.semis[0].homeScore > state.semis[0].awayScore ? state.semis[0].home : state.semis[0].away;
    const w2 = state.semis[1].homeScore > state.semis[1].awayScore ? state.semis[1].home : state.semis[1].away;
    const l1 = state.semis[0].homeScore > state.semis[0].awayScore ? state.semis[0].away : state.semis[0].home;
    const l2 = state.semis[1].homeScore > state.semis[1].awayScore ? state.semis[1].away : state.semis[1].home;
    const finalMatch = createMatch("F1", w1, w2);
    const thirdPlace = createMatch("3RD", l1, l2);
    setState((prev) => ({ ...prev, phase: PHASES.FINAL, final: finalMatch, thirdPlace }));
  };

  const handleFinalSave = (matchId, hs, as_) => {
    setState((prev) => {
      const final = matchId === "F1"
        ? { ...prev.final, homeScore: hs, awayScore: as_, played: true }
        : prev.final;
      const thirdPlace = matchId === "3RD"
        ? { ...prev.thirdPlace, homeScore: hs, awayScore: as_, played: true }
        : prev.thirdPlace;
      const bothPlayed = final?.played && thirdPlace?.played;
      const winnerId = bothPlayed ? (final.homeScore > final.awayScore ? final.home : final.away) : null;
      const winner = winnerId ? prev.teams.find((t) => t.id === winnerId)?.name ?? null : null;
      return { ...prev, final, thirdPlace, ...(bothPlayed ? { phase: PHASES.DONE, winner } : {}) };
    });
  };

  const handleReset = () => {
    setState(null);
    setTab("standings");
  };

  const isAdmin = view === "admin";

  /* ── Render ── */
  if (loading) {
    return (
      <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: COLORS.textSecondary, fontFamily: "'DM Sans', sans-serif" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: COLORS.bg,
        minHeight: "100vh",
        fontFamily: "'DM Sans', sans-serif",
        color: COLORS.textPrimary,
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700;800&display=swap" rel="stylesheet" />

      {/* ── Top bar ── */}
      <header
        style={{
          background: COLORS.surface,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>⚽</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: COLORS.textPrimary }}>
            {state?.name || "Tournament"}
          </span>
          {state && (
            <Badge color={state.phase === PHASES.DONE ? COLORS.gold : COLORS.accent}>
              {state.phase === PHASES.GROUP ? "Group Stage" : state.phase === PHASES.SEMI ? "Semifinals" : state.phase === PHASES.FINAL ? "Finals" : state.phase === PHASES.DONE ? "Completed" : ""}
            </Badge>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button small variant={view === "public" ? "primary" : "secondary"} onClick={() => setView("public")}>
            📺 Live
          </Button>
          <Button small variant={view === "admin" ? "primary" : "secondary"} onClick={() => setView("admin")}>
            🔧 Admin
          </Button>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
        {/* ── No tournament ── */}
        {!state && view === "admin" && <SetupView onStart={handleStart} />}
        {!state && view !== "admin" && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>⚽</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.textPrimary, margin: "0 0 8px" }}>No Tournament Yet</h2>
            <p style={{ color: COLORS.textSecondary }}>Switch to Admin mode to set up a tournament</p>
          </div>
        )}

        {/* ── Active Tournament ── */}
        {state && (
          <>
            {state.phase === PHASES.DONE && state.winner && <WinnerBanner name={state.winner} />}

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 24, background: COLORS.surface, borderRadius: 10, padding: 4 }}>
              {["standings", "matches", ...(state.semis || state.final ? ["knockout"] : [])].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    background: tab === t ? COLORS.accent + "18" : "transparent",
                    border: tab === t ? `1px solid ${COLORS.accent}33` : "1px solid transparent",
                    borderRadius: 8,
                    color: tab === t ? COLORS.accent : COLORS.textSecondary,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    textTransform: "capitalize",
                    letterSpacing: 0.5,
                  }}
                >
                  {t === "standings" ? "📊 Standings" : t === "matches" ? "📋 Matches" : "🏆 Knockout"}
                </button>
              ))}
            </div>

            {/* Standings */}
            {tab === "standings" && (
              <Card>
                <StandingsTable teams={state.teams} rounds={state.rounds} />
              </Card>
            )}

            {/* Matches */}
            {tab === "matches" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {state.rounds.map((r) => (
                  <div key={r.round}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <h3 style={{ color: COLORS.textPrimary, margin: 0, fontSize: 16, fontFamily: "'Playfair Display', serif" }}>
                        Round {r.round}
                      </h3>
                      {r.matches.every((m) => m.played) && <Badge color={COLORS.green}>Complete</Badge>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {r.matches.map((m) => (
                        <MatchCard key={m.id} match={m} teams={state.teams} isAdmin={isAdmin} onSave={handleScoreSave} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Knockout */}
            {tab === "knockout" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {state.semis && <KnockoutView matches={state.semis} teams={state.teams} isAdmin={isAdmin} onSave={handleSemiSave} label="🏟️ Semifinals" />}
                {state.thirdPlace && (
                  <KnockoutView matches={[state.thirdPlace]} teams={state.teams} isAdmin={isAdmin} onSave={handleFinalSave} label="🥉 Third Place" />
                )}
                {state.final && (
                  <KnockoutView matches={[state.final]} teams={state.teams} isAdmin={isAdmin} onSave={handleFinalSave} label="🏆 Final" />
                )}
              </div>
            )}

            {/* Admin actions */}
            {isAdmin && (
              <Card style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "center" }} glow>
                {state.phase === PHASES.GROUP && (
                  <Button onClick={handleGenerateSemis} disabled={!allGroupMatchesPlayed} variant="gold">
                    🏟️ Generate Semifinals
                  </Button>
                )}
                {state.phase === PHASES.SEMI && (
                  <Button onClick={handleGenerateFinal} disabled={!allSemiPlayed} variant="gold">
                    🏆 Generate Final
                  </Button>
                )}
                <Button variant="danger" onClick={handleReset}>
                  🗑️ Reset Tournament
                </Button>
                {state.phase === PHASES.GROUP && !allGroupMatchesPlayed && (
                  <p style={{ width: "100%", textAlign: "center", color: COLORS.textDim, fontSize: 12, margin: 0 }}>
                    Complete all group matches to unlock semifinals
                  </p>
                )}
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
