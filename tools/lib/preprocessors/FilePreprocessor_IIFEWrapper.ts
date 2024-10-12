import type { Path, PathGroup } from '../../../src/lib/ericchase/Platform/Node/Path.js';
import { DecodeBytes, EncodeText } from '../../../src/lib/ericchase/Utility/TextCodec.js';
import type { FilePreprocessor } from './FilePreprocessor.js';

export class IIFEWrapperPreprocessor implements FilePreprocessor {
  constructor(public path_endings: string[]) {}
  pathMatches(path: Path | PathGroup) {
    for (const ending of this.path_endings) {
      if (path.path.endsWith(ending)) {
        return true;
      }
    }
    return false;
  }
  preprocess(bytes: Uint8Array) {
    return { bytes: EncodeText(`(() => {\n${DecodeBytes(bytes)}})();`) };
  }
}
