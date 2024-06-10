import { ReadFile, WriteFile } from './lib-fs.mjs';

export class Config {
  /** @param {object} pojo */
  constructor(pojo) {
    this.pojo = /**@type{Record<string,any>}*/ (pojo);
  }
  /**
   * @param {string} key
   * @memberof Config
   */
  get(key) {
    return this.pojo[key];
  }
  /**
   * @param {string} key
   * @param {any} value
   * @memberof Config
   */
  set(key, value) {
    this.pojo[key] = value;
  }
  toJSON() {
    return JSON.stringify(this.pojo);
  }

  // STATIC

  /**
   * @param {Config} configA
   * @param {Config} configB
   */
  static mergeConfigs(configA, configB) {
    /** @param {Record<string,any>[]} objects */
    function mergeObjects(...objects) {
      const to = /** @type {Record<string,any>} */ ({});
      for (const from of objects) {
        if (typeof from !== 'object') continue;
        for (const key in from) {
          if (from.hasOwnProperty(key)) {
            if (typeof from[key] === 'object' && Array.isArray(from[key]) === false) {
              to[key] = mergeObjects(to[key], from[key]);
            } else {
              to[key] = from[key];
            }
          }
        }
      }
      return to;
    }
    return new Config(mergeObjects(configA.pojo, configB.pojo));
  }

  /** @param {string} path */
  static async readConfig(path) {
    return new Config(JSON.parse(await ReadFile(path)));
  }

  /**
   * @param {Config} config
   * @param {string} key
   */
  static async subConfig(config, key) {
    return new Config(config.get(key));
  }
}

/**
 * @typedef {object} SemanticVersion
 * @property {number} SemanticVersion.major
 * @property {number} SemanticVersion.minor
 * @property {number} SemanticVersion.patch
 */

// Given a version number MAJOR.MINOR.PATCH, increment the:
//  MAJOR version when you make incompatible API changes
//  MINOR version when you add functionality in a backward compatible manner
//  PATCH version when you make backward compatible bug fixes
// https://semver.org/

export async function GetSemanticVersion() {
  const version = /** @type {SemanticVersion} */ (JSON.parse(await ReadFile('./version.json')));
  return `${version.major}.${version.minor}.${version.patch}`;
}

export async function IncrementVersionMajor() {
  const version = /** @type {SemanticVersion} */ (JSON.parse(await ReadFile('./version.json')));
  version.major += 1;
  await WriteFile('./version.json', JSON.stringify(version));
}

export async function IncrementVersionMinor() {
  const version = /** @type {SemanticVersion} */ (JSON.parse(await ReadFile('./version.json')));
  version.minor += 1;
  await WriteFile('./version.json', JSON.stringify(version));
}

export async function IncrementVersionPatch() {
  const version = /** @type {SemanticVersion} */ (JSON.parse(await ReadFile('./version.json')));
  version.patch += 1;
  await WriteFile('./version.json', JSON.stringify(version));
}
