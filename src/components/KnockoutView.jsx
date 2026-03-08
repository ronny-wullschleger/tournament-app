import MatchCard from "./MatchCard.jsx";
import styles from "./KnockoutView.module.css";

const KnockoutView = ({ matches, teams, isAdmin, onSave, label }) => (
  <div>
    <h3 className={styles.heading}>{label}</h3>
    <div className={styles.list}>
      {matches.map((m) => (
        <MatchCard key={m.id} match={m} teams={teams} isAdmin={isAdmin} onSave={onSave} />
      ))}
    </div>
  </div>
);

export default KnockoutView;
