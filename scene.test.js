import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function loadSceneNamespace() {
  const source = await readFile(new URL('./scene.js', import.meta.url), 'utf8');
  const browserContext = {};
  vm.runInNewContext(source, browserContext);
  return browserContext.HallOfLegendsScene;
}

test('the roster exposes nine distinct legends in the intended order', async () => {
  const { characterRoster } = await loadSceneNamespace();

  assert.deepEqual(Array.from(characterRoster, (character) => character.id), [
    'sung-jinwoo',
    'arthur-leywin',
    'zoro',
    'naruto',
    'might-guy',
    'luffy',
    'mereoleona',
    'rimuru-tempest',
    'bell',
  ]);
  assert.equal(new Set(characterRoster.map((character) => character.name)).size, 9);
});

test('every roster legend has a local transparent image asset', async () => {
  const { characterRoster } = await loadSceneNamespace();

  await Promise.all(
    characterRoster.map((character) => access(new URL(character.image, import.meta.url))),
  );
});

test('character lookup and focus labels support accessible scene controls', async () => {
  const { getCharacterById, getFocusLabel } = await loadSceneNamespace();

  const luffy = getCharacterById('luffy');

  assert.equal(luffy.name, 'Monkey D. Luffy');
  assert.equal(getCharacterById('missing'), undefined);
  assert.equal(getFocusLabel(luffy), 'Focus on Monkey D. Luffy, captain of the Straw Hat crew');
});

test('the scene data can load as a classic browser script for direct file URLs', async () => {
  const scene = await loadSceneNamespace();

  assert.equal(scene.characterRoster.length, 9);
  assert.equal(
    scene.getCharacterById('bell').name,
    'Bell Cranel',
  );
});

test('the experience keeps character selection in the tableau instead of numeric controls', async () => {
  const indexHtml = await readFile(new URL('./index.html', import.meta.url), 'utf8');
  const appSource = await readFile(new URL('./app.js', import.meta.url), 'utf8');

  assert.doesNotMatch(indexHtml, /data-legend-rail/);
  assert.doesNotMatch(indexHtml, /select by key/);
  assert.match(indexHtml, /data-pan-hint/);
  assert.doesNotMatch(indexHtml, /data-pan-left|data-pan-right/);
  assert.doesNotMatch(appSource, /Digit\(\[1-4\]\)/);
});

test('scene and app scripts initialize together as classic browser scripts', async () => {
  const sceneSource = await readFile(new URL('./scene.js', import.meta.url), 'utf8');
  const appSource = await readFile(new URL('./app.js', import.meta.url), 'utf8');
  const listeners = new Map();
  const sanctuaryListeners = new Map();
  const stageListeners = new Map();
  const frameCallbacks = new Map();
  let nextFrameId = 0;

  const requestAnimationFrame = (handler) => {
    const id = ++nextFrameId;
    frameCallbacks.set(id, handler);
    return id;
  };
  const cancelAnimationFrame = (id) => frameCallbacks.delete(id);
  const runNextFrame = (timestamp) => {
    const next = frameCallbacks.entries().next().value;
    if (!next) return false;
    const [id, handler] = next;
    frameCallbacks.delete(id);
    handler(timestamp);
    return true;
  };
  const readPan = () => Number.parseFloat(legends.style.values['--scene-pan-x']);
  const createControl = () => {
    const controlListeners = new Map();
    return {
      disabled: false,
      textContent: '',
      tabIndex: 0,
      setAttribute() {},
      addEventListener(type, handler) { controlListeners.set(type, handler); },
      click() { controlListeners.get('click')?.({ currentTarget: this }); },
    };
  };
  const legends = {
    html: '',
    style: { values: {}, setProperty(name, value) { this.values[name] = value; } },
    set innerHTML(value) { this.html = value; },
    querySelector() { return null; },
  };
  const sanctuary = {
    classList: { add() {}, remove() {}, contains() { return false; } },
    dataset: {},
    style: { setProperty() {} },
    addEventListener(type, handler) { sanctuaryListeners.set(type, handler); },
  };
  const stage = {
    clientWidth: 1000,
    addEventListener(type, handler) { stageListeners.set(type, handler); },
    getBoundingClientRect() { return { left: 0, right: 1000, top: 0, bottom: 700, width: 1000, height: 700 }; },
  };
  const elements = new Map([
    ['.sanctuary', sanctuary],
    ['[data-stage]', stage],
    ['[data-legends]', legends],
    ['[data-focus-card]', { setAttribute() {}, inert: true }],
    ['[data-focus-name]', {}],
    ['[data-focus-series]', {}],
    ['[data-focus-quote]', {}],
    ['[data-focus-attribution]', {}],
    ['[data-focus-source]', { tabIndex: -1 }],
    ['[data-clear-focus]', { tabIndex: -1, focus() {}, addEventListener() {} }],
    ['[data-status]', {}],
    ['[data-motion-toggle]', createControl()],
    ['[data-skip-intro]', { hidden: false, addEventListener() {} }],
    ['[data-zoom-in]', createControl()],
    ['[data-zoom-out]', createControl()],
    ['[data-reset-view]', createControl()],
    ['[data-zoom-level]', createControl()],
  ]);

  const browserContext = vm.createContext({
    document: {
      body: { classList: { add() {}, remove() {}, toggle() {} } },
      activeElement: null,
      querySelector(selector) { return elements.get(selector); },
      querySelectorAll() { return []; },
      addEventListener(type, handler) { listeners.set(type, handler); },
    },
    globalThis: {},
    localStorage: { getItem() { return null; }, setItem() {} },
    matchMedia() { return { matches: false }; },
    setTimeout() { return 1; },
    clearTimeout() {},
    requestAnimationFrame,
    cancelAnimationFrame,
    window: null,
  });
  browserContext.window = browserContext;

  vm.runInContext(sceneSource, browserContext);
  assert.doesNotThrow(() => vm.runInContext(appSource, browserContext));
  assert.match(elements.get('[data-legends]').html, /data-character-id="zoro"/);
  assert.match(elements.get('[data-legends]').html, /data-character-id="rimuru-tempest"/);
  assert.ok(listeners.has('keydown'));

  elements.get('[data-zoom-in]').click();
  assert.equal(legends.style.values['--scene-zoom'], '1.2');
  assert.equal(elements.get('[data-zoom-level]').textContent, '120%');

  elements.get('[data-reset-view]').click();
  assert.equal(legends.style.values['--scene-zoom'], '1');
  assert.equal(legends.style.values['--scene-pan-x'], '0px');

  elements.get('[data-zoom-in]').click();
  const moveSanctuary = sanctuaryListeners.get('pointermove');
  const movePointer = (clientX, pointerType = 'mouse', target = stage) => moveSanctuary({
    clientX,
    clientY: 350,
    pointerId: 1,
    pointerType,
    target,
    preventDefault() {},
  });

  const headerTarget = {
    closest(selector) {
      return selector === 'button, a, [data-focus-card]' ? this : null;
    },
  };

  movePointer(40, 'mouse', headerTarget);
  assert.equal(frameCallbacks.size, 1);
  assert.equal(runNextFrame(16), true);
  const firstLeftPan = readPan();
  assert.ok(firstLeftPan > 0);
  assert.equal(runNextFrame(32), true);
  assert.ok(readPan() > firstLeftPan);

  movePointer(500);
  assert.equal(frameCallbacks.size, 0);
  const stoppedPan = readPan();
  assert.equal(runNextFrame(48), false);
  assert.equal(readPan(), stoppedPan);

  elements.get('[data-reset-view]').click();
  elements.get('[data-zoom-in]').click();
  movePointer(960);
  assert.equal(runNextFrame(16), true);
  assert.ok(readPan() < 0);

  for (let frame = 0; frame < 100; frame += 1) runNextFrame(32 + frame * 16);
  assert.ok(readPan() <= 1000 * 0.2 * 0.46);

  elements.get('[data-reset-view]').click();
  elements.get('[data-zoom-in]').click();
  movePointer(40, 'touch');
  assert.equal(frameCallbacks.size, 0);
});

