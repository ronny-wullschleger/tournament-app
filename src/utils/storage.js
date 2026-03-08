export const STORAGE_KEY = "rr-tournaments-v3";
export const POLL_INTERVAL = 5000;

// BroadcastChannel for same-browser tab updates
export const updateChannel = typeof BroadcastChannel !== "undefined"
  ? new BroadcastChannel("rr-tournaments-v3")
  : null;

/**
 * Save tournament data to storage
 */
export const save = async (envelope) => {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(envelope));
    updateChannel?.postMessage("update");
  } catch (e) {
    console.error("Save failed", e);
  }
};

/**
 * Load and migrate data if needed
 * Handles migration from v2 to v3 format
 */
export const migrateIfNeeded = async () => {
  try {
    const v3 = await window.storage.get(STORAGE_KEY);
    if (v3) return JSON.parse(v3.value);
    const v2 = await window.storage.get("rr-tournament-v2");
    if (v2) {
      const { uid } = await import('./tournament.js');
      const migrated = {
        tournaments: [{ id: uid(), createdAt: Date.now(), ...JSON.parse(v2.value) }],
        activeId: null,
      };
      await window.storage.set(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {
    // fall through to default
  }
  return { tournaments: [], activeId: null };
};
