import { JSONGet } from '../../src/lib/ericchase/Algorithm/JSON.js';
import { JSONMerge } from '../../src/lib/ericchase/Algorithm/JSON/Merge.js';
import { SpawnSync } from '../../src/lib/ericchase/Platform/Bun/Child Process.js';
import { Path, type PathGroup } from '../../src/lib/ericchase/Platform/Node/Path.js';
import { ConsoleError, ConsoleLog } from '../../src/lib/ericchase/Utility/Console.js';
import { DecodeBytes } from '../../src/lib/ericchase/Utility/TextCodec.js';
import { UpdateMarkerManager } from '../../src/lib/ericchase/Utility/UpdateMarker.js';
import { Cache_IsFileModified } from '../lib/cache/FileStatsCache.js';

// direct run
if (Bun.argv[1] === __filename) {
  const module_path = Bun.argv[2];
  if (module_path) {
    ConsoleError(new Path(module_path).resolve);
    const module = await import(new Path(module_path).resolve);
    ConsoleLog(JSON.stringify(module));
  }
}

export class Manifest {
  marker_manager = new UpdateMarkerManager();
  cached_manifest = undefined as unknown as Record<string, any>;

  constructor(public manifest_path: Path | PathGroup) {}

  LoadManifestIfModified() {
    console.log(this.manifest_path.path);
    console.log(new Path(process.cwd()).appendSegment(this.manifest_path).resolve);
    if (this.cached_manifest === undefined || Cache_IsFileModified(this.manifest_path).data === true) {
      const child_process = SpawnSync.Bun.Silent(__filename, new Path(process.cwd()).appendSegment(this.manifest_path).resolve);
      const error = DecodeBytes(child_process.stderr);
      console.log(error);
      const output = DecodeBytes(child_process.stdout);
      if (output === '') {
        throw `Failed to load manifest from ${this.manifest_path.path}.`;
      }
      this.cached_manifest = JSON.parse(output);
      this.marker_manager.updateMarkers();
    }
  }
  GetManifestMark() {
    return this.marker_manager.getNewMarker();
  }
  GetBrowserDirectories(out_dir: Path | PathGroup) {
    this.LoadManifestIfModified();
    return [...new Set([...Object.keys(this.cached_manifest.PER_BROWSER_MANIFEST_OPTIONAL), ...Object.keys(this.cached_manifest.PER_BROWSER_MANIFEST_PACKAGE)])] //
      .map((name) => Path.from(out_dir).appendSegment(name));
  }
  GetBrowserNames() {
    this.LoadManifestIfModified();
    return [...new Set([...Object.keys(this.cached_manifest.PER_BROWSER_MANIFEST_OPTIONAL), ...Object.keys(this.cached_manifest.PER_BROWSER_MANIFEST_PACKAGE)])];
  }
  *GetBrowserManifests(for_archive: boolean) {
    this.LoadManifestIfModified();
    for (const browser_name of this.GetBrowserNames()) {
      const browser_manifest = JSONMerge(
        this.cached_manifest.MANIFEST_REQUIRED ?? {}, //
        this.cached_manifest.MANIFEST_OPTIONAL ?? {},
        JSONGet(this.cached_manifest.PER_BROWSER_MANIFEST_OPTIONAL, browser_name) ?? {},
        for_archive === true ? (JSONGet(this.cached_manifest.PER_BROWSER_MANIFEST_PACKAGE, browser_name) ?? {}) : {},
      );
      yield {
        browser_name,
        browser_manifest,
      };
    }
  }
  GetManifestItem(...keypath: string[]) {
    this.LoadManifestIfModified();
    let prop = this.cached_manifest;
    for (const key of keypath) {
      prop = prop[key];
    }
    return prop as any;
  }
  GetVersion() {
    this.LoadManifestIfModified();
    return this.cached_manifest.MANIFEST_REQUIRED.version;
  }
}
