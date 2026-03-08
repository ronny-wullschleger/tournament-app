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

/**
 * Determines if scores from a given match stage can be modified based on the current tournament phase.
 * Prevents modifying earlier stages when later stages are running.
 *
 * @param {string} matchStage - The stage of the match being modified ("group", "semi", "final")
 * @param {string} currentPhase - The current phase of the tournament
 * @returns {boolean} - True if modification is allowed, false otherwise
 */
export const canModifyMatchStage = (matchStage, currentPhase) => {
  // If tournament is done, no modifications allowed
  if (currentPhase === PHASES.DONE) return false;

  // Can always modify matches in the current phase
  if (matchStage === currentPhase) return true;

  // Cannot modify earlier stages when later stages are running
  // Group stage can only be modified when tournament is still in group phase
  if (matchStage === PHASES.GROUP && (currentPhase === PHASES.SEMI || currentPhase === PHASES.FINAL)) {
    return false;
  }

  // Semi-finals can only be modified when tournament is in semi or earlier
  if (matchStage === PHASES.SEMI && currentPhase === PHASES.FINAL) {
    return false;
  }

  return true;
};

/**
 * Returns a user-friendly error message explaining why a modification is blocked.
 *
 * @param {string} currentPhase - The current phase of the tournament
 * @returns {string} - Error message
 */
export const getModificationBlockedMessage = (currentPhase) => {
  const currentStageLabel = phaseLabel(currentPhase).toLowerCase();
  return `Cannot modify scores from earlier stages while ${currentStageLabel} are in progress. This ensures tournament integrity.`;
};
