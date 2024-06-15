import node_fs from 'node:fs/promises';
import node_path from 'node:path';

export async function DeleteFile(path: string) {
  await node_fs.rm(path, { force: true });
}

export async function ReadFile(path: string, ignore_error = false) {
  try {
    return await node_fs.readFile(path, { encoding: 'utf8' });
  } catch (err) {
    if (ignore_error) {
      return '';
    }
    throw err;
  }
}

export async function WriteFile(path: string, string: string) {
  await node_fs.writeFile(path, string, { encoding: 'utf8' });
}

export async function CreateDirectory(path: string, isFile = false) {
  if (isFile === true) {
    await node_fs.mkdir(node_path.dirname(path), { recursive: true });
  } else {
    await node_fs.mkdir(path, { recursive: true });
  }
}

export async function DeleteDirectory(path: string) {
  await node_fs.rm(path, { recursive: true, force: true });
}
