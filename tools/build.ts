import { FilterDirectoryListing } from '../src/lib/external/Platform/Cxx/LSD.js';
import { Run } from '../src/lib/external/Platform/Node/Process.js';
import { ProcessTemplateFile, RegisterIncludeSource } from '../src/lib/external/Platform/Web/Template Processor.js';

const I = {
  dir: './src',
  ext: '.user.ts',
};
const O = {
  dir: './release',
  ext: '.user.js',
};

// Bundle Source
{
  const HEADER_START = 'const header = `';
  const HEADER_END = '`;';
  function extractHeaderComment(source: string) {
    const beg = source.indexOf(HEADER_START);
    if (beg === -1) return '';
    const end = source.indexOf(HEADER_END, beg);
    if (end === -1) return '';
    return source.slice(beg + HEADER_START.length, end) + '\n';
  }

  const { files } = await FilterDirectoryListing({
    path: I.dir,
    include: ['*' + I.ext],
  });
  for (const name of files) {
    const input_path = I.dir + '/' + name;
    const output_path = O.dir + '/' + name.slice(0, name.lastIndexOf(I.ext)) + O.ext;
    const source = await Bun.file(input_path).text();
    const header = extractHeaderComment(source);
    // console.log(header);

    const { outputs, success } = await Bun.build({
      entrypoints: [input_path],
      target: 'browser',
    });
    if (success) {
      Bun.write(output_path, new Blob([header, outputs[0]], { type: outputs[0].type }));
    }
  }
}

// Build Links
{
  const { files } = await FilterDirectoryListing({
    path: O.dir,
    include: ['*' + O.ext],
  });
  const links: string[] = [];
  for (const name of files) {
    links.push(`<a href="${O.dir}/${name}" target="_blank">${name}</a>`);
  }
  RegisterIncludeSource('links', links.join('\n'));
  await ProcessTemplateFile('./index.template.html', './index.html');
}

await Run({ program: 'bun', args: ['run', 'format'] });
