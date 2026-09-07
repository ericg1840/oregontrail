// Hunting minigame: move a hunter around a field, aim in 8 directions, shoot animals.

const Hunt = {
  active: false,
  canvas: null, ctx: null,
  player: { x: 320, y: 300, dir: { x: 0, y: -1 }, moving: false },
  bullets: [],
  animals: [],
  meat: 0,
  keys: {},
  raf: null,
  timeLeft: 45, // seconds
  lastTick: 0,

  start(root, onDone) {
    this.active = true;
    this.meat = 0;
    this.timeLeft = 45;
    this.bullets = [];
    this.animals = [];
    this.player = { x: 320, y: 300, dir: { x: 0, y: -1 }, moving: false };
    this.canvas = root.querySelector('#hunt-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.onDone = onDone;

    root.querySelector('#hunt-ammo').textContent = Game.ammo;
    root.querySelector('#hunt-meat').textContent = this.meat;

    this._keydown = (e) => this.onKeyDown(e, root);
    this._keyup = (e) => { this.keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', this._keydown);
    window.addEventListener('keyup', this._keyup);

    root.querySelector('#btn-hunt-end').onclick = () => this.end(root);

    this.lastTick = performance.now();
    this.loop(root);
  },

  onKeyDown(e, root) {
    const k = e.key.toLowerCase();
    this.keys[k] = true;
    const dirMap = {
      arrowup: {x:0,y:-1}, w: {x:0,y:-1},
      arrowdown: {x:0,y:1}, s: {x:0,y:1},
      arrowleft: {x:-1,y:0}, a: {x:-1,y:0},
      arrowright: {x:1,y:0}, d: {x:1,y:0},
    };
    if (dirMap[k]) {
      this.player.dir = dirMap[k];
      this.player.moving = true;
    }
    if (k === ' ') {
      e.preventDefault();
      this.shoot(root);
    }
  },

  shoot(root) {
    if (Game.ammo <= 0) return;
    Game.ammo--;
    root.querySelector('#hunt-ammo').textContent = Game.ammo;
    this.bullets.push({
      x: this.player.x, y: this.player.y,
      vx: this.player.dir.x * 6, vy: this.player.dir.y * 6,
    });
  },

  spawnAnimal() {
    if (this.animals.length > 4) return;
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 1 + Math.random() * 1.5;
    if (side === 0) { x = -20; y = Math.random() * 340 + 10; vx = speed; vy = (Math.random()-0.5); }
    else if (side === 1) { x = 660; y = Math.random() * 340 + 10; vx = -speed; vy = (Math.random()-0.5); }
    else if (side === 2) { x = Math.random() * 620 + 10; y = -20; vx = (Math.random()-0.5); vy = speed; }
    else { x = Math.random() * 620 + 10; y = 380; vx = (Math.random()-0.5); vy = -speed; }
    const kinds = [
      { name: 'rabbit', lbs: 4, size: 8, color: '#c9a679' },
      { name: 'deer', lbs: 50, size: 14, color: '#a0623a' },
      { name: 'bison', lbs: 400, size: 22, color: '#5a4632' },
    ];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    this.animals.push({ x, y, vx, vy, ...kind, alive: true });
  },

  loop(root) {
    if (!this.active) return;
    const now = performance.now();
    const dt = (now - this.lastTick) / 1000;
    this.lastTick = now;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.end(root); return; }

    // move player
    const speed = 120 * dt;
    if (this.keys['arrowup'] || this.keys['w']) { this.player.y -= speed; this.player.dir = {x:0,y:-1}; }
    if (this.keys['arrowdown'] || this.keys['s']) { this.player.y += speed; this.player.dir = {x:0,y:1}; }
    if (this.keys['arrowleft'] || this.keys['a']) { this.player.x -= speed; this.player.dir = {x:-1,y:0}; }
    if (this.keys['arrowright'] || this.keys['d']) { this.player.x += speed; this.player.dir = {x:1,y:0}; }
    this.player.x = Math.max(10, Math.min(630, this.player.x));
    this.player.y = Math.max(10, Math.min(350, this.player.y));

    if (Math.random() < 0.02) this.spawnAnimal();

    this.animals.forEach(a => { a.x += a.vx; a.y += a.vy; });
    this.animals = this.animals.filter(a => a.x > -30 && a.x < 670 && a.y > -30 && a.y < 390);

    this.bullets.forEach(b => { b.x += b.vx; b.y += b.vy; });
    this.bullets = this.bullets.filter(b => b.x > 0 && b.x < 640 && b.y > 0 && b.y < 360);

    // collisions
    for (const b of this.bullets) {
      for (const a of this.animals) {
        if (!a.alive) continue;
        const dx = a.x - b.x, dy = a.y - b.y;
        if (Math.sqrt(dx*dx + dy*dy) < a.size) {
          a.alive = false;
          b.x = -100;
          const gained = Math.min(a.lbs, Math.max(0, 100 - this.meat));
          this.meat += gained;
          Game.log(`You shot a ${a.name}! +${gained} lbs meat.`);
          root.querySelector('#hunt-meat').textContent = this.meat;
        }
      }
    }
    this.animals = this.animals.filter(a => a.alive);

    this.render();
    this.raf = requestAnimationFrame(() => this.loop(root));
  },

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0d240d';
    ctx.fillRect(0, 0, 640, 360);
    ctx.fillStyle = '#173a17';
    for (let i = 0; i < 20; i++) {
      ctx.fillRect((i * 53) % 640, (i * 97) % 360, 4, 4);
    }
    // animals
    this.animals.forEach(a => {
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI*2);
      ctx.fill();
    });
    // bullets
    ctx.fillStyle = '#ffffff';
    this.bullets.forEach(b => ctx.fillRect(b.x-1, b.y-1, 2, 2));
    // player
    ctx.fillStyle = '#ffcc33';
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, 10, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#ff5555';
    ctx.beginPath();
    ctx.moveTo(this.player.x, this.player.y);
    ctx.lineTo(this.player.x + this.player.dir.x * 20, this.player.y + this.player.dir.y * 20);
    ctx.stroke();
    // HUD text
    ctx.fillStyle = '#55ff55';
    ctx.font = '12px monospace';
    ctx.fillText(`Time: ${Math.ceil(this.timeLeft)}s`, 10, 16);
  },

  end(root) {
    if (!this.active) return;
    this.active = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this._keydown);
    window.removeEventListener('keyup', this._keyup);
    Game.food += this.meat;
    Game.log(`Hunt over. Brought back ${this.meat} lbs of meat.`);
    if (this.onDone) this.onDone();
  },
};
