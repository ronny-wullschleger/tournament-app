import { useState, useEffect, useMemo } from "react";
import { save, migrateIfNeeded, updateChannel, STORAGE_KEY, POLL_INTERVAL } from "../utils/storage";
import { generateRoundRobin, createMatch, computeTeamStats, uid } from "../utils/tournament";
import { PHASES } from "../utils/constants";

export const useTournament = () => {
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

  return {
    tournaments,
    activeId,
    setActiveId,
    activeTournament,
    view,
    setView,
    loading,
    tab,
    setTab,
    allGroupMatchesPlayed,
    allSemiPlayed,
    handleStart,
    handleScoreSave,
    handleGenerateSemis,
    handleSemiSave,
    handleGenerateFinal,
    handleFinalSave,
    handleDelete,
  };
};
