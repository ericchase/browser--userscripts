import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export function Sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(() => resolve(), ms));
}

type TrackDetails = { albumName: string; trackName: string; uris: string[] };

const trackList: TrackDetails[] = JSON.parse(`[{"albumName":"THE LEGEND OF ZELDA: OCARINA OF TIME / Re-Arranged Album (1999)","trackName":"Title Theme","uris":["https://vgmsite.com/soundtracks/legend-of-zelda-ocarina-of-time-re-arranged-album/ewyuqahfoq/01.%20Title%20Theme.mp3","https://vgmsite.com/soundtracks/legend-of-zelda-ocarina-of-time-re-arranged-album/ewyuqahfoq/01.%20Title%20Theme.flac"]}]`);
const albumName = `THE LEGEND OF ZELDA: OCARINA OF TIME / Re-Arranged Album (1999)`;

console.log('Album:', albumName);
const url = new URL(trackList[0].uris[0]);
const segments = url.pathname.slice(1 + url.pathname.indexOf('/')).split('/');
const albumpath = Bun.fileURLToPath(Bun.pathToFileURL(resolve('./' + segments[1])));
await mkdir(albumpath, { recursive: true });

for (const { trackName, uris } of trackList) {
  for (const uri of uris) {
    console.log('Track:', trackName);
    const url = new URL(uri);
    const segments = url.pathname.slice(1 + url.pathname.indexOf('/')).split('/');
    const filepath = Bun.fileURLToPath(Bun.pathToFileURL(resolve(albumpath + '/' + segments[segments.length - 1])));
    const response = await fetch(uri);
    await Bun.write(filepath, await response.blob());
    await Sleep(1000);
  }
}
