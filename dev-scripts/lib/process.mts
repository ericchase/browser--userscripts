import node_child_process, { type ExecFileOptions } from 'node:child_process';
import type { ObjectEncodingOptions } from 'node:fs';

export function Run(program: string, args: string[], options: ObjectEncodingOptions & ExecFileOptions = {}) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    console.log(`[${new Date().toLocaleTimeString()}] > ${program} ${args.join(' ')}`);
    node_child_process.execFile(program, args, options, (error, stdout, stderr) => {
      if (error) return reject(error);
      return resolve({ stdout, stderr });
    });
  });
}

export function PipeStdio({ stdout = '', stderr = '' }) {
  if (stdout) console.log(stdout.slice(0, stdout.lastIndexOf('\n')));
  if (stderr) console.log(stderr.slice(0, stderr.lastIndexOf('\n')));
}
