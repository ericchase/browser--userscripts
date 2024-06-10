import node_fs from 'node:fs/promises';
import node_path from 'node:path';

/** @param {string} path */
export async function DeleteFile(path) {
  await node_fs.rm(path, { force: true });
}

/** @param {string} path */
export async function ReadFile(path) {
  return await node_fs.readFile(path, { encoding: 'utf8' });
}

/**
 * @param {string} path
 * @param {string} string
 */
export async function WriteFile(path, string) {
  await node_fs.writeFile(path, string, { encoding: 'utf8' });
}

/**
 * @param {string} path
 * @param {boolean} isFile
 */
export async function CreateDirectory(path, isFile = false) {
  if (isFile === true) {
    await node_fs.mkdir(node_path.dirname(path), { recursive: true });
  } else {
    await node_fs.mkdir(path, { recursive: true });
  }
}

/** @param {string} path */
export async function DeleteDirectory(path) {
  await node_fs.rm(path, { recursive: true, force: true });
}
