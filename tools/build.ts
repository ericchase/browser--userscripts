import { FilterDirectoryListing } from '../src/lib/external/Platform/Cxx/LSD.js';
import { Run } from '../src/lib/external/Platform/Node/Process.js';
import { ProcessTemplateFile, RegisterIncludeSource } from '../src/lib/external/Platform/Web/Template Processor.js';

const src = {
  dir: './src',
  ext: '.user.ts',
};
const dest = {
  dir: './src',
  ext: '.user.js',
};

// Bundle Source
{
  const { files } = await FilterDirectoryListing({
    path: src.dir,
    include: ['*' + src.ext],
  });
  for (const name of files) {
    const path = src.dir + '/' + name;
    const out_path = src.dir + '/' + name.slice(0, name.lastIndexOf(src.ext)) + dest.ext;
    const source = await Bun.file(path).text();
    const header = extractHeaderComment(source);

    const { outputs, success } = await Bun.build({
      entrypoints: [path],
      target: 'browser',
    });
    if (success) {
      Bun.write(out_path, new Blob([header, '\n', outputs[0]], { type: outputs[0].type }));
    }
  }
}

function extractHeaderComment(code: string) {
  const HEADER_START = 'const header = `';
  const HEADER_END = '`;';
  const beg = code.indexOf(HEADER_START);
  const end = code.indexOf(HEADER_END);
  return code.slice(beg + HEADER_START.length, end);
}

// Build Links
{
  const { files } = await FilterDirectoryListing({
    path: dest.dir,
    include: ['*' + dest.ext],
  });
  const links: string[] = [];
  for (const name of files) {
    links.push(`<a href="${dest.dir}/${name}" target="_blank">${name}</a>`);
  }
  RegisterIncludeSource('links', links.join('\n'));
  await ProcessTemplateFile('./index.template.html', './index.html');
}

await Run({ program: 'bun', args: ['run', 'format'] });
