import { Debounce } from '../src/lib/ericchase/Algorithm/Debounce.js';
import { Watch } from '../src/lib/ericchase/Platform/Cxx/Watch.js';

const runBuild = Debounce(async () => {
  const cmd = 'bun run build';
  console.log(`[${new Date().toLocaleTimeString()}] > ${cmd}`);
  Bun.spawnSync(cmd.split(' '));
}, 250);

try {
  await Watch({
    path: './src',
    debounce_interval: 250,
    change_cb: () => {
      runBuild();
    },
    error_cb: (error) => {
      console.error('ERROR:', error);
    },
  });
} catch (err) {
  console.log(err);
}
