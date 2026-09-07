// River crossing screen: ford, caulk & float, or pay for a ferry.

const River = {
  current: null,

  depthInfo(depth) {
    switch (depth) {
      case 'shallow': return { feet: 2 + Math.floor(Math.random() * 2), width: 200 + Math.floor(Math.random()*100) };
      case 'medium': return { feet: 3 + Math.floor(Math.random() * 3), width: 400 + Math.floor(Math.random()*200) };
      case 'deep': return { feet: 5 + Math.floor(Math.random() * 4), width: 600 + Math.floor(Math.random()*300) };
      default: return { feet: 3, width: 300 };
    }
  },

  start(root, landmark, onDone) {
    const info = this.depthInfo(landmark.depth);
    this.current = { landmark, info, onDone };

    root.querySelector('#river-title').textContent = landmark.name;
    root.querySelector('#river-desc').textContent =
      `The river is ${info.feet} feet deep and ${info.width} feet wide. Weather: ${Game.weather}.`;

    this.drawScene(root.querySelector('#river-canvas'), info);

    const choices = root.querySelector('#river-choices');
    choices.innerHTML = '';

    const addChoice = (label, fn) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.onclick = fn;
      choices.appendChild(b);
    };

    addChoice('Ford the river', () => this.attemptFord(root));
    addChoice('Caulk the wagon and float across', () => this.attemptFloat(root));
    if (landmark.ferry) {
      const cost = 5 + Math.floor(Game.mileage / 200);
      addChoice(`Pay for a ferry ($${cost})`, () => this.attemptFerry(root, cost));
    }
    addChoice('Wait a day and see if conditions improve', () => this.waitAndRetry(root));
  },

  drawScene(canvas, info) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#071807';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2255aa';
    const w = Math.min(canvas.width - 40, info.width / 3);
    ctx.fillRect((canvas.width - w) / 2, 0, w, canvas.height);
    ctx.fillStyle = '#88bbff';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect((canvas.width - w) / 2 + Math.random() * w, Math.random() * canvas.height, 20, 2);
    }
    ctx.fillStyle = '#55ff55';
    ctx.fillRect(0, canvas.height - 20, (canvas.width - w) / 2, 20);
    ctx.fillRect((canvas.width + w) / 2, canvas.height - 20, (canvas.width - w) / 2, 20);
  },

  outcomeChance(info, method) {
    // Returns chance (0-1) of a clean crossing.
    let base;
    if (method === 'ford') base = 0.9 - info.feet * 0.09;
    else if (method === 'float') base = 0.8 - info.feet * 0.03;
    else base = 1.0; // ferry
    if (Game.weather === 'Rain' || Game.weather === 'Storm') base -= 0.15;
    return Math.max(0.05, Math.min(0.98, base));
  },

  resolve(root, method, chance) {
    const roll = Math.random();
    if (roll < chance) {
      Game.log(`You successfully crossed via ${method}.`);
      this.finish(root);
      return;
    }
    // Something goes wrong.
    const mishap = Math.random();
    if (mishap < 0.4 && (Game.parts.wheel > 0 || Game.parts.axle > 0 || Game.parts.tongue > 0 || true)) {
      Game.log('Your wagon was damaged crossing the river!');
      Game.wagonDamaged = true;
    } else if (mishap < 0.75) {
      const lost = Math.min(Game.food, 30 + Math.floor(Math.random() * 60));
      Game.food -= lost;
      Game.log(`You lost ${lost} lbs of food in the crossing!`);
    } else {
      const victim = Game.party.filter(p => p.alive)[Math.floor(Math.random() * Game.alivePartyCount())];
      if (victim) {
        victim.alive = false;
        Game.log(`${victim.name} drowned crossing the river!`);
      }
    }
    this.finish(root);
  },

  attemptFord(root) {
    this.resolve(root, 'fording', this.outcomeChance(this.current.info, 'ford'));
  },
  attemptFloat(root) {
    this.resolve(root, 'caulking and floating', this.outcomeChance(this.current.info, 'float'));
  },
  attemptFerry(root, cost) {
    if (Game.cash < cost) {
      Game.log("You can't afford the ferry.");
      this.start(root, this.current.landmark, this.current.onDone);
      return;
    }
    Game.cash -= cost;
    this.resolve(root, 'the ferry', this.outcomeChance(this.current.info, 'ferry'));
  },
  waitAndRetry(root) {
    Game.addDays(1);
    Game.log('You waited a day, hoping the river would calm.');
    this.start(root, this.current.landmark, this.current.onDone);
  },

  finish(root) {
    const cb = this.current.onDone;
    this.current = null;
    cb();
  },
};
