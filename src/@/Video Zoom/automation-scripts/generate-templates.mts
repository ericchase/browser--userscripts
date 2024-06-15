import node_fs from 'node:fs/promises';
import node_path from 'node:path';
import { ReadFile, WriteFile } from './lib/Node/Fs.mts';

for (const entry of await node_fs.readdir('./src', { recursive: true, withFileTypes: true })) {
  if (entry.name.startsWith('gen.') && entry.name.endsWith('.mjs')) {
    console.log(entry.parentPath);
    console.log(entry.name);
    const file = await ReadFile(`${entry.parentPath}\\${entry.name}`);
    const lines = file.split('\n');
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      if (line.startsWith('/*#FILE')) {
        const resource_path = node_path.resolve(entry.parentPath, line.slice('/*#FILE '.length, line.indexOf('*/')));
        const resource_text = await ReadFile(resource_path);
        lines[index] = line.slice(line.indexOf('*/ ') + '*/ '.length).replace('#FILE', resource_text);
      }
    }
    await WriteFile(`${entry.parentPath}\\${entry.name.slice('gen.'.length, entry.name.indexOf('.mjs'))}.ts`, lines.join('\n'));
  }
}
