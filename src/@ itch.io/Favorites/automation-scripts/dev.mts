import { Debounce } from './lib/Algorithm/Debounce.mts';
import { Watch } from './lib/Cxx/Watch.mts';
import { Run } from './lib/Node/Process.mts';

// tsc watch
Run({ program: 'bun', args: 'run tsc --preserveWatchOutput --watch'.split(' ') });

// format code
try {
  const run_format = Debounce(async () => {
    await Run({ program: 'bun', args: ['run', 'format'] });
  }, 500);

  await Watch({
    path: './src',
    debounce_interval: 500,
    change_cb: run_format,
    error_cb: (error) => {
      console.error('ERROR:', error);
    },
  });
} catch (err) {
  console.log(err);
}
