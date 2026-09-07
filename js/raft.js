// Columbia River rafting minigame: steer the raft left/right to dodge rocks.

const Raft = {
  active: false,
  canvas: null, ctx: null,
  raftX: 320,
  rocks: [],
  scroll: 0,
  distance: 0,
  goal: 2000,
  keys: {},
  raf: null,
  lastTick: 0,
  hits: 0,

  start(root, onDone) {
    this.active = true;
    this.raftX = 320;
    this.rocks = [];
    this.scroll = 0;
    this.distance = 0;
    this.hits = 0;
    this.onDone = onDone;
    this.canvas = root.querySelector('#raft-canvas');
    this.ctx = this.canvas.getContext('2d');

    this._keydown = (e) => { this.keys[e.key.toLowerCase()] = true; };
    this._keyup = (e) => { this.keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', this._keydown);
    window.addEventListener('keyup', this._keyup);

    this.lastTick = performance.now();
    this.loop();
  },

  spawnRock() {
    const x = 40 + Math.random() * 560;
    this.rocks.push({ x, y: -20, size: 14 + Math.random() * 14 });
  },

  loop() {
    if (!this.active) return;
    const now = performance.now();
    const dt = (now - this.lastTick) / 1000;
    this.lastTick = now;

    const speed = 260 * dt;
    if (this.keys['arrowleft'] || this.keys['a']) this.raftX -= speed;
    if (this.keys['arrowright'] || this.keys['d']) this.raftX += speed;
    this.raftX = Math.max(30, Math.min(610, this.raftX));

    const scrollSpeed = 140 * dt;
    this.distance += scrollSpeed;
    if (Math.random() < 0.04) this.spawnRock();
    this.rocks.forEach(r => r.y += scrollSpeed);
    this.rocks = this.rocks.filter(r => r.y < 420);

    for (const r of this.rocks) {
      if (r.hit) continue;
      const dx = r.x - this.raftX, dy = r.y - 350;
      if (Math.sqrt(dx*dx + dy*dy) < r.size + 12) {
        r.hit = true;
        this.hits++;
        Game.log('Your raft struck a rock!');
      }
    }

    this.render();

    if (this.distance >= this.goal) { this.finish(); return; }
    if (this.hits >= 5) { this.finish(); return; }

    this.raf = requestAnimationFrame(() => this.loop());
  },

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#123a5c';
    ctx.fillRect(0, 0, 640, 400);
    ctx.fillStyle = '#1c5a8c';
    for (let i = 0; i < 10; i++) {
      ctx.fillRect((i*67 + this.distance*2) % 640, (i*93) % 400, 30, 3);
    }
    ctx.fillStyle = '#777';
    this.rocks.forEach(r => {
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.size, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.fillStyle = '#a0703a';
    ctx.fillRect(this.raftX - 18, 340, 36, 20);
    ctx.fillStyle = '#55ff55';
    ctx.font = '14px monospace';
    ctx.fillText(`Distance: ${Math.floor(this.distance)}/${this.goal}`, 10, 20);
    ctx.fillText(`Hits: ${this.hits}/5`, 10, 40);
  },

  finish() {
    this.active = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this._keydown);
    window.removeEventListener('keyup', this._keyup);
    const success = this.hits < 5;
    if (!success) {
      Game.log('Your raft was wrecked on the rocks!');
      const lost = Math.min(Game.food, 100);
      Game.food -= lost;
      Game.wagonDamaged = true;
    } else if (this.hits > 0) {
      Game.log(`You made it across, though you struck ${this.hits} rock(s) along the way.`);
    } else {
      Game.log('You navigated the Columbia River without a scratch!');
    }
    if (this.onDone) this.onDone(success);
  },
};
