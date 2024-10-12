import node_child_process, { type ExecFileOptions } from 'node:child_process';
import type { ObjectEncodingOptions } from 'node:fs';
import type { STDIO } from '../Node/Process.mts';

export interface LSDParams {
  path?: string;
  filter?: string;
  options?: ObjectEncodingOptions & ExecFileOptions;
}
export function LSD({ path = '.', filter = '', options = {} }: LSDParams) {
  const program = 'lsd';
  const args = [path];
  if (filter) args.push(filter);
  return new Promise<STDIO>((resolve, reject) => {
    node_child_process.execFile(program, args, options, (error, stdout, stderr) => {
      if (error) return reject(error);
      return resolve({ stdout, stderr });
    });
  });
}

export enum PathKind {
  Directory = 1,
  File = 2,
}
export interface LSDResult {
  kind: PathKind;
  path: string;
}
export async function IterateLSD(command: Promise<STDIO>, filterkind: PathKind = PathKind.Directory | PathKind.File, callback?: (result: LSDResult) => void) {
  const { stdout = '', stderr } = await command;
  if (stderr) console.log('LSD Error:', stderr);
  const results = stdout
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => ({
      kind: line[0] === 'D' ? PathKind.Directory : PathKind.File,
      path: line.slice(2),
    }));
  if (callback) {
    for (const { kind, path } of results) {
      if (kind & filterkind) {
        callback({ kind, path });
      }
    }
  }
}
