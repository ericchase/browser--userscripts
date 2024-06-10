import node_child_process from 'node:child_process';

/**
 * @param {string} program
 * @param {string[]} args
 * @param {import('node:fs').ObjectEncodingOptions & import('node:child_process').ExecFileOptions} options
 * @returns {Promise<{stdout:string,stderr:string}>}
 */
export function Run(program, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log('>', program, args.join(' '));
    node_child_process.execFile(program, args, (error, stdout, stderr) => {
      if (error) return reject(error);
      return resolve({ stdout, stderr });
    });
  });
}

/**
 * @param {object} params
 * @param {string=} params.stdout
 * @param {string=} params.stderr
 */
export function StdPipe({ stdout = '', stderr = '' }) {
  if (stdout) console.log(stdout.slice(0, stdout.lastIndexOf('\n')));
  if (stderr) console.log(stderr.slice(0, stderr.lastIndexOf('\n')));
}
