// Scoring and localStorage-backed high score table.

const Score = {
  STORAGE_KEY: 'oregonTrailScores',
  GRAVE_KEY: 'oregonTrailLastGrave',

  compute(state, endedWell) {
    if (!endedWell) return 0;
    let points = 0;
    points += state.alivePartyCount() * 100;
    // Health bonus per surviving member
    state.party.forEach(p => {
      if (!p.alive) return;
      if (p.health === 'good') points += 50;
      else if (p.health === 'fair') points += 30;
      else if (p.health === 'poor') points += 15;
    });
    points += Math.floor(state.cash * 0.2);
    points += state.oxen * 4;
    points += Math.floor(state.food / 5);
    points += state.ammo * 0.2;
    points += (state.parts.wheel + state.parts.axle + state.parts.tongue) * 3;
    // Profession multiplier: harder start (farmer) scores more per point.
    points *= PROFESSIONS[state.profession].points;
    return Math.round(points);
  },

  getAll() {
    let stored = [];
    try {
      stored = JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    } catch (e) { stored = []; }
    return [...HISTORICAL_SCORES, ...stored].sort((a, b) => b.score - a.score);
  },

  add(name, profession, score) {
    let stored = [];
    try {
      stored = JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    } catch (e) { stored = []; }
    stored.push({ name, profession, score });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored));
  },

  renderTable(container, highlightScore) {
    const all = this.getAll().slice(0, 12);
    let html = '<table><tr><th>Name</th><th>Profession</th><th>Score</th></tr>';
    all.forEach(row => {
      const hl = (highlightScore !== undefined && row.score === highlightScore) ? ' style="color:#ffcc33"' : '';
      html += `<tr${hl}><td>${row.name}</td><td>${row.profession}</td><td>${row.score}</td></tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
  },

  saveGrave(name, cause, epitaph, mileage) {
    localStorage.setItem(this.GRAVE_KEY, JSON.stringify({ name, cause, epitaph, mileage }));
  },

  getGraveAtMileage(mileage) {
    try {
      const g = JSON.parse(localStorage.getItem(this.GRAVE_KEY));
      if (g && Math.abs(g.mileage - mileage) < 15) return g;
    } catch (e) { /* ignore */ }
    return null;
  },
};
