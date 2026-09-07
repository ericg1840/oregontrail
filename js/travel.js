// Core day-to-day travel loop: consumption, health, random events, landmark arrival.

const Travel = {
  root: null,
  onArriveLandmark: null,
  onGameOver: null,
  animFrame: 0,
  animTimer: null,

  init(root, callbacks) {
    this.root = root;
    this.onArriveLandmark = callbacks.onArriveLandmark;
    this.onGameOver = callbacks.onGameOver;
    root.querySelectorAll('#travel-menu button').forEach(btn => {
      btn.addEventListener('click', () => this.handleMenu(btn.dataset.action));
    });
    this.startAnim();
  },

  startAnim() {
    if (this.animTimer) clearInterval(this.animTimer);
    this.animTimer = setInterval(() => {
      this.animFrame++;
      if (this.root.classList.contains('active') || document.getElementById('screen-travel').classList.contains('active')) {
        this.drawScene();
      }
    }, 200);
  },

  handleMenu(action) {
    switch (action) {
      case 'continue': this.advanceDay(); break;
      case 'checkSupplies': this.showSupplies(); break;
      case 'viewMap': this.showMap(); break;
      case 'changePace': this.showPaceMenu(); break;
      case 'changeRations': this.showRationsMenu(); break;
      case 'stopToRest': this.rest(); break;
      case 'trade': this.trade(); break;
      case 'hunt': this.goHunt(); break;
    }
  },

  refreshHud() {
    const r = this.root;
    r.querySelector('#hud-date').textContent = Game.dateString();
    r.querySelector('#hud-weather').textContent = Game.weather;
    r.querySelector('#hud-health').textContent = this.partyHealthSummary();
    r.querySelector('#hud-food').textContent = Math.max(0, Math.floor(Game.food));

    const nextLm = LANDMARKS[Game.landmarkIndex];
    r.querySelector('#hud-next').textContent = nextLm ? `${nextLm.name} (${Game.milesToNext()} mi)` : 'Willamette Valley';

    const prevName = Game.landmarkIndex === 0 ? 'Independence' : LANDMARKS[Game.landmarkIndex - 1].name;
    r.querySelector('#hud-from-name').textContent = prevName;
    r.querySelector('#hud-from-dist').textContent = Game.milesFromPrev();
    r.querySelector('#hud-to-name').textContent = nextLm ? nextLm.name : 'Willamette Valley';
    r.querySelector('#hud-to-dist').textContent = Game.milesToNext();

    r.querySelector('#event-log').innerHTML = Game.eventLog.map(e => `<div>${e}</div>`).join('');
    this.drawScene();
  },

  partyHealthSummary() {
    const order = { 'good': 0, 'fair': 1, 'poor': 2, 'very poor': 3 };
    let worst = 'good';
    Game.party.forEach(p => {
      if (p.alive && order[p.health] > order[worst]) worst = p.health;
    });
    return worst;
  },

  drawScene() {
    const canvas = this.root.querySelector('#trail-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#071807';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // ground
    ctx.fillStyle = '#173a17';
    ctx.fillRect(0, 120, canvas.width, 40);
    // simple terrain dots
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = '#1f4a1f';
      ctx.fillRect((i * 41 + this.animFrame) % canvas.width, 125 + (i % 3) * 5, 3, 3);
    }
    // landmark approaching from the right, based on progress within segment
    const prevDist = Game.landmarkIndex === 0 ? 0 : LANDMARKS[Game.landmarkIndex - 1].dist;
    const nextLm = LANDMARKS[Game.landmarkIndex];
    if (nextLm) {
      const segLen = nextLm.dist - prevDist;
      const progress = segLen > 0 ? (Game.mileage - prevDist) / segLen : 1;
      const lmX = canvas.width - progress * (canvas.width - 80);
      ctx.fillStyle = '#8899aa';
      ctx.fillRect(lmX, 60, 20, 60);
      ctx.fillStyle = '#ffcc33';
      ctx.font = '10px monospace';
      ctx.fillText(nextLm.name, Math.max(0, lmX - 30), 55);
    }
    // wagon
    const wobble = (this.animFrame % 2) * 2;
    ctx.fillStyle = '#a0703a';
    ctx.fillRect(70, 100 - wobble, 40, 20);
    ctx.beginPath();
    ctx.fillStyle = '#222';
    ctx.arc(78, 122 - wobble, 6, 0, Math.PI*2); ctx.fill();
    ctx.arc(102, 122 - wobble, 6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(30, 105 - wobble, 40, 10); // oxen
  },

  // ---- Day advancement ----
  advanceDay() {
    this.rollWeather();
    const milesToday = this.computeMiles();
    Game.mileage = Math.min(TOTAL_TRAIL, Game.mileage + milesToday);
    Game.addDays(1);

    this.consumeFood();
    this.applyHealth();
    this.maybeRandomEvent();
    this.checkDeaths();

    if (this.checkGameOver()) return;

    // Check for grave from a previous playthrough near current position
    const existingGrave = Score.getGraveAtMileage(Game.mileage);
    if (existingGrave && !Game._shownGraves) Game._shownGraves = new Set();
    if (existingGrave && Game._shownGraves && !Game._shownGraves.has(existingGrave.mileage)) {
      Game._shownGraves.add(existingGrave.mileage);
      this.onGameOver('showGrave', existingGrave);
      return;
    }

    if (Game.landmarkIndex < LANDMARKS.length && Game.mileage >= LANDMARKS[Game.landmarkIndex].dist) {
      this.onArriveLandmark(LANDMARKS[Game.landmarkIndex]);
      return;
    }
    if (Game.mileage >= TOTAL_TRAIL) {
      this.onGameOver('arrived');
      return;
    }

    this.refreshHud();
  },

  computeMiles() {
    const paceMult = PACE[Game.pace].mult;
    let base = 12 * paceMult;
    if (Game.weather === 'Rain') base *= 0.7;
    if (Game.weather === 'Storm') base *= 0.4;
    if (Game.weather === 'Snow') base *= 0.5;
    if (Game.wagonDamaged) base *= 0.5;
    if (Game.oxen < 2) base *= 0.3;
    return Math.round(base + (Math.random() * 4 - 2));
  },

  rollWeather() {
    const seasonIdx = Game.date.month; // 0=March..6=Sept
    const roll = Math.random();
    if (seasonIdx <= 1) { // March/April - cold, rain
      Game.weather = roll < 0.5 ? 'Fair' : (roll < 0.8 ? 'Rain' : 'Storm');
    } else if (seasonIdx >= 5) { // Aug/Sept - risk of early snow in mountains
      Game.weather = roll < 0.6 ? 'Fair' : (roll < 0.85 ? 'Rain' : 'Snow');
    } else {
      Game.weather = roll < 0.75 ? 'Fair' : (roll < 0.93 ? 'Rain' : 'Storm');
    }
  },

  consumeFood() {
    const perPerson = RATIONS[Game.rations].lbsPerPerson;
    const eaten = perPerson * Game.alivePartyCount();
    Game.food = Math.max(0, Game.food - eaten);
  },

  applyHealth() {
    const healthMult = RATIONS[Game.rations].healthMult;
    const starving = Game.food <= 0;
    Game.party.forEach(p => {
      if (!p.alive) return;
      let delta = 0;
      if (starving) delta -= 2;
      else if (healthMult < 1) delta -= 0.3;
      else if (healthMult > 1) delta += 0.2;
      if (Game.pace !== 'steady') delta -= 0.15;
      if (Game.weather === 'Storm' || Game.weather === 'Snow') delta -= 0.2;
      p._healthScore = (p._healthScore === undefined ? 3 : p._healthScore) + delta;
      p._healthScore = Math.max(0, Math.min(4, p._healthScore));
      const levels = ['very poor', 'poor', 'fair', 'good', 'good'];
      p.health = levels[Math.floor(p._healthScore)];
    });
  },

  maybeRandomEvent() {
    const eventMult = PACE[Game.pace].eventMult;
    const chance = 0.12 * eventMult;
    if (Math.random() > chance) return;

    const events = [
      () => { Game.log('A wheel breaks on the wagon.'); this.breakPart('wheel'); },
      () => { Game.log('An axle snaps!'); this.breakPart('axle'); },
      () => { Game.log('The wagon tongue breaks.'); this.breakPart('tongue'); },
      () => { const lost = Math.min(Game.food, 20 + Math.floor(Math.random()*40)); Game.food -= lost; Game.log(`Wild animals got into the food stores. Lost ${lost} lbs.`); },
      () => { const p = this.randomAlive(); if (p) { p._healthScore = Math.max(0, (p._healthScore||3) - 1.5); Game.log(`${p.name} has fallen ill.`); } },
      () => { if (Game.oxen > 0) { Game.oxen--; Game.log('An ox has gone lame and had to be left behind.'); } },
      () => { Game.log('A thief made off with some supplies in the night.'); Game.ammo = Math.max(0, Game.ammo - 10); Game.clothing = Math.max(0, Game.clothing - 1); },
      () => { Game.log('You found a bag of useful tools by the trail! +$10'); Game.cash += 10; },
      () => { Game.log('Good fortune: an easy day of travel.'); Game.mileage += 5; },
      () => { const p = this.randomAlive(); if (p) { p._healthScore = Math.max(0, (p._healthScore||3) - 2); Game.log(`${p.name} was bitten by a snake!`); } },
    ];
    events[Math.floor(Math.random() * events.length)]();
  },

  randomAlive() {
    const alive = Game.party.filter(p => p.alive);
    if (!alive.length) return null;
    return alive[Math.floor(Math.random() * alive.length)];
  },

  breakPart(part) {
    if (Game.parts[part] > 0) {
      Game.parts[part]--;
      Game.log(`You used a spare ${part} for repairs.`);
    } else {
      Game.wagonDamaged = true;
      Game.log(`You have no spare ${part} and must slow down for makeshift repairs.`);
    }
  },

  checkDeaths() {
    Game.party.forEach(p => {
      if (p.alive && p._healthScore !== undefined && p._healthScore <= 0) {
        p.alive = false;
        p.causeOfDeath = 'illness';
      }
    });
  },

  checkGameOver() {
    if (Game.alivePartyCount() === 0) {
      this.onGameOver('allDead');
      return true;
    }
    const dead = Game.party.find(p => !p.alive && !p._graveShown);
    if (dead) {
      dead._graveShown = true;
      this.onGameOver('memberDied', dead);
      return true;
    }
    return false;
  },

  // ---- Menu sub-actions ----
  showSupplies() {
    alert(
      `Party:\n${Game.party.map(p => `${p.name}: ${p.alive ? p.health : 'deceased'}`).join('\n')}\n\n` +
      `Cash: $${Game.cash.toFixed(2)}\nOxen: ${Game.oxen}\nFood: ${Math.floor(Game.food)} lbs\n` +
      `Clothing: ${Game.clothing}\nAmmunition: ${Game.ammo}\n` +
      `Spare parts - Wheels: ${Game.parts.wheel}, Axles: ${Game.parts.axle}, Tongues: ${Game.parts.tongue}\n` +
      `Wagon damaged: ${Game.wagonDamaged ? 'yes' : 'no'}`
    );
  },

  showMap() {
    const passed = LANDMARKS.filter(l => l.dist <= Game.mileage).map(l => l.name);
    alert(`Miles travelled: ${Math.floor(Game.mileage)} / ${TOTAL_TRAIL}\n\nLandmarks passed:\n${passed.join('\n') || '(none yet)'}`);
  },

  showPaceMenu() {
    const choice = prompt('Choose pace: steady / strenuous / grueling', Game.pace);
    if (choice && PACE[choice]) {
      Game.pace = choice;
      Game.log(`Pace set to ${PACE[choice].name}.`);
      this.refreshHud();
    }
  },

  showRationsMenu() {
    const choice = prompt('Choose rations: filling / meager / bareBones', Game.rations);
    if (choice && RATIONS[choice]) {
      Game.rations = choice;
      Game.log(`Rations set to ${RATIONS[choice].name}.`);
      this.refreshHud();
    }
  },

  rest() {
    const days = Math.max(1, Math.min(7, parseInt(prompt('Rest for how many days? (1-7)', '1'), 10) || 1));
    for (let i = 0; i < days; i++) {
      Game.addDays(1);
      this.consumeFood();
      Game.party.forEach(p => {
        if (!p.alive) return;
        p._healthScore = Math.min(4, (p._healthScore === undefined ? 3 : p._healthScore) + 0.4);
        const levels = ['very poor', 'poor', 'fair', 'good', 'good'];
        p.health = levels[Math.floor(p._healthScore)];
      });
    }
    Game.log(`You rested for ${days} day(s).`);
    if (this.checkGameOver()) return;
    this.refreshHud();
  },

  trade() {
    const outcomes = [
      () => { Game.food += 20; Game.log('Traded clothing for 20 lbs of food.'); Game.clothing = Math.max(0, Game.clothing - 1); },
      () => { Game.ammo += 20; Game.log('A trapper traded you 20 bullets for a fair price.'); Game.cash = Math.max(0, Game.cash - 2); },
      () => { Game.log('You met a friendly party but had nothing to trade.'); },
      () => { Game.parts.wheel += 1; Game.log('Traded with a passing family for a spare wheel.'); Game.cash = Math.max(0, Game.cash - 5); },
    ];
    outcomes[Math.floor(Math.random() * outcomes.length)]();
    this.refreshHud();
  },

  goHunt() {
    if (Game.ammo <= 0) { alert('You have no ammunition to hunt with.'); return; }
    document.getElementById('screen-travel').classList.remove('active');
    document.getElementById('screen-hunt').classList.add('active');
    Hunt.start(document, () => {
      document.getElementById('screen-hunt').classList.remove('active');
      document.getElementById('screen-travel').classList.add('active');
      this.refreshHud();
    });
  },
};
