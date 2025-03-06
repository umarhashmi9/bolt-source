/**
 * Custom implementation of path-browserify that provides both named exports and a default export
 * This is needed because isomorphic-git expects named exports from path-browserify
 */

// Path utilities
export function join(...parts: string[]): string {
  return parts.join('/').replace(/\/+/g, '/');
}

export function dirname(path: string): string {
  if (!path || !path.includes('/')) {
    return '.';
  }

  path = path.replace(/\/+$/, '');

  return path.split('/').slice(0, -1).join('/') || '/';
}

export function basename(path: string, ext?: string): string {
  path = path.replace(/\/+$/, '');

  const base = path.split('/').pop() || '';

  if (ext && base.endsWith(ext)) {
    return base.slice(0, -ext.length);
  }

  return base;
}

export function extname(path: string): string {
  const base = path.split('/').pop() || '';
  const lastDotIndex = base.lastIndexOf('.');

  return lastDotIndex === -1 || lastDotIndex === 0 ? '' : base.slice(lastDotIndex);
}

export function relative(from: string, to: string): string {
  from = from.replace(/\/+$/, '');
  to = to.replace(/\/+$/, '');

  if (from === to) {
    return '';
  }

  if (to.startsWith(from + '/')) {
    return to.slice(from.length + 1);
  }

  return to;
}

export function resolve(...parts: string[]): string {
  return parts.join('/').replace(/\/+/g, '/');
}

export function normalize(path: string): string {
  return path.replace(/\/+/g, '/');
}

export function isAbsolute(path: string): boolean {
  return path.startsWith('/');
}

export interface ParsedPath {
  root: string;
  dir: string;
  base: string;
  ext: string;
  name: string;
}

export function parse(path: string): ParsedPath {
  const dir = dirname(path);
  const base = basename(path);
  const ext = extname(path);
  const name = base.slice(0, base.length - ext.length);

  return { root: '', dir, base, ext, name };
}

export function format(pathObject: ParsedPath): string {
  const { dir, base } = pathObject;

  return (dir ? dir + '/' : '') + base;
}

export const sep = '/';
export const delimiter = ':';

// Create posix and win32 objects that reference the same functions
export const posix = {
  join,
  dirname,
  basename,
  extname,
  relative,
  resolve,
  normalize,
  isAbsolute,
  parse,
  format,
  sep,
  delimiter,
};

export const win32 = posix;

// Default export for compatibility with CommonJS imports
const pathBrowserify = {
  join,
  dirname,
  basename,
  extname,
  relative,
  resolve,
  normalize,
  isAbsolute,
  parse,
  format,
  sep,
  delimiter,
  posix,
  win32,
};

export default pathBrowserify;
