const { characterRoster, getCharacterById, getFocusLabel } = globalThis.HallOfLegendsScene;

const sanctuary = document.querySelector('.sanctuary');
const stage = document.querySelector('[data-stage]');
const legends = document.querySelector('[data-legends]');
const focusCard = document.querySelector('[data-focus-card]');
const focusName = document.querySelector('[data-focus-name]');
const focusSeries = document.querySelector('[data-focus-series]');
const focusQuote = document.querySelector('[data-focus-quote]');
const focusAttribution = document.querySelector('[data-focus-attribution]');
const focusSource = document.querySelector('[data-focus-source]');
const focusClose = document.querySelector('[data-clear-focus]');
const status = document.querySelector('[data-status]');
const motionToggle = document.querySelector('[data-motion-toggle]');
const skipIntro = document.querySelector('[data-skip-intro]');

let selectedId = null;
let previousFocusedId = null;
let introTimer;
let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function renderRoster() {
  legends.innerHTML = characterRoster.map((character, index) => `
    <button
      class="legend legend--${character.id}"
      type="button"
      data-character-id="${character.id}"
      aria-label="${getFocusLabel(character)}"
      aria-pressed="false"
      style="--left:${character.left};--bottom:${character.bottom};--size:${character.size};--z:${character.zIndex};--aura:${character.color};"
    >
      <img class="legend__figure" src="${character.image}" alt="${character.name}, ${character.epithet}" draggable="false" />
      <span class="legend__label">${index + 1} · ${character.name}</span>
    </button>
  `).join('');

  document.querySelectorAll('[data-character-id]').forEach((button) => {
    button.addEventListener('click', () => selectCharacter(button.dataset.characterId));
    button.addEventListener('mouseenter', () => button.classList.add('is-active'));
    button.addEventListener('mouseleave', () => button.classList.remove('is-active'));
  });
}

function updateFocusCard(character) {
  if (!character) {
    focusCard.setAttribute('aria-hidden', 'true');
    focusCard.inert = true;
    focusClose.tabIndex = -1;
    focusSource.tabIndex = -1;
    return;
  }

  focusName.textContent = character.name;
  focusSeries.textContent = `${character.epithet}  ·  ${character.series}`;
  focusQuote.textContent = character.quote;
  focusAttribution.textContent = `— ${character.attribution}`;
  focusSource.href = character.sourceUrl;
  focusSource.textContent = character.sourceLabel;
  focusCard.setAttribute('aria-hidden', 'false');
  focusCard.inert = false;
  focusClose.tabIndex = 0;
  focusSource.tabIndex = 0;
}

function announce(message) {
  status.textContent = message;
}

function selectCharacter(id, { moveFocus = true } = {}) {
  const character = getCharacterById(id);
  if (!character) return;

  previousFocusedId = document.activeElement?.dataset?.characterId || selectedId || character.id;
  selectedId = character.id;
  sanctuary.classList.add('is-focused');
  sanctuary.dataset.selected = character.id;
  updateFocusCard(character);

  document.querySelectorAll('[data-character-id]').forEach((button) => {
    const active = button.dataset.characterId === selectedId;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  announce(`${character.name} is now in focus. ${character.quote}`);
  if (moveFocus) {
    window.setTimeout(() => focusClose.focus(), reducedMotion ? 0 : 520);
  }
}

function clearSelection({ restoreFocus = true } = {}) {
  selectedId = null;
  sanctuary.classList.remove('is-focused');
  delete sanctuary.dataset.selected;
  updateFocusCard(null);
  document.querySelectorAll('[data-character-id]').forEach((button) => {
    button.classList.remove('is-active');
    button.setAttribute('aria-pressed', 'false');
  });
  announce('The sanctuary overview is restored. Choose a legend.');

  if (restoreFocus && previousFocusedId) {
    const previousButton = legends.querySelector(`[data-character-id="${previousFocusedId}"]`);
    previousButton?.focus();
  }
}

function setReducedMotion(value) {
  reducedMotion = value;
  document.body.classList.toggle('reduced-motion', value);
  motionToggle.setAttribute('aria-pressed', String(value));
  motionToggle.setAttribute('aria-label', value ? 'Disable reduced motion' : 'Enable reduced motion');
  try { localStorage.setItem('hall-of-legends-reduced-motion', String(value)); } catch {}
}

function finishIntro() {
  window.clearTimeout(introTimer);
  document.body.classList.remove('is-entering');
  document.body.classList.add('is-ready');
  skipIntro.hidden = true;
}

function startIntro() {
  document.body.classList.add('is-entering');
  if (reducedMotion) {
    finishIntro();
    return;
  }
  introTimer = window.setTimeout(finishIntro, 2100);
}

function applyParallax(event) {
  if (reducedMotion || sanctuary.classList.contains('is-focused')) return;
  const x = (event.clientX / window.innerWidth - 0.5) * 12;
  const y = (event.clientY / window.innerHeight - 0.5) * 8;
  sanctuary.style.setProperty('--parallax-x', `${x.toFixed(2)}px`);
  sanctuary.style.setProperty('--parallax-y', `${y.toFixed(2)}px`);
}

function resetParallax() {
  sanctuary.style.setProperty('--parallax-x', '0px');
  sanctuary.style.setProperty('--parallax-y', '0px');
}

renderRoster();
updateFocusCard(null);

try {
  const stored = localStorage.getItem('hall-of-legends-reduced-motion');
  if (stored !== null) reducedMotion = stored === 'true';
} catch {}
setReducedMotion(reducedMotion);

skipIntro.addEventListener('click', finishIntro);
focusClose.addEventListener('click', () => clearSelection());
motionToggle.addEventListener('click', () => setReducedMotion(!reducedMotion));
stage.addEventListener('pointermove', applyParallax, { passive: true });
stage.addEventListener('pointerleave', resetParallax, { passive: true });

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && selectedId) {
    event.preventDefault();
    clearSelection();
  }
});

window.setTimeout(startIntro, 120);
