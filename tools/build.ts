import { IterateLSD, LSD, PathKind } from '../src/lib/external/Platform/Cxx/LSD.js';
import { Run } from '../src/lib/external/Platform/Node/Process.js';
import { ProcessTemplateFile, RegisterIncludeSource } from '../src/lib/external/Platform/Web/Template Processor.js';

const links: string[] = [];
await IterateLSD(LSD({ path: './src', filter: '*.user.js' }), PathKind.File, ({ path }) => {
  links.push(`<a href="./src/${path}" target="_blank">${path}</a>`);
});

RegisterIncludeSource('links', links.join('\n'));
await ProcessTemplateFile('./index.template.html', './index.html');
await Run({ program: 'bun', args: ['run', 'format'] });
