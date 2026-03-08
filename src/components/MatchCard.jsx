import { useState, useEffect, useRef } from "react";
import { canModifyMatchStage, getModificationBlockedMessage } from "../utils/constants";

export const MatchCard = ({ match, teams, isAdmin, onSave, matchStage, currentPhase }) => {
  const home = teams.find((t) => t.id === match.home);
  const away = teams.find((t) => t.id === match.away);
  const [hs, setHs] = useState(match.homeScore ?? "");
  const [as_, setAs] = useState(match.awayScore ?? "");
  const containerRef = useRef(null);

  // Check if this match can be modified based on tournament phase
  const canModify = matchStage && currentPhase ? canModifyMatchStage(matchStage, currentPhase) : true;
  const isDisabled = isAdmin && !canModify;
  const blockedMessage = !canModify ? getModificationBlockedMessage(currentPhase) : null;

  useEffect(() => {
    setHs(match.homeScore ?? "");
    setAs(match.awayScore ?? "");
  }, [match.homeScore, match.awayScore]);

  const handleBlur = (e) => {
    // Don't save if modification is blocked
    if (!canModify) return;
    // Only save when focus leaves this match card entirely
    if (containerRef.current?.contains(e.relatedTarget)) return;
    const h = parseInt(hs, 10);
    const a = parseInt(as_, 10);
    if (!isNaN(h) && !isNaN(a) && h >= 0 && a >= 0) {
      onSave(match.id, h, a);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={containerRef}
        onBlur={isAdmin ? handleBlur : undefined}
        className={`
          rounded-xl px-4 py-3.5 flex items-center justify-between gap-2.5 flex-wrap
          ${match.played
            ? "bg-surfaceAlt border border-border"
            : "bg-surface border border-accent/20"
          }
          ${isDisabled ? "opacity-60" : ""}
        `}
        title={isDisabled ? blockedMessage : undefined}
      >
        <div className="flex-1 min-w-[80px] text-right">
          <span className="text-textPrimary font-bold text-sm">{home?.name ?? "TBD"}</span>
        </div>

        {isAdmin ? (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              value={hs}
              onChange={(e) => setHs(e.target.value)}
              disabled={isDisabled}
              className="w-11 text-center bg-bg border border-border rounded-md text-textPrimary text-lg font-extrabold py-1.5 font-sans [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span className="text-textDim font-extrabold">:</span>
            <input
              type="number"
              min="0"
              value={as_}
              onChange={(e) => setAs(e.target.value)}
              disabled={isDisabled}
              className="w-11 text-center bg-bg border border-border rounded-md text-textPrimary text-lg font-extrabold py-1.5 font-sans [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-bg rounded-lg px-4 py-1.5">
            <span className={`font-extrabold text-xl ${match.played ? "text-textPrimary" : "text-textDim"}`}>
              {match.played ? match.homeScore : "–"}
            </span>
            <span className="text-textDim">:</span>
            <span className={`font-extrabold text-xl ${match.played ? "text-textPrimary" : "text-textDim"}`}>
              {match.played ? match.awayScore : "–"}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-[80px] text-left">
          <span className="text-textPrimary font-bold text-sm">{away?.name ?? "TBD"}</span>
        </div>
      </div>
      {isDisabled && (
        <div className="px-4 py-2 bg-surface/50 border border-border/50 rounded-lg flex items-start gap-2">
          <span className="text-textDim text-[14px]">🔒</span>
          <p className="text-textDim text-xs m-0 leading-relaxed">
            {blockedMessage}
          </p>
        </div>
      )}
    </div>
  );
};
