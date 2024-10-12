import { AsyncLineReader } from '../../src/lib/ericchase/Algorithm/Stream.js';
import { Spawn } from '../../src/lib/ericchase/Platform/Bun/Child Process.js';
import { ConsoleErrorToLines, ConsoleLog } from '../../src/lib/ericchase/Utility/Console.js';
import { manifest_path, src_dir } from './build.js';
import { Manifest } from './load-manifest.js';

const manifest = new Manifest(manifest_path);

const icon_path = src_dir.appendSegment('/assets/icon.svg');
const icon_entries = manifest.GetManifestItem('MANIFEST_REQUIRED', 'icons');

async function buildIconTask(size: string, filename: string) {
  const out_path = src_dir.appendSegment(filename);
  const child_process = Spawn('magick', '-background', 'none', icon_path.path, '-resize', `${size}x${size}`, out_path.path);
  const stderrReader = AsyncLineReader(child_process.stderr);
  const stdoutReader = AsyncLineReader(child_process.stdout);
  const errors = await Array.fromAsync(stderrReader);
  if (errors.length > 0) {
    ConsoleErrorToLines(errors);
    ConsoleLog('Restarting Task');
    await buildIconTask(size, filename);
  }
  const logs = await Array.fromAsync(stdoutReader);
  if (logs.length > 0) {
    ConsoleErrorToLines(logs);
  }
}

for (const [size, filename] of Object.entries(icon_entries)) {
  if (typeof filename === 'string') {
    buildIconTask(size, filename);
  }
}
