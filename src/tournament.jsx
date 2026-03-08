import { useState, useEffect, useMemo } from "react";
import { PHASES, COLORS } from "./constants.js";
import { uid, createMatch, computeTeamStats, generateRoundRobin } from "./utils/helpers.js";
import { STORAGE_KEY, POLL_INTERVAL, updateChannel, save, migrateIfNeeded } from "./utils/storage.js";
import {
  Badge,
  Button,
  Card,
  SetupView,
  StandingsTable,
  MatchCard,
  KnockoutView,
  WinnerBanner,
  TournamentListView,
  phaseLabel,
  phaseBadgeColor,
} from "./components/index.js";

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

  // Live updates: BroadcastChannel (same browser) + polling (cross-device)
  useEffect(() => {
    if (loading) return;
    const reload = async () => {
      try {
        const raw = await window.storage.get(STORAGE_KEY);
        if (!raw) return;
        const incoming = JSON.parse(raw.value).tournaments;
        setTournaments((prev) =>
          JSON.stringify(prev) === JSON.stringify(incoming) ? prev : incoming
        );
      } catch { /* ignore transient errors */ }
    };
    updateChannel?.addEventListener("message", reload);
    const timer = setInterval(reload, POLL_INTERVAL);
    return () => {
      updateChannel?.removeEventListener("message", reload);
      clearInterval(timer);
    };
  }, [loading]);

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

  const tabList = ["standings", "matches", ...(activeTournament?.semis || activeTournament?.final ? ["knockout"] : [])];

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: COLORS.textPrimary }}>
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
                style={{ background: "none", border: "none", color: COLORS.textSecondary, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", padding: 0 }}
              >
                ← All Tournaments
              </button>
              <span style={{ color: COLORS.textDim }}>/</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: COLORS.textPrimary }}>
                {activeTournament.name}
              </span>
              <Badge color={phaseBadgeColor(activeTournament.phase)}>
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
            {activeTournament.phase === PHASES.DONE && activeTournament.winner && (
              <WinnerBanner name={activeTournament.winner} />
            )}

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 24, background: COLORS.surface, borderRadius: 10, padding: 4 }}>
              {tabList.map((t) => (
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
                {activeTournament.semis && (
                  <KnockoutView matches={activeTournament.semis} teams={activeTournament.teams} isAdmin={isAdmin} onSave={handleSemiSave} label="🏟️ Semifinals" />
                )}
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
