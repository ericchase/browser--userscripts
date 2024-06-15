import { ReadFile, WriteFile } from '../../Node/Fs.mts';

export class Config {
  constructor(public pojo: Record<string, any>) {}
  get(this: Config, key: string) {
    return this.pojo[key];
  }
  set(this: Config, key: string, value: any) {
    this.pojo[key] = value;
  }
  toJSON() {
    return JSON.stringify(this.pojo);
  }

  // STATIC

  static mergeConfigs(configA: Config, configB: Config) {
    function merge_objects(...sources: any[]) {
      const dest: Record<any, any> = {};
      for (const source of sources) {
        if (typeof source !== 'object') {
          continue;
        }
        for (const key in source) {
          if (source.hasOwnProperty(key)) {
            if (typeof source[key] === 'object' && Array.isArray(source[key]) === false) {
              dest[key] = merge_objects(dest[key], source[key]);
            } else {
              dest[key] = source[key];
            }
          }
        }
      }
      return dest;
    }
    return new Config(merge_objects(configA.pojo, configB.pojo));
  }

  static async readConfig(path: string) {
    return new Config(JSON.parse(await ReadFile(path)));
  }

  static async extractSubConfig(config: Config, key: string) {
    return new Config(config.get(key));
  }
}

interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
}

// Given a version number MAJOR.MINOR.PATCH, increment the:
//  MAJOR version when you make incompatible API changes
//  MINOR version when you add functionality in a backward compatible manner
//  PATCH version when you make backward compatible bug fixes
// https://semver.org/

export async function GetSemanticVersion() {
  const version: SemanticVersion = JSON.parse(await ReadFile('./version.json'));
  return `${version.major}.${version.minor}.${version.patch}`;
}

export async function IncrementVersionMajor() {
  const version: SemanticVersion = JSON.parse(await ReadFile('./version.json'));
  version.major += 1;
  await WriteFile('./version.json', JSON.stringify(version));
}

export async function IncrementVersionMinor() {
  const version: SemanticVersion = JSON.parse(await ReadFile('./version.json'));
  version.minor += 1;
  await WriteFile('./version.json', JSON.stringify(version));
}

export async function IncrementVersionPatch() {
  const version: SemanticVersion = JSON.parse(await ReadFile('./version.json'));
  version.patch += 1;
  await WriteFile('./version.json', JSON.stringify(version));
}
