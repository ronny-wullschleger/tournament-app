import { useState, useEffect, useMemo, useRef } from "react";

/* ───────────────────────── helpers ───────────────────────── */
const STORAGE_KEY = "rr-tournaments-v3";

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
const save = async (envelope) => {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(envelope));
  } catch (e) {
    console.error("Save failed", e);
  }
};

const migrateIfNeeded = async () => {
  try {
    const v3 = await window.storage.get(STORAGE_KEY);
    if (v3) return JSON.parse(v3.value);
    const v2 = await window.storage.get("rr-tournament-v2");
    if (v2) {
      const migrated = {
        tournaments: [{ id: uid(), createdAt: Date.now(), ...JSON.parse(v2.value) }],
        activeId: null,
      };
      await window.storage.set(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {
    // fall through to default
  }
  return { tournaments: [], activeId: null };
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
const SetupView = ({ onStart, onCancel }) => {
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
      {onCancel && (
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              color: COLORS.textSecondary,
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            ← Back to list
          </button>
        </div>
      )}
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
  const containerRef = useRef(null);

  useEffect(() => {
    setHs(match.homeScore ?? "");
    setAs(match.awayScore ?? "");
  }, [match.homeScore, match.awayScore]);

  const handleBlur = (e) => {
    // Only save when focus leaves this match card entirely
    if (containerRef.current?.contains(e.relatedTarget)) return;
    const h = parseInt(hs, 10);
    const a = parseInt(as_, 10);
    if (!isNaN(h) && !isNaN(a) && h >= 0 && a >= 0) {
      onSave(match.id, h, a);
    }
  };

  const scoreInputStyle = {
    width: 44, textAlign: "center", background: COLORS.bg,
    border: `1px solid ${COLORS.border}`, borderRadius: 6,
    color: COLORS.textPrimary, fontSize: 18, fontWeight: 800,
    padding: "6px 0", fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div
      ref={containerRef}
      onBlur={isAdmin ? handleBlur : undefined}
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

      {isAdmin ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="number" min="0" value={hs} onChange={(e) => setHs(e.target.value)} style={scoreInputStyle} />
          <span style={{ color: COLORS.textDim, fontWeight: 800 }}>:</span>
          <input type="number" min="0" value={as_} onChange={(e) => setAs(e.target.value)} style={scoreInputStyle} />
        </div>
      ) : (
        <div
          style={{
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

/* ──── Tournament List View ──── */
const phaseBadgeColor = (phase) =>
  phase === PHASES.DONE ? COLORS.gold : COLORS.accent;

const phaseLabel = (phase) => {
  if (phase === PHASES.GROUP) return "Group Stage";
  if (phase === PHASES.SEMI) return "Semifinals";
  if (phase === PHASES.FINAL) return "Finals";
  if (phase === PHASES.DONE) return "Completed";
  return phase;
};

const TournamentListView = ({ tournaments, onSelect, onCreateNew }) => {
  const sorted = [...tournaments].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.textPrimary, margin: 0, fontSize: 26 }}>
          All Tournaments
        </h2>
        <Button onClick={onCreateNew}>＋ New Tournament</Button>
      </div>

      {sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>⚽</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.textPrimary, margin: "0 0 8px" }}>No Tournament Yet</h2>
          <p style={{ color: COLORS.textSecondary, marginBottom: 24 }}>Create your first tournament to get started</p>
          <Button onClick={onCreateNew}>＋ New Tournament</Button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sorted.map((t) => (
            <Card key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ color: COLORS.textPrimary, fontWeight: 700, fontSize: 16 }}>{t.name}</span>
                  <Badge color={phaseBadgeColor(t.phase)}>{phaseLabel(t.phase)}</Badge>
                </div>
                <div style={{ color: COLORS.textDim, fontSize: 12 }}>
                  {new Date(t.createdAt).toLocaleDateString()}
                  {t.phase === PHASES.DONE && t.winner && (
                    <span style={{ marginLeft: 12, color: COLORS.gold }}>🏆 {t.winner}</span>
                  )}
                </div>
              </div>
              <Button small variant="secondary" onClick={() => onSelect(t.id)}>View →</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

/* ──────────────────── MAIN APP ──────────────────── */
export default function TournamentApp() {
  const [tournaments, setTournaments] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [view, setView] = useState("public"); // "admin" | "public"
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("standings"); // "standings" | "matches" | "knockout"

  // Load (with migration)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await migrateIfNeeded();
      if (cancelled) return;
      setTournaments(data.tournaments);
      setActiveId(data.activeId);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Save on change
  useEffect(() => {
    if (!loading) save({ tournaments, activeId });
  }, [tournaments, activeId, loading]);

  // Derived active tournament
  const activeTournament = tournaments.find((t) => t.id === activeId) ?? null;

  // Private update helper
  const updateActive = (updater) =>
    setTournaments((prev) => prev.map((t) => t.id === activeId ? { ...t, ...updater(t) } : t));

  const getTopFour = () => {
    if (!activeTournament) return [];
    return computeTeamStats(activeTournament.teams, activeTournament.rounds).slice(0, 4);
  };

  const allGroupMatchesPlayed = useMemo(() => {
    if (!activeTournament || !activeTournament.rounds) return false;
    return activeTournament.rounds.every((r) => r.matches.every((m) => m.played));
  }, [activeTournament]);

  const allSemiPlayed = useMemo(() => {
    if (!activeTournament || !activeTournament.semis) return false;
    return activeTournament.semis.every((m) => m.played);
  }, [activeTournament]);

  /* ── Actions ── */
  const handleStart = (name, teams) => {
    const newT = {
      id: uid(),
      createdAt: Date.now(),
      name,
      teams,
      rounds: generateRoundRobin(teams),
      phase: PHASES.GROUP,
      semis: null,
      final: null,
      thirdPlace: null,
      winner: null,
    };
    setTournaments((prev) => [...prev, newT]);
    setActiveId(newT.id);
    setTab("matches");
  };

  const handleScoreSave = (matchId, hs, as_) => {
    updateActive((prev) => ({
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
    const semis = [
      createMatch("SF1", top4[0].id, top4[3].id),
      createMatch("SF2", top4[1].id, top4[2].id),
    ];
    updateActive(() => ({ phase: PHASES.SEMI, semis }));
    setTab("knockout");
  };

  const handleSemiSave = (matchId, hs, as_) => {
    updateActive((prev) => ({
      semis: prev.semis.map((m) =>
        m.id === matchId ? { ...m, homeScore: hs, awayScore: as_, played: true } : m
      ),
    }));
  };

  const handleGenerateFinal = () => {
    const s = activeTournament.semis;
    const w1 = s[0].homeScore > s[0].awayScore ? s[0].home : s[0].away;
    const w2 = s[1].homeScore > s[1].awayScore ? s[1].home : s[1].away;
    const l1 = s[0].homeScore > s[0].awayScore ? s[0].away : s[0].home;
    const l2 = s[1].homeScore > s[1].awayScore ? s[1].away : s[1].home;
    updateActive(() => ({
      phase: PHASES.FINAL,
      final: createMatch("F1", w1, w2),
      thirdPlace: createMatch("3RD", l1, l2),
    }));
  };

  const handleFinalSave = (matchId, hs, as_) => {
    updateActive((prev) => {
      const final = matchId === "F1"
        ? { ...prev.final, homeScore: hs, awayScore: as_, played: true }
        : prev.final;
      const thirdPlace = matchId === "3RD"
        ? { ...prev.thirdPlace, homeScore: hs, awayScore: as_, played: true }
        : prev.thirdPlace;
      const bothPlayed = final?.played && thirdPlace?.played;
      const winnerId = bothPlayed ? (final.homeScore > final.awayScore ? final.home : final.away) : null;
      const winner = winnerId ? prev.teams.find((t) => t.id === winnerId)?.name ?? null : null;
      return { final, thirdPlace, ...(bothPlayed ? { phase: PHASES.DONE, winner } : {}) };
    });
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete "${activeTournament.name}"? This cannot be undone.`)) return;
    setTournaments((prev) => prev.filter((t) => t.id !== activeId));
    setActiveId(null);
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
          {activeId && activeId !== "new" && activeTournament ? (
            <>
              <button
                onClick={() => { setActiveId(null); setTab("standings"); }}
                style={{
                  background: "none",
                  border: "none",
                  color: COLORS.textSecondary,
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif",
                  padding: 0,
                }}
              >
                ← All Tournaments
              </button>
              <span style={{ color: COLORS.textDim }}>/</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: COLORS.textPrimary }}>
                {activeTournament.name}
              </span>
              <Badge color={activeTournament.phase === PHASES.DONE ? COLORS.gold : COLORS.accent}>
                {phaseLabel(activeTournament.phase)}
              </Badge>
            </>
          ) : (
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: COLORS.textPrimary }}>
              All Tournaments
            </span>
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
        {/* ── List view ── */}
        {activeId === null && (
          isAdmin
            ? <TournamentListView tournaments={tournaments} onSelect={(id) => setActiveId(id)} onCreateNew={() => setActiveId("new")} />
            : <TournamentListView tournaments={tournaments} onSelect={(id) => setActiveId(id)} onCreateNew={() => { setView("admin"); setActiveId("new"); }} />
        )}

        {/* ── Setup view ── */}
        {activeId === "new" && (
          isAdmin
            ? <SetupView onStart={handleStart} onCancel={() => setActiveId(null)} />
            : (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🔧</div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.textPrimary, margin: "0 0 8px" }}>Admin Only</h2>
                <p style={{ color: COLORS.textSecondary }}>Switch to Admin mode to set up a tournament</p>
              </div>
            )
        )}

        {/* ── Active Tournament ── */}
        {activeTournament && (
          <>
            {activeTournament.phase === PHASES.DONE && activeTournament.winner && <WinnerBanner name={activeTournament.winner} />}

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 24, background: COLORS.surface, borderRadius: 10, padding: 4 }}>
              {["standings", "matches", ...(activeTournament.semis || activeTournament.final ? ["knockout"] : [])].map((t) => (
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
                <StandingsTable teams={activeTournament.teams} rounds={activeTournament.rounds} />
              </Card>
            )}

            {/* Matches */}
            {tab === "matches" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {activeTournament.rounds.map((r) => (
                  <div key={r.round}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <h3 style={{ color: COLORS.textPrimary, margin: 0, fontSize: 16, fontFamily: "'Playfair Display', serif" }}>
                        Round {r.round}
                      </h3>
                      {r.matches.every((m) => m.played) && <Badge color={COLORS.green}>Complete</Badge>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {r.matches.map((m) => (
                        <MatchCard key={m.id} match={m} teams={activeTournament.teams} isAdmin={isAdmin} onSave={handleScoreSave} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Knockout */}
            {tab === "knockout" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {activeTournament.semis && <KnockoutView matches={activeTournament.semis} teams={activeTournament.teams} isAdmin={isAdmin} onSave={handleSemiSave} label="🏟️ Semifinals" />}
                {activeTournament.thirdPlace && (
                  <KnockoutView matches={[activeTournament.thirdPlace]} teams={activeTournament.teams} isAdmin={isAdmin} onSave={handleFinalSave} label="🥉 Third Place" />
                )}
                {activeTournament.final && (
                  <KnockoutView matches={[activeTournament.final]} teams={activeTournament.teams} isAdmin={isAdmin} onSave={handleFinalSave} label="🏆 Final" />
                )}
              </div>
            )}

            {/* Admin actions */}
            {isAdmin && (
              <Card style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "center" }} glow>
                {activeTournament.phase === PHASES.GROUP && (
                  <Button onClick={handleGenerateSemis} disabled={!allGroupMatchesPlayed} variant="gold">
                    🏟️ Generate Semifinals
                  </Button>
                )}
                {activeTournament.phase === PHASES.SEMI && (
                  <Button onClick={handleGenerateFinal} disabled={!allSemiPlayed} variant="gold">
                    🏆 Generate Final
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setActiveId("new")}>
                  ＋ New Tournament
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                  🗑️ Delete Tournament
                </Button>
                {activeTournament.phase === PHASES.GROUP && !allGroupMatchesPlayed && (
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
