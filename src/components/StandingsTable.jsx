import { useMemo } from "react";
import { computeTeamStats } from "../utils/tournament";

export const StandingsTable = ({ teams, rounds }) => {
  const stats = useMemo(() => computeTeamStats(teams, rounds), [teams, rounds]);

  const cols = ["#", "Team", "P", "W", "D", "L", "GF", "GA", "GD", "Pts"];

  return (
    <div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {cols.map((c) => (
              <th
                key={c}
                className={`
                  py-2.5 px-2 text-center text-xs
                  text-textDim font-bold tracking-wider uppercase
                  border-b border-border
                  ${c === "Team" ? "text-left" : "text-center"}
                `}
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
              className={`
                border-b border-border
                ${i < 4 ? "bg-accent/5" : ""}
              `}
            >
              <td className={`py-2.5 px-2 text-center text-xs font-bold ${i < 4 ? "text-accent" : "text-textDim"}`}>
                {i + 1}
              </td>
              <td className="py-2.5 px-2 text-left text-xs text-textPrimary font-semibold">
                {t.tiebreakNote ? (
                  <span className="group relative cursor-help inline-block">
                    {t.name}
                    {i < 4 && <span className="text-accent text-[10px] ml-0.5">●</span>}
                    <span className="text-textDim text-[9px] ml-0.5 align-super select-none">ⓘ</span>
                    <span className="pointer-events-none absolute left-0 top-full mt-1 z-50 w-64 rounded-lg bg-surface border border-border px-3 py-2 text-[11px] text-textSecondary leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-normal font-normal">
                      {t.tiebreakNote}
                    </span>
                  </span>
                ) : (
                  <>{t.name}{i < 4 && <span className="text-accent text-[10px] ml-0.5">●</span>}</>
                )}
              </td>
              <td className="py-2.5 px-2 text-center text-xs text-textSecondary">{t.p}</td>
              <td className="py-2.5 px-2 text-center text-xs text-green">{t.w}</td>
              <td className="py-2.5 px-2 text-center text-xs text-textSecondary">{t.d}</td>
              <td className="py-2.5 px-2 text-center text-xs text-red">{t.l}</td>
              <td className="py-2.5 px-2 text-center text-xs text-textSecondary">{t.gf}</td>
              <td className="py-2.5 px-2 text-center text-xs text-textSecondary">{t.ga}</td>
              <td className={`
                py-2.5 px-2 text-center text-xs font-semibold
                ${t.gf - t.ga > 0 ? "text-green" : t.gf - t.ga < 0 ? "text-red" : "text-textSecondary"}
              `}>
                {t.gf - t.ga > 0 ? "+" : ""}
                {t.gf - t.ga}
              </td>
              <td className="py-2.5 px-2 text-center text-[15px] text-gold font-extrabold">{t.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-textDim text-[11px] mt-2">
        <span className="text-accent">●</span> Top 4 qualify for Semifinals
      </p>
    </div>
  );
};
