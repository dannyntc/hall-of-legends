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
const zoomOut = document.querySelector('[data-zoom-out]');
const zoomLevel = document.querySelector('[data-zoom-level]');
const zoomIn = document.querySelector('[data-zoom-in]');
const resetView = document.querySelector('[data-reset-view]');

let selectedId = null;
let previousFocusedId = null;
let introTimer;
let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let sceneZoom = 1;
let scenePanX = 0;
let panGesture = null;
let suppressedCharacterClick = null;

const MIN_SCENE_ZOOM = 1;
const MAX_SCENE_ZOOM = 2.4;
const SCENE_ZOOM_STEP = 0.2;
const SCENE_PAN_STEP = 160;
const BASE_SCENE_PAN = 0.08;
const ZOOM_SCENE_PAN = 0.46;
const PAN_DRAG_THRESHOLD = 6;

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
    button.addEventListener('click', () => {
      if (suppressedCharacterClick === button) {
        suppressedCharacterClick = null;
        return;
      }
      selectCharacter(button.dataset.characterId);
    });
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

function getMaxScenePan() {
  const stageWidth = stage.clientWidth || window.innerWidth;
  return stageWidth * (BASE_SCENE_PAN + (sceneZoom - 1) * ZOOM_SCENE_PAN);
}

function clampScenePan(value) {
  const limit = getMaxScenePan();
  return Math.min(limit, Math.max(-limit, value));
}

function applySceneView() {
  scenePanX = clampScenePan(scenePanX);
  legends.style.setProperty('--scene-zoom', String(sceneZoom));
  legends.style.setProperty('--scene-pan-x', `${Math.round(scenePanX)}px`);
  zoomLevel.textContent = `${Math.round(sceneZoom * 100)}%`;
  zoomLevel.setAttribute('aria-valuemin', String(MIN_SCENE_ZOOM * 100));
  zoomLevel.setAttribute('aria-valuemax', String(MAX_SCENE_ZOOM * 100));
  zoomLevel.setAttribute('aria-valuenow', String(Math.round(sceneZoom * 100)));
  zoomIn.disabled = sceneZoom >= MAX_SCENE_ZOOM;
  zoomOut.disabled = sceneZoom <= MIN_SCENE_ZOOM;
  resetView.disabled = sceneZoom === MIN_SCENE_ZOOM && scenePanX === 0;
}

function setSceneZoom(nextZoom) {
  sceneZoom = Math.min(MAX_SCENE_ZOOM, Math.max(MIN_SCENE_ZOOM, nextZoom));
  if (sceneZoom === MIN_SCENE_ZOOM) scenePanX = 0;
  applySceneView();
}

function setScenePan(nextPan) {
  scenePanX = clampScenePan(nextPan);
  applySceneView();
}

function resetSceneView() {
  cancelPan();
  sceneZoom = MIN_SCENE_ZOOM;
  scenePanX = 0;
  applySceneView();
  resetParallax();
}

function bringCharacterIntoView(button) {
  if (!button || sceneZoom === MIN_SCENE_ZOOM || typeof button.getBoundingClientRect !== 'function') return;

  const stageRect = stage.getBoundingClientRect();
  const characterRect = button.getBoundingClientRect();
  const margin = Math.min(72, stageRect.width * 0.08);

  if (characterRect.left < stageRect.left + margin) {
    scenePanX += stageRect.left + margin - characterRect.left;
  } else if (characterRect.right > stageRect.right - margin) {
    scenePanX -= characterRect.right - (stageRect.right - margin);
  }
  applySceneView();
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

  bringCharacterIntoView(document.querySelector(`[data-character-id="${selectedId}"]`));
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
  if (value) cancelPan();
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

function isStageInteractiveTarget(target) {
  return Boolean(
    target?.closest?.('button, a, [data-focus-card]')
    && !target?.closest?.('.legend'),
  );
}

function beginPan(event) {
  if (
    (event.pointerType && event.pointerType !== 'mouse')
    || (event.button !== undefined && event.button !== 0)
    || isStageInteractiveTarget(event.target)
  ) return;

  panGesture = {
    pointerId: event.pointerId,
    startX: event.clientX,
    originX: scenePanX,
    characterButton: event.target?.closest?.('[data-character-id]') || null,
    moved: false,
  };
  sanctuary.classList.add('is-panning');
  sanctuary.setPointerCapture?.(event.pointerId);
}

function movePanOrApplyParallax(event) {
  if (!panGesture) {
    applyParallax(event);
    return;
  }

  const delta = event.clientX - panGesture.startX;
  if (Math.abs(delta) > PAN_DRAG_THRESHOLD) {
    panGesture.moved = true;
    suppressedCharacterClick = panGesture.characterButton;
    event.preventDefault?.();
    setScenePan(panGesture.originX + delta);
  }
}

function endPan(event) {
  if (!panGesture) return;
  if (sanctuary.hasPointerCapture?.(event.pointerId)) sanctuary.releasePointerCapture(event.pointerId);
  panGesture = null;
  sanctuary.classList.remove('is-panning');
}

function cancelPan() {
  if (!panGesture) return;
  panGesture = null;
  sanctuary.classList.remove('is-panning');
}

renderRoster();
updateFocusCard(null);
applySceneView();

try {
  const stored = localStorage.getItem('hall-of-legends-reduced-motion');
  if (stored !== null) reducedMotion = stored === 'true';
} catch {}
setReducedMotion(reducedMotion);

skipIntro.addEventListener('click', finishIntro);
focusClose.addEventListener('click', () => clearSelection());
motionToggle.addEventListener('click', () => setReducedMotion(!reducedMotion));
zoomOut.addEventListener('click', () => setSceneZoom(sceneZoom - SCENE_ZOOM_STEP));
zoomIn.addEventListener('click', () => setSceneZoom(sceneZoom + SCENE_ZOOM_STEP));
resetView.addEventListener('click', resetSceneView);
sanctuary.addEventListener('pointerdown', beginPan);
sanctuary.addEventListener('pointermove', movePanOrApplyParallax, { passive: false });
sanctuary.addEventListener('pointerup', endPan);
sanctuary.addEventListener('pointercancel', endPan);
sanctuary.addEventListener('lostpointercapture', cancelPan);
sanctuary.addEventListener('pointerleave', () => {
  if (!panGesture) resetParallax();
});
window.addEventListener?.('resize', applySceneView);
window.addEventListener?.('blur', cancelPan);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && selectedId) {
    event.preventDefault();
    clearSelection();
    return;
  }
  if (event.key === '+' || event.key === '=') {
    event.preventDefault();
    setSceneZoom(sceneZoom + SCENE_ZOOM_STEP);
  } else if (event.key === '-' || event.key === '_') {
    event.preventDefault();
    setSceneZoom(sceneZoom - SCENE_ZOOM_STEP);
  } else if (event.key === '0') {
    event.preventDefault();
    resetSceneView();
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    setScenePan(scenePanX + SCENE_PAN_STEP);
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    setScenePan(scenePanX - SCENE_PAN_STEP);
  }
});

window.setTimeout(startIntro, 120);
