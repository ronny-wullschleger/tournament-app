import { useState, useEffect, useRef } from "react";
import styles from "./MatchCard.module.css";

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

  return (
    <div
      ref={containerRef}
      onBlur={isAdmin ? handleBlur : undefined}
      className={`${styles.matchCard} ${match.played ? styles.played : styles.pending}`}
    >
      <div className={`${styles.teamName} ${styles.teamHome}`}>
        {home?.name ?? "TBD"}
      </div>

      {isAdmin ? (
        <div className={styles.scoreAdmin}>
          <input
            type="number"
            min="0"
            value={hs}
            onChange={(e) => setHs(e.target.value)}
            className={styles.scoreInput}
          />
          <span className={styles.scoreSep}>:</span>
          <input
            type="number"
            min="0"
            value={as_}
            onChange={(e) => setAs(e.target.value)}
            className={styles.scoreInput}
          />
        </div>
      ) : (
        <div className={styles.scoreDisplay}>
          <span
            className={`${styles.scoreValue} ${match.played ? styles.scoreValuePlayed : styles.scoreValuePending}`}
          >
            {match.played ? match.homeScore : "–"}
          </span>
          <span className={styles.scoreSep}>:</span>
          <span
            className={`${styles.scoreValue} ${match.played ? styles.scoreValuePlayed : styles.scoreValuePending}`}
          >
            {match.played ? match.awayScore : "–"}
          </span>
        </div>
      )}

      <div className={`${styles.teamName} ${styles.teamAway}`}>
        {away?.name ?? "TBD"}
      </div>
    </div>
  );
};

export default MatchCard;
