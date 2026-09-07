// Gravestone screen shown on death, and revisited-grave display while travelling.

const Grave = {
  show(root, victimName, cause, mileage, onContinue) {
    root.querySelector('#grave-name').textContent = victimName;
    root.querySelector('#grave-year').textContent = String(Game.date.year);
    root.querySelector('#grave-cause').textContent = cause;

    const inputWrap = root.querySelector('#grave-input-wrap');
    const continueBtn = root.querySelector('#btn-grave-continue');
    const epitaphInput = root.querySelector('#grave-epitaph');
    epitaphInput.value = '';
    inputWrap.style.display = '';
    continueBtn.style.display = 'none';

    root.querySelector('#btn-grave-save').onclick = () => {
      Score.saveGrave(victimName, cause, epitaphInput.value || '(no epitaph)', mileage);
      inputWrap.style.display = 'none';
      continueBtn.style.display = '';
    };
    continueBtn.onclick = onContinue;
  },

  showExisting(root, grave, onContinue) {
    root.querySelector('#grave-name').textContent = grave.name;
    root.querySelector('#grave-year').textContent = '';
    root.querySelector('#grave-cause').textContent = `${grave.cause} — "${grave.epitaph}"`;
    root.querySelector('#grave-input-wrap').style.display = 'none';
    const continueBtn = root.querySelector('#btn-grave-continue');
    continueBtn.style.display = '';
    continueBtn.onclick = onContinue;
  },
};
