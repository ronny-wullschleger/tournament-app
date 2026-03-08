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
 * Compute team statistics from rounds.
 * Sort priority (per points group):
 *   1. Points
 *   2. Head-to-head points (among tied teams)
 *   3. Head-to-head goal difference
 *   4. Head-to-head goals scored
 *   5. Overall goal difference
 *   6. Overall goals scored
 *   7. Coin flip
 */
export const computeTeamStats = (teams, rounds) => {
  const s = {};
  teams.forEach((t) => {
    s[t.id] = { id: t.id, name: t.name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
  });

  const played = [];
  rounds.forEach((r) =>
    r.matches.forEach((m) => {
      if (!m.played) return;
      played.push(m);
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

  const stats = Object.values(s);
  // Assign coin-flip value once per sort so it's stable within this call
  stats.forEach(t => { t._coin = Math.random(); });

  const h2hStats = (ids) => {
    const idSet = new Set(ids);
    const h = Object.fromEntries(ids.map(id => [id, { pts: 0, gd: 0, gf: 0 }]));
    played.forEach(m => {
      if (!idSet.has(m.home) || !idSet.has(m.away)) return;
      h[m.home].gf += m.homeScore;
      h[m.home].gd += m.homeScore - m.awayScore;
      h[m.away].gf += m.awayScore;
      h[m.away].gd += m.awayScore - m.homeScore;
      if (m.homeScore > m.awayScore) h[m.home].pts += 3;
      else if (m.homeScore < m.awayScore) h[m.away].pts += 3;
      else { h[m.home].pts++; h[m.away].pts++; }
    });
    return h;
  };

  stats.sort((a, b) => b.pts - a.pts);

  const result = [];
  let i = 0;
  while (i < stats.length) {
    let j = i + 1;
    while (j < stats.length && stats[j].pts === stats[i].pts) j++;
    const group = stats.slice(i, j);
    if (group.length > 1) {
      const h = h2hStats(group.map(t => t.id));
      group.sort((a, b) =>
        (h[b.id].pts - h[a.id].pts) ||
        (h[b.id].gd - h[a.id].gd) ||
        (h[b.id].gf - h[a.id].gf) ||
        ((b.gf - b.ga) - (a.gf - a.ga)) ||
        (b.gf - a.gf) ||
        (a._coin - b._coin)
      );
    }
    result.push(...group);
    i = j;
  }
  return result;
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
