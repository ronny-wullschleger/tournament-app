/**
 * Fisher-Yates shuffle algorithm
 */
export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Generate a random unique ID
 */
export const uid = () => Math.random().toString(36).slice(2, 8);

/**
 * Create a match object with default values
 */
export const createMatch = (id, home, away) => ({
  id,
  home,
  away,
  homeScore: null,
  awayScore: null,
  played: false
});

/**
 * Compute team statistics from rounds
 * Returns sorted array by: points → goal difference → goals for
 */
export const computeTeamStats = (teams, rounds) => {
  const s = {};
  teams.forEach((t) => {
    s[t.id] = { id: t.id, name: t.name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
  });
  rounds.forEach((r) =>
    r.matches.forEach((m) => {
      if (!m.played) return;
      const h = s[m.home], a = s[m.away];
      if (!h || !a) return;
      h.p++; a.p++;
      h.gf += m.homeScore; h.ga += m.awayScore;
      a.gf += m.awayScore; a.ga += m.homeScore;
      if (m.homeScore > m.awayScore) { h.w++; a.l++; h.pts += 3; }
      else if (m.homeScore < m.awayScore) { a.w++; h.l++; a.pts += 3; }
      else { h.d++; a.d++; h.pts++; a.pts++; }
    })
  );
  return Object.values(s).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
};

/**
 * Generate round-robin schedule using circle method
 */
export const generateRoundRobin = (teams) => {
  const t = [...teams];
  if (t.length % 2 !== 0) t.push({ id: "BYE", name: "BYE" });
  const n = t.length;
  const rounds = [];
  const fixed = t[0];
  const rotating = t.slice(1);

  for (let r = 0; r < n - 1; r++) {
    const current = [fixed, ...rotating];
    const matches = [];
    for (let i = 0; i < n / 2; i++) {
      const home = current[i];
      const away = current[n - 1 - i];
      if (home.id !== "BYE" && away.id !== "BYE") {
        matches.push({ ...createMatch(`R${r + 1}-M${i + 1}`, home.id, away.id), round: r + 1 });
      }
    }
    rounds.push({ round: r + 1, matches });
    rotating.push(rotating.shift());
  }
  return rounds;
};
