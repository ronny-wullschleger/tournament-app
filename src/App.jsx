import { useTournament } from "./hooks/useTournament";
import { Badge } from "./components/Badge";
import { Button } from "./components/Button";
import { Card } from "./components/Card";
import { SetupView } from "./components/SetupView";
import { TournamentListView } from "./components/TournamentListView";
import { StandingsTable } from "./components/StandingsTable";
import { MatchCard } from "./components/MatchCard";
import { KnockoutView } from "./components/KnockoutView";
import { WinnerBanner } from "./components/WinnerBanner";
import { PHASES, phaseLabel } from "./utils/constants";

export default function TournamentApp() {
  const {
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
  } = useTournament();

  const isAdmin = view === "admin";

  /* ── Render ── */
  if (loading) {
    return (
      <div className="bg-bg min-h-screen flex items-center justify-center">
        <p className="text-textSecondary font-sans">Loading…</p>
      </div>
    );
  }

  return (
    <div className="bg-bg min-h-screen font-sans text-textPrimary">
      {/* ── Top bar ── */}
      <header className="bg-surface border-b border-border py-3 px-6 flex justify-between items-center sticky top-0 z-[100]">
        <div className="flex items-center gap-3">
          <span className="text-[22px]">⚽</span>
          {activeId && activeId !== "new" && activeTournament ? (
            <>
              <button
                onClick={() => { setActiveId(null); setTab("standings"); }}
                className="bg-transparent border-none text-textSecondary cursor-pointer text-xs font-sans p-0 hover:text-textPrimary transition-colors"
              >
                ← All Tournaments
              </button>
              <span className="text-textDim">/</span>
              <span className="font-display font-bold text-lg text-textPrimary">
                {activeTournament.name}
              </span>
              <Badge color={activeTournament.phase === PHASES.DONE ? "gold" : "accent"}>
                {phaseLabel(activeTournament.phase)}
              </Badge>
            </>
          ) : (
            <span className="font-display font-bold text-lg text-textPrimary">
              All Tournaments
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button small variant={view === "public" ? "primary" : "secondary"} onClick={() => setView("public")}>
            📺 Live
          </Button>
          <Button small variant={view === "admin" ? "primary" : "secondary"} onClick={() => setView("admin")}>
            🔧 Admin
          </Button>
        </div>
      </header>

      <div className="max-w-[800px] mx-auto py-6 px-4">
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
              <div className="text-center py-20">
                <div className="text-[56px] mb-4">🔧</div>
                <h2 className="font-display text-textPrimary m-0 mb-2">Admin Only</h2>
                <p className="text-textSecondary">Switch to Admin mode to set up a tournament</p>
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
            <div className="flex gap-1 mb-6 bg-surface rounded-[10px] p-1">
              {["standings", "matches", ...(activeTournament.semis || activeTournament.final ? ["knockout"] : [])].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`
                    flex-1 py-2.5 rounded-lg cursor-pointer font-bold text-xs font-sans uppercase tracking-wider
                    ${tab === t
                      ? "bg-accent/10 border border-accent/20 text-accent"
                      : "bg-transparent border border-transparent text-textSecondary"
                    }
                  `}
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
              <div className="flex flex-col gap-5">
                {activeTournament.rounds.map((r) => (
                  <div key={r.round}>
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <h3 className="text-textPrimary m-0 text-base font-display">
                        Round {r.round}
                      </h3>
                      {r.matches.every((m) => m.played) && <Badge color="green">Complete</Badge>}
                    </div>
                    <div className="flex flex-col gap-2">
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
              <div className="flex flex-col gap-6">
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
              <Card className="mt-8 flex flex-wrap gap-2.5 items-center justify-center" glow>
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
                  <p className="w-full text-center text-textDim text-xs m-0">
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
