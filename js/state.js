// Central mutable game state + helpers shared across screens.

const Game = {
  profession: null,
  money: 0,
  startMonth: 0, // index into MONTHS
  date: { month: 0, day: 1, year: 1848 },

  party: [], // { name, health: 'good'|'fair'|'poor'|'very poor', alive: true, illness: null }

  oxen: 0,
  food: 0,       // lbs
  clothing: 0,   // sets
  ammo: 0,       // bullets
  parts: { wheel: 0, axle: 0, tongue: 0 },
  cash: 0,

  mileage: 0,
  landmarkIndex: 0, // next landmark not yet reached
  pace: 'steady',
  rations: 'filling',
  weather: 'Fair',
  wagonDamaged: false,
  tookSublette: false,
  finalRoute: null, // 'toll' | 'raft'

  daysTravelled: 0,
  eventLog: [],

  reset() {
    this.profession = null;
    this.money = 0;
    this.startMonth = 0;
    this.date = { month: 0, day: 1, year: 1848 };
    this.party = [];
    this.oxen = 0;
    this.food = 0;
    this.clothing = 0;
    this.ammo = 0;
    this.parts = { wheel: 0, axle: 0, tongue: 0 };
    this.cash = 0;
    this.mileage = 0;
    this.landmarkIndex = 0;
    this.pace = 'steady';
    this.rations = 'filling';
    this.weather = 'Fair';
    this.wagonDamaged = false;
    this.tookSublette = false;
    this.finalRoute = null;
    this.daysTravelled = 0;
    this.eventLog = [];
  },

  alivePartyCount() {
    return this.party.filter(p => p.alive).length;
  },

  leaderAlive() {
    return this.party[0] && this.party[0].alive;
  },

  totalPeople() {
    return this.party.length;
  },

  addDays(n) {
    for (let i = 0; i < n; i++) {
      this.date.day++;
      if (this.date.day > 30) {
        this.date.day = 1;
        this.date.month++;
        if (this.date.month >= MONTHS.length) {
          this.date.month = MONTHS.length - 1; // stay in Sept-ish if game runs long
        }
      }
    }
    this.daysTravelled += n;
  },

  dateString() {
    return `${MONTHS[this.date.month]} ${this.date.day}, ${this.date.year}`;
  },

  milesToNext() {
    if (this.landmarkIndex >= LANDMARKS.length) return 0;
    return Math.max(0, LANDMARKS[this.landmarkIndex].dist - this.mileage);
  },

  milesFromPrev() {
    const prevDist = this.landmarkIndex === 0 ? 0 : LANDMARKS[this.landmarkIndex - 1].dist;
    return Math.max(0, this.mileage - prevDist);
  },

  log(msg) {
    this.eventLog.unshift(msg);
    if (this.eventLog.length > 6) this.eventLog.pop();
  },
};
