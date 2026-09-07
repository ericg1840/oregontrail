// Matt's General Store screen logic.

const Store = {
  cart: { oxen: 0, food: 0, clothing: 0, ammo: 0, parts_wheel: 0, parts_axle: 0, parts_tongue: 0 },

  priceMult() {
    // Prices creep up the further along the trail (used for resupply at forts too).
    return 1 + (Game.mileage / TOTAL_TRAIL) * 0.8;
  },

  unitPrice(key) {
    return +(PRICES[key] * this.priceMult()).toFixed(2);
  },

  spent() {
    let total = 0;
    for (const key in this.cart) total += this.cart[key] * this.unitPrice(key);
    return total;
  },

  render(root, opts) {
    opts = opts || {};
    const isInitial = !!opts.initial;
    this.cart = { oxen: 0, food: 0, clothing: 0, ammo: 0, parts_wheel: 0, parts_axle: 0, parts_tongue: 0 };
    const cash = isInitial ? Game.money : Game.cash;

    const items = [
      { key: 'oxen', label: 'Oxen (per animal, need 4-8)', unit: 'animal' },
      { key: 'food', label: 'Food', unit: 'lb' },
      { key: 'clothing', label: 'Clothing sets', unit: 'set' },
      { key: 'ammo', label: 'Ammunition', unit: 'box of 20' },
      { key: 'parts_wheel', label: 'Spare wagon wheels', unit: 'wheel' },
      { key: 'parts_axle', label: 'Spare wagon axles', unit: 'axle' },
      { key: 'parts_tongue', label: 'Spare wagon tongues', unit: 'tongue' },
    ];

    const itemsDiv = root.querySelector('#store-items');
    itemsDiv.innerHTML = '';
    items.forEach(it => {
      const row = document.createElement('div');
      row.className = 'store-item-row';
      row.innerHTML = `
        <span>${it.label} &mdash; $${this.unitPrice(it.key)}/${it.unit}</span>
        <input type="number" min="0" value="0" data-key="${it.key}">
      `;
      itemsDiv.appendChild(row);
    });

    const cashSpan = root.querySelector('#store-cash');
    const cartList = root.querySelector('#store-cart');
    const doneBtn = root.querySelector('#btn-store-done');

    const refresh = () => {
      const remaining = cash - this.spent();
      cashSpan.textContent = remaining.toFixed(2);
      cartList.innerHTML = Object.keys(this.cart)
        .filter(k => this.cart[k] > 0)
        .map(k => `<li>${this.cart[k]} x ${k}</li>`)
        .join('') || '<li>(nothing yet)</li>';
      doneBtn.disabled = remaining < 0;
    };

    itemsDiv.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', () => {
        const v = Math.max(0, parseInt(inp.value, 10) || 0);
        this.cart[inp.dataset.key] = v;
        refresh();
      });
    });

    refresh();

    doneBtn.onclick = () => {
      if (this.spent() > cash) return;
      if (isInitial) {
        Game.money -= this.spent();
        Game.cash = Game.money;
      } else {
        Game.cash -= this.spent();
      }
      Game.oxen += this.cart.oxen;
      Game.food += this.cart.food;
      Game.clothing += this.cart.clothing;
      Game.ammo += this.cart.ammo * 20;
      Game.parts.wheel += this.cart.parts_wheel;
      Game.parts.axle += this.cart.parts_axle;
      Game.parts.tongue += this.cart.parts_tongue;
      if (opts.onDone) opts.onDone();
    };
  },
};
