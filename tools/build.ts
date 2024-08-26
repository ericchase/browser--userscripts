import { ProcessTemplateFile, RegisterIncludeSource } from '../src/@/Video Zoom/automation-scripts/lib/Web/Template Processor.mjs';
import { GlobManager } from '../src/lib/ericchase/Platform/Bun/Path.js';
import { Run } from '../src/lib/ericchase/Platform/Node/Process.js';

function extractHeaderComment(source: string) {
  const HEADER_START = 'const header = `';
  const HEADER_END = '`;';
  const beg = source.indexOf(HEADER_START);
  if (beg === -1) return '';
  const end = source.indexOf(HEADER_END, beg);
  if (end === -1) return '';
  return source.slice(beg + HEADER_START.length, end) + '\n';
}

await Run({ program: 'bun', args: ['run', 'format'] });

const gm = new GlobManager();

const source_group = gm.scan('./src', '*.user.ts');
for (const pathGroup of source_group.pathGroups) {
  const source = await Bun.file(pathGroup.path).text();
  const header = extractHeaderComment(source);
  const { outputs, success } = await Bun.build({
    entrypoints: [pathGroup.path],
    target: 'browser',
  });
  if (success) {
    Bun.write(pathGroup.replaceBasedir('./release').replaceExt('.js').path, new Blob([header, outputs[0]], { type: outputs[0].type }));
  }
}

// Build Links
const bundle_group = gm.scan('./release', '*.user.js');
{
  const links: string[] = [];
  for (const { basedir, dir, name, ext } of bundle_group.pathGroups) {
    links.push(`<a href="${'./' + basedir + dir + '/' + name + ext}" target="_blank">${name + ext}</a>`);
  }
  RegisterIncludeSource('links', links.join('\n'));
  await ProcessTemplateFile('./index.template.html', './index.html');
}

await Run({ program: 'bun', args: ['run', 'format'] });
