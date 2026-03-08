import { useState } from "react";
import { shuffle, uid } from "../utils/helpers.js";
import Button from "./Button.jsx";
import Card from "./Card.jsx";
import Input from "./Input.jsx";
import styles from "./SetupView.module.css";

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
  const canStart =
    teams.every((t) => t.trim().length > 0) &&
    new Set(teams.map((t) => t.trim().toLowerCase())).size === teams.length;

  return (
    <div className={styles.wrapper}>
      {onCancel && (
        <button onClick={onCancel} className={styles.backBtn}>
          ← Back to list
        </button>
      )}
      <div className={styles.hero}>
        <div className={styles.heroIcon}>⚽</div>
        <h1 className={styles.heroTitle}>Tournament Setup</h1>
        <p className={styles.heroSubtitle}>Round Robin · Semifinals · Final</p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <label className={styles.sectionLabel}>Tournament Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Tournament" />
      </Card>

      <Card>
        <div className={styles.teamListHeader}>
          <label className={styles.sectionLabel}>Teams ({teams.length}/12)</label>
          <Button small onClick={addTeam} disabled={teams.length >= 12}>
            + Add Team
          </Button>
        </div>
        <div className={styles.teamList}>
          {teams.map((t, i) => (
            <div key={i} className={styles.teamRow}>
              <span className={styles.teamIndex}>{i + 1}</span>
              <Input
                value={t}
                onChange={(e) => updateTeam(i, e.target.value)}
                placeholder={`Team ${i + 1}`}
              />
              {teams.length > 4 && (
                <button onClick={() => removeTeam(i)} className={styles.removeBtn}>
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className={styles.startRow}>
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
        {!canStart && (
          <p className={styles.validationMsg}>
            All team names must be unique and non-empty
          </p>
        )}
      </div>
    </div>
  );
};

export default SetupView;
