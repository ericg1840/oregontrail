// Static game data: landmarks, professions, prices, historical high scores.

const PROFESSIONS = {
  banker:    { name: 'Banker',    money: 1600, points: 1 },
  carpenter: { name: 'Carpenter', money: 800,  points: 2 },
  farmer:    { name: 'Farmer',    money: 400,  points: 3 },
};

const MONTHS = ['March', 'April', 'May', 'June', 'July', 'August', 'September'];

// Base prices per unit, rise slightly the further along the trail you are.
const PRICES = {
  oxen: 40,        // per ox, sold in yokes of 2 (min 2, typical team 6-8)
  food: 0.20,      // per pound
  clothing: 10,    // per set
  ammo: 2,         // per box of 20 bullets
  parts_wheel: 10,
  parts_axle: 10,
  parts_tongue: 10,
};

// 16 segments each ending in a landmark, distance = miles from Independence.
const LANDMARKS = [
  { name: 'Kansas River Crossing', dist: 102,  type: 'river', depth: 'shallow' },
  { name: 'Big Blue River Crossing', dist: 185, type: 'river', depth: 'medium' },
  { name: 'Fort Kearney', dist: 304, type: 'fort' },
  { name: 'Chimney Rock', dist: 554, type: 'landmark' },
  { name: 'Fort Laramie', dist: 640, type: 'fort' },
  { name: 'Independence Rock', dist: 830, type: 'landmark' },
  { name: 'South Pass', dist: 917, type: 'landmark' },
  { name: 'Green River Crossing', dist: 942, type: 'river', depth: 'deep', ferry: true },
  { name: 'Parting of the Ways', dist: 960, type: 'cutoff',
    mainName: 'Fort Bridger', mainDist: 985,
    cutoffName: 'Sublette Cutoff', cutoffDist: 1032, cutoffSkip: 'Fort Bridger' },
  { name: 'Soda Springs', dist: 1074, type: 'landmark' },
  { name: 'Fort Hall', dist: 1109, type: 'fort' },
  { name: 'Snake River Crossing', dist: 1236, type: 'river', depth: 'deep', ferry: true },
  { name: 'Fort Boise', dist: 1349, type: 'fort' },
  { name: 'Blue Mountains', dist: 1483, type: 'landmark' },
  { name: 'Fort Walla Walla', dist: 1557, type: 'fort' },
  { name: 'The Dalles', dist: 1737, type: 'end',
    tollName: 'Barlow Toll Road', tollDist: 1930, tollCost: 5,
    raftName: 'Columbia River', raftDist: 1930 },
];

const TOTAL_TRAIL = 1930; // Willamette Valley

// Pre-populated historical high scores shown alongside the player's own.
const HISTORICAL_SCORES = [
  { name: 'E. Meeker',   profession: 'Farmer',    score: 4120 },
  { name: 'N. Bidwell',  profession: 'Carpenter', score: 3870 },
  { name: 'J. Applegate', profession: 'Farmer',   score: 3540 },
  { name: 'M. Whitman',  profession: 'Banker',    score: 3200 },
  { name: 'W. Sublette', profession: 'Carpenter', score: 2990 },
  { name: 'P. Burnett',  profession: 'Banker',    score: 2650 },
  { name: 'J. Fremont',  profession: 'Farmer',    score: 2300 },
];

const PACE = {
  steady:   { name: 'Steady',   mult: 1.0,  eventMult: 1.0 },
  strenuous:{ name: 'Strenuous',mult: 1.3,  eventMult: 1.4 },
  grueling: { name: 'Grueling', mult: 1.6,  eventMult: 2.0 },
};

const RATIONS = {
  filling:  { name: 'Filling',  lbsPerPerson: 3, healthMult: 1.2 },
  meager:   { name: 'Meager',   lbsPerPerson: 2, healthMult: 1.0 },
  bareBones:{ name: 'Bare Bones', lbsPerPerson: 1, healthMult: 0.7 },
};
