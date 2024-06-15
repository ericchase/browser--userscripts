import { ReadFile, WriteFile } from './lib/Node/Fs.mts';
import { Run } from './lib/Node/Process.mts';
import { GetSemanticVersion } from './lib/Web/Browser/Addon.mts';

await Run({ program: 'bun', args: ['run', 'vite', 'build'] });

const version = await GetSemanticVersion();
const header = (await ReadFile('./src/header.txt')).trim();
const notice = (await ReadFile('./NOTICE')).trim();
const third_party_notice = (await ReadFile('./LICENSE-THIRD-PARTY')).trim();
const script = (await ReadFile('./dist/index.mjs')).trim();

const userscript = `
${comment(header.replace('${version}', version))}

${comment(notice)}

${comment(third_party_notice)}

${script}
`.trim();

const { displayName } = await JSON.parse(await ReadFile('./package.json'));
await WriteFile(`./${displayName}.user.js`, userscript);

await Run({ program: 'bun', args: ['run', 'format'] });

function comment(s: string) {
  return s
    .split('\n')
    .map((line) => '// ' + line)
    .join('\n');
}
