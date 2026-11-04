import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });

for (const file of ['index.html', 'styles.css', 'app.js', 'scene.js']) {
  let content = await readFile(file, 'utf8');
  content = content.replaceAll('public/assets/', 'assets/');
  await writeFile(`dist/${file}`, content);
}

await cp('public/assets', 'dist/assets', { recursive: true });
console.log('Built Hall of Legends to dist/');
