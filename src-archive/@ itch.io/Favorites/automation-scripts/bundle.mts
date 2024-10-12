import { Run } from './lib/Node/Process.mts';
import { IncrementVersionPatch } from './lib/Web/Browser/Addon.mts';

await IncrementVersionPatch();
await Run({ program: 'bun', args: ['run', 'build'] });
