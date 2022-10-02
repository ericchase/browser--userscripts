import { type WalkEntry, walkSync } from 'https://deno.land/std/fs/mod.ts';

const TargetFileExtensions = ['user.js'];

const aTagList: string[] = [];
const walkEntryList: WalkEntry[] =
    walkSync('.', {
        exts: TargetFileExtensions,
        includeDirs: false,
        maxDepth: 1
    });
for (const entry of walkEntryList) {
    aTagList.push(`<a href="${entry.path}" target="_blank">${entry.path}</a>`);
}

const original: string = await Deno.readTextFile('index.html');
const beggining: number = original.indexOf('<body>') + '<body>'.length;
const end: number = original.indexOf('</body>');
const modified: string =
    original.slice(0, beggining) +
    aTagList.join('') +
    original.slice(end);

console.log(modified);
Deno.writeTextFile('index.html', modified);
