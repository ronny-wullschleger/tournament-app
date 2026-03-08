export const PHASES = {
  GROUP: "group",
  SEMI: "semi",
  FINAL: "final",
  DONE: "done"
};

export const phaseLabel = (phase) => {
  if (phase === PHASES.GROUP) return "Group Stage";
  if (phase === PHASES.SEMI) return "Semifinals";
  if (phase === PHASES.FINAL) return "Finals";
  if (phase === PHASES.DONE) return "Completed";
  return phase;
};

export const phaseBadgeColor = (phase) => {
  return phase === PHASES.DONE ? "gold" : "accent";
};
