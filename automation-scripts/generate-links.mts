import { IterateLSD, LSD, PathKind } from './lib/Cxx/LSD.mts';
import { Run } from './lib/Node/Process.mts';
import { ProcessTemplateFile, RegisterIncludeSource } from './lib/Web/Template Processor.mts';

const links: string[] = [];
await IterateLSD(LSD({ path: './src', filter: '*.user.js' }), PathKind.File, ({ path }) => {
  links.push(`<a href="./src/${path}" target="_blank">${path}</a>`);
});

RegisterIncludeSource('links', links.join('\n'));
await ProcessTemplateFile('./index.template.html', './index.html');
await Run({ program: 'bun', args: ['run', 'format'] });
