import { useMemo } from "react";
import { computeTeamStats } from "../utils/helpers.js";
import styles from "./StandingsTable.module.css";

const StandingsTable = ({ teams, rounds }) => {
  const stats = useMemo(() => computeTeamStats(teams, rounds), [teams, rounds]);
  const cols = ["#", "Team", "P", "W", "D", "L", "GF", "GA", "GD", "Pts"];

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th
                key={c}
                className={`${styles.th} ${c === "Team" ? styles.thTeam : ""}`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.map((t, i) => {
            const gd = t.gf - t.ga;
            return (
              <tr
                key={t.id}
                className={`${styles.row} ${i < 4 ? styles.rowTop4 : ""}`}
              >
                <td className={`${styles.td} ${i < 4 ? styles.rankTop4 : styles.rankOther}`}>
                  {i + 1}
                </td>
                <td className={`${styles.td} ${styles.tdTeam}`}>
                  {t.name}{" "}
                  {i < 4 && <span className={styles.qualifierDot}>●</span>}
                </td>
                <td className={`${styles.td} ${styles.tdSecondary}`}>{t.p}</td>
                <td className={`${styles.td} ${styles.tdWins}`}>{t.w}</td>
                <td className={`${styles.td} ${styles.tdSecondary}`}>{t.d}</td>
                <td className={`${styles.td} ${styles.tdLosses}`}>{t.l}</td>
                <td className={`${styles.td} ${styles.tdSecondary}`}>{t.gf}</td>
                <td className={`${styles.td} ${styles.tdSecondary}`}>{t.ga}</td>
                <td
                  className={`${styles.td} ${gd > 0 ? styles.tdGdPositive : gd < 0 ? styles.tdGdNegative : styles.tdGdNeutral}`}
                >
                  {gd > 0 ? "+" : ""}
                  {gd}
                </td>
                <td className={`${styles.td} ${styles.tdPts}`}>{t.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className={styles.legend}>
        <span className={styles.legendDot}>●</span> Top 4 qualify for Semifinals
      </p>
    </div>
  );
};

export default StandingsTable;
