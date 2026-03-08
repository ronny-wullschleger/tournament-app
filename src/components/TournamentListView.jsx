import { PHASES, COLORS } from "../constants.js";
import Badge from "./Badge.jsx";
import Button from "./Button.jsx";
import Card from "./Card.jsx";
import styles from "./TournamentListView.module.css";

const phaseBadgeColor = (phase) =>
  phase === PHASES.DONE ? COLORS.gold : COLORS.accent;

const phaseLabel = (phase) => {
  if (phase === PHASES.GROUP) return "Group Stage";
  if (phase === PHASES.SEMI) return "Semifinals";
  if (phase === PHASES.FINAL) return "Finals";
  if (phase === PHASES.DONE) return "Completed";
  return phase;
};

export { phaseLabel, phaseBadgeColor };

const TournamentListView = ({ tournaments, onSelect, onCreateNew }) => {
  const sorted = [...tournaments].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>All Tournaments</h2>
        <Button onClick={onCreateNew}>＋ New Tournament</Button>
      </div>

      {sorted.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>⚽</div>
          <h2 className={styles.emptyTitle}>No Tournament Yet</h2>
          <p className={styles.emptySubtitle}>Create your first tournament to get started</p>
          <Button onClick={onCreateNew}>＋ New Tournament</Button>
        </div>
      ) : (
        <div className={styles.list}>
          {sorted.map((t) => (
            <Card key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div className={styles.cardInfo}>
                <div className={styles.cardNameRow}>
                  <span className={styles.cardName}>{t.name}</span>
                  <Badge color={phaseBadgeColor(t.phase)}>{phaseLabel(t.phase)}</Badge>
                </div>
                <div className={styles.cardMeta}>
                  {new Date(t.createdAt).toLocaleDateString()}
                  {t.phase === PHASES.DONE && t.winner && (
                    <span className={styles.cardWinner}>🏆 {t.winner}</span>
                  )}
                </div>
              </div>
              <Button small variant="secondary" onClick={() => onSelect(t.id)}>
                View →
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TournamentListView;
