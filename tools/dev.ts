import { Debounce } from '../src/lib/external/Algorithm/Debounce.js';
import { Watch } from '../src/lib/external/Platform/Cxx/Watch.js';
import { PipeStdio, Run } from '../src/lib/external/Platform/Node/Process.js';

const build = Debounce(async () => {
  await PipeStdio(Run({ program: 'bun', args: ['run', 'build'] }));
}, 50);

try {
  await Watch({
    path: './src',
    debounce_interval: 50,
    change_cb: () => {
      build();
    },
    error_cb: (error) => {
      console.error('\x1b[31mfail\x1b[0m', 'ERROR', error);
    },
  });
} catch (err) {
  console.log(err);
}
