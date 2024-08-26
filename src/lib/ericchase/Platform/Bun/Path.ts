import node_path from 'node:path';

export class PathGroup {
  constructor(
    public readonly basedir: string,
    public readonly dir: string,
    public readonly name: string,
    public readonly ext: string,
  ) {}
  static new(basedir: string, path: string) {
    const { dir, name, ext } = node_path.parse(node_path.normalize(path));
    return new PathGroup(basedir, dir, name, ext);
  }
  get path() {
    return node_path.join(this.basedir, this.dir, this.name + this.ext);
  }
  replaceBasedir(new_basedir: string) {
    return new PathGroup(node_path.normalize(new_basedir), this.dir, this.name, this.ext);
  }
  replaceDir(new_dir: string) {
    return new PathGroup(this.basedir, node_path.normalize(new_dir), this.name, this.ext);
  }
  replaceName(new_name: string) {
    return new PathGroup(this.basedir, this.dir, new_name, this.ext);
  }
  replaceExt(new_ext: string) {
    return new PathGroup(this.basedir, this.dir, this.name, new_ext);
  }
}

export class GlobGroup {
  constructor(
    public readonly basedir: string,
    public readonly pattern: string,
    public readonly pathGroupSet: Set<PathGroup>,
  ) {}
  static new({ basedir, pattern }: { basedir: string; pattern: string }) {
    basedir = node_path.normalize(basedir);
    const pathSet = new Set<PathGroup>();
    for (const path of new Bun.Glob(pattern).scanSync(basedir)) {
      pathSet.add(PathGroup.new(basedir, path));
    }
    return new GlobGroup(basedir, pattern, pathSet);
  }
  get paths() {
    return this.path_iterator();
  }
  get pathGroups() {
    return this.pathGroup_iterator();
  }
  replaceBasedir(new_base: string) {
    new_base = node_path.normalize(new_base);
    const new_pathGroupSet = new Set<PathGroup>();
    for (const group of this.pathGroupSet) {
      new_pathGroupSet.add(group.replaceBasedir(new_base));
    }
    return new GlobGroup(new_base, this.pattern, new_pathGroupSet);
  }
  *path_iterator() {
    for (const group of this.pathGroupSet) {
      yield group.path;
    }
  }
  *pathGroup_iterator() {
    for (const group of this.pathGroupSet) {
      yield group;
    }
  }
}

export class GlobManager {
  globGroupMap = new Map<string, GlobGroup>();
  getGroup(basedir: string, pattern: string) {
    this.globGroupMap.get(`${basedir}|${pattern}`);
  }
  scan(basedir: string, pattern: string) {
    basedir = node_path.normalize(basedir);
    const group = GlobGroup.new({ basedir, pattern });
    this.globGroupMap.set(`${basedir}|${pattern}`, group);
    return group;
  }
}
