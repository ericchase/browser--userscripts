import { U8Concat } from '../../src/lib/ericchase/Algorithm/Uint8Array.js';
import type { Path, PathGroup } from '../../src/lib/ericchase/Platform/Node/Path.js';
import { EncodeText } from '../../src/lib/ericchase/Utility/TextCodec.js';
import { IntoPatterns } from '../lib/build.js';
import type { FilePreprocessor } from '../lib/preprocessors/FilePreprocessor.js';

function extractHeaderComment(source: string) {
  const HEADER_START = 'const header = `';
  const HEADER_END = '`;';
  const beg = source.indexOf(HEADER_START);
  if (beg === -1) return '';
  const end = source.indexOf(HEADER_END, beg);
  if (end === -1) return '';
  return `${source.slice(beg + HEADER_START.length, end).trim()}\n\n`;
}

export class ExtractHeaderCommentPreprocessor implements FilePreprocessor {
  path_endings: string[];
  constructor(
    public src_dir: Path,
    public suffixes: string[],
  ) {
    this.path_endings = IntoPatterns(suffixes, '.js');
  }
  pathMatches(path: Path | PathGroup) {
    for (const ending of this.path_endings) {
      if (path.path.endsWith(ending)) {
        return true;
      }
    }
    return false;
  }
  async preprocess(bytes: Uint8Array, path_group: PathGroup) {
    const source = await Bun.file(this.src_dir.appendSegment(path_group.relative_path).newExt('.ts').path).text();
    const header = extractHeaderComment(source);
    return { bytes: U8Concat([EncodeText(header), bytes]) };
  }
}
