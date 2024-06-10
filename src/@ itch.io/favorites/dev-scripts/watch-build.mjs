import { Run, StdPipe } from './lib/lib-process.mjs';
import { Watch } from './lib/lib-watch.mjs';
import { Debounce } from './lib/lib.mjs';

try {
  const run_build = Debounce(async () => {
    StdPipe(await Run('bun', ['run', 'build']));
  }, 250);

  await Watch({
    path: './src',
    debounce_interval: 250,
    change_cb: () => {
      run_build();
    },
    error_cb: (error) => {
      console.error('ERROR:', error);
    },
  });
} catch (err) {
  console.log(err);
}
