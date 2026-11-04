import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function loadSceneNamespace() {
  const source = await readFile(new URL('./scene.js', import.meta.url), 'utf8');
  const browserContext = {};
  vm.runInNewContext(source, browserContext);
  return browserContext.HallOfLegendsScene;
}

test('the roster exposes four distinct legends in the intended order', async () => {
  const { characterRoster } = await loadSceneNamespace();

  assert.deepEqual(Array.from(characterRoster, (character) => character.id), [
    'zoro',
    'naruto',
    'luffy',
    'bell',
  ]);
  assert.equal(new Set(characterRoster.map((character) => character.name)).size, 4);
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

  assert.equal(scene.characterRoster.length, 4);
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
  assert.doesNotMatch(appSource, /Digit\(\[1-4\]\)/);
});

