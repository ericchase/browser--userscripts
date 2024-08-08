import type { BunFile } from 'bun';

export function OpenFile(
  path: string, //
) {
  return Bun.file(path);
}

export async function ReadFile(
  file: BunFile, //
) {
  return await file.text();
}

export async function WriteFile(
  path: string,
  text: string, //
) {
  await Bun.write(path, text);
}

export async function CopyFile(
  path_src: string,
  path_dest: string,
  verify = true, //
) {
  if (path_src === path_dest) {
    return false;
  }
  const src = OpenFile(path_src);
  await Bun.write(path_dest, src);
  const dest = OpenFile(path_dest);
  if (verify === true) {
    return (await src.text()) === (await dest.text());
  }
  return true;
}
