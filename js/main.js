// Screen manager & top-level game flow wiring.

const Screens = {
  show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  },
};

function initTitleScreen() {
  document.getElementById('btn-start').addEventListener('click', startNewGame);
  document.getElementById('btn-scores').addEventListener('click', () => {
    Score.renderTable(document.getElementById('scores-table'));
    Screens.show('screen-scores');
  });
  document.getElementById('btn-scores-back').addEventListener('click', () => Screens.show('screen-title'));
}

function startNewGame() {
  Game.reset();
  renderProfessionScreen();
  Screens.show('screen-profession');
}

function renderProfessionScreen() {
  const div = document.getElementById('profession-choices');
  div.innerHTML = '';
  Object.keys(PROFESSIONS).forEach(key => {
    const p = PROFESSIONS[key];
    const b = document.createElement('button');
    b.textContent = `${p.name} — start with $${p.money}`;
    b.onclick = () => {
      Game.profession = key;
      Game.money = p.money;
      Screens.show('screen-names');
    };
    div.appendChild(b);
  });
}

function initNamesScreen() {
  document.getElementById('form-names').addEventListener('submit', (e) => {
    e.preventDefault();
    Game.party = [];
    for (let i = 0; i < 5; i++) {
      const val = document.getElementById(`name-${i}`).value.trim() || `Traveler ${i+1}`;
      Game.party.push({ name: val, health: 'good', alive: true, _healthScore: 3 });
    }
    renderMonthScreen();
    Screens.show('screen-month');
  });
}

function renderMonthScreen() {
  const div = document.getElementById('month-choices');
  div.innerHTML = '';
  MONTHS.forEach((m, idx) => {
    const b = document.createElement('button');
    let note = '';
    if (idx <= 1) note = ' (risk of high, cold rivers)';
    if (idx >= 5) note = ' (risk of early mountain snow)';
    b.textContent = `${m}${note}`;
    b.onclick = () => {
      Game.startMonth = idx;
      Game.date = { month: idx, day: 1, year: 1848 };
      Screens.show('screen-store');
      Store.render(document.getElementById('screen-store'), {
        initial: true,
        onDone: () => beginTrail(),
      });
    };
    div.appendChild(b);
  });
}

function beginTrail() {
  Game.cash = Game.money;
  Game.mileage = 0;
  Game.landmarkIndex = 0;
  Screens.show('screen-travel');
  Travel.refreshHud();
}

// ---- Landmark arrival handling ----
function handleLandmarkArrival(landmark) {
  Screens.show('screen-landmark');
  const title = document.getElementById('landmark-title');
  const body = document.getElementById('landmark-body');
  title.textContent = landmark.name;

  if (landmark.type === 'river') {
    Screens.show('screen-river');
    River.start(document.getElementById('screen-river'), landmark, () => {
      Game.landmarkIndex++;
      Screens.show('screen-travel');
      Travel.refreshHud();
    });
    return;
  }

  if (landmark.type === 'cutoff') {
    body.innerHTML = `<p>The trail splits here. You can continue to <strong>${landmark.mainName}</strong> (${landmark.mainDist - Game.mileage} mi, a fort with supplies), or take the <strong>${landmark.cutoffName}</strong>, a shorter but rougher route that bypasses ${landmark.cutoffSkip} (${landmark.cutoffDist - Game.mileage} mi).</p>`;
    const btn1 = document.createElement('button');
    btn1.textContent = `Continue to ${landmark.mainName}`;
    btn1.onclick = () => {
      LANDMARKS[Game.landmarkIndex] = { name: landmark.mainName, dist: landmark.mainDist, type: 'fort' };
      Screens.show('screen-travel');
      Travel.refreshHud();
    };
    const btn2 = document.createElement('button');
    btn2.textContent = `Take the ${landmark.cutoffName}`;
    btn2.onclick = () => {
      Game.tookSublette = true;
      Game.log(`You took the ${landmark.cutoffName}, bypassing ${landmark.cutoffSkip}.`);
      LANDMARKS[Game.landmarkIndex] = { name: landmark.cutoffName, dist: landmark.cutoffDist, type: 'landmark' };
      Screens.show('screen-travel');
      Travel.refreshHud();
    };
    body.appendChild(btn1);
    body.appendChild(btn2);
    return;
  }

  if (landmark.type === 'end') {
    body.innerHTML = `<p>You've reached The Dalles. From here you can take the <strong>${landmark.tollName}</strong> ($${landmark.tollCost}, safer) or brave the <strong>${landmark.raftName}</strong> by raft (free, but risky).</p>`;
    const btn1 = document.createElement('button');
    btn1.textContent = `Take the ${landmark.tollName} ($${landmark.tollCost})`;
    btn1.onclick = () => {
      if (Game.cash < landmark.tollCost) {
        Game.log("You can't afford the toll road — you'll have to raft.");
        startRaft(landmark);
        return;
      }
      Game.cash -= landmark.tollCost;
      Game.finalRoute = 'toll';
      Game.mileage = TOTAL_TRAIL;
      Game.landmarkIndex = LANDMARKS.length;
      finishGame('arrived');
    };
    const btn2 = document.createElement('button');
    btn2.textContent = `Raft the ${landmark.raftName}`;
    btn2.onclick = () => startRaft(landmark);
    body.appendChild(btn1);
    body.appendChild(btn2);
    return;
  }

  // Plain landmark or fort
  if (landmark.type === 'fort') {
    body.innerHTML = `<p>You've arrived at ${landmark.name}. You may resupply here (prices are higher than in Independence).</p>`;
    const btnStore = document.createElement('button');
    btnStore.textContent = 'Visit the store';
    btnStore.onclick = () => {
      Screens.show('screen-store');
      Store.render(document.getElementById('screen-store'), {
        initial: false,
        onDone: () => {
          Game.landmarkIndex++;
          Screens.show('screen-travel');
          Travel.refreshHud();
        },
      });
    };
    const btnSkip = document.createElement('button');
    btnSkip.textContent = 'Continue without stopping';
    btnSkip.onclick = () => {
      Game.landmarkIndex++;
      Screens.show('screen-travel');
      Travel.refreshHud();
    };
    body.appendChild(btnStore);
    body.appendChild(btnSkip);
  } else {
    body.innerHTML = `<p>You've reached ${landmark.name}. Fellow travelers share news of the trail ahead.</p>`;
    const btn = document.createElement('button');
    btn.textContent = 'Continue';
    btn.onclick = () => {
      Game.landmarkIndex++;
      Screens.show('screen-travel');
      Travel.refreshHud();
    };
    body.appendChild(btn);
  }
}

function startRaft(landmark) {
  Screens.show('screen-raft');
  Raft.start(document, (success) => {
    Game.finalRoute = 'raft';
    Game.mileage = TOTAL_TRAIL;
    Game.landmarkIndex = LANDMARKS.length;
    finishGame('arrived');
  });
}

// ---- Game over handling ----
function handleGameOver(kind, data) {
  if (kind === 'showGrave') {
    Screens.show('screen-grave');
    Grave.showExisting(document, data, () => {
      Screens.show('screen-travel');
      Travel.refreshHud();
    });
    return;
  }
  if (kind === 'memberDied') {
    Screens.show('screen-grave');
    Grave.show(document, data.name, `Died of illness on the trail near mile ${Math.floor(Game.mileage)}.`, Game.mileage, () => {
      if (Game.alivePartyCount() === 0) {
        finishGame('allDead');
      } else {
        Screens.show('screen-travel');
        Travel.refreshHud();
      }
    });
    return;
  }
  if (kind === 'allDead') {
    const lastLeader = Game.party[0];
    Screens.show('screen-grave');
    Grave.show(document, lastLeader.name, `The party perished on the trail near mile ${Math.floor(Game.mileage)}.`, Game.mileage, () => {
      finishGame('allDead');
    });
    return;
  }
  if (kind === 'arrived') {
    finishGame('arrived');
  }
}

function finishGame(kind) {
  Screens.show('screen-end');
  const titleEl = document.getElementById('end-title');
  const summaryEl = document.getElementById('end-summary');
  const scoreEl = document.getElementById('end-score');
  const tableEl = document.getElementById('end-scoretable');

  const endedWell = kind === 'arrived';
  const score = Score.compute(Game, endedWell);

  if (endedWell) {
    titleEl.textContent = 'You made it to the Willamette Valley!';
    summaryEl.textContent = `Arrived ${Game.dateString()} via ${Game.finalRoute === 'toll' ? 'the Barlow Toll Road' : 'the Columbia River'} with ${Game.alivePartyCount()} of ${Game.totalPeople()} party members surviving.`;
  } else {
    titleEl.textContent = 'Your party has perished on the trail.';
    summaryEl.textContent = `The journey ended at mile ${Math.floor(Game.mileage)}, ${Game.dateString()}.`;
  }
  scoreEl.textContent = score;

  if (endedWell) {
    const name = Game.party[0] ? Game.party[0].name : 'Traveler';
    Score.add(name, PROFESSIONS[Game.profession].name, score);
  }
  Score.renderTable(tableEl, score);

  document.getElementById('btn-end-restart').onclick = () => {
    Screens.show('screen-title');
  };
}

// ---- Boot ----
document.addEventListener('DOMContentLoaded', () => {
  initTitleScreen();
  initNamesScreen();
  Travel.init(document.getElementById('screen-travel'), {
    onArriveLandmark: handleLandmarkArrival,
    onGameOver: handleGameOver,
  });
});
