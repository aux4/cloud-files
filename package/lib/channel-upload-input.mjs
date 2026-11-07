import { readFile, realpath, lstat } from 'node:fs/promises';
import { join, resolve, relative, basename } from 'node:path';
import { tmpdir } from 'node:os';
// Only the multipart parser can construct this array. Multipart text fields are
// strings; JSON requests are rejected even if they copy the descriptor shape.
export async function uploadedChannelFile(body, headers, {maxBytes = 6291456} = {}) {
  if (!/^multipart\/form-data\s*;/i.test(headers?.['content-type'] || '') || !Array.isArray(body.file) || body.file.length !== 1) throw new Error('A multipart file is required.');
  const file = body.file[0];
  if (!file || typeof file.filename !== 'string' || !file.filename || /[\\/\x00-\x1f\x7f]/.test(file.filename) || file.filename === '.' || file.filename === '..') throw new Error('Invalid filename.');
  const tempRoot = await realpath(join(tmpdir(), 'aux4-api'));
  const path = resolve(String(file.path || ''));
  const rel = relative(resolve(tmpdir(), 'aux4-api'), path).split('/');
  if (rel.length !== 2 || !/^[a-f0-9-]{36}$/i.test(rel[0]) || basename(path) !== file.filename) throw new Error('Invalid upload.');
  for (const part of [join(tempRoot,rel[0]),path]) if ((await lstat(part)).isSymbolicLink()) throw new Error('Invalid upload.');
  if (await realpath(path) !== join(tempRoot, ...rel)) throw new Error('Invalid upload.');
  const info = await lstat(path);
  if (!info.isFile() || info.size > maxBytes || info.size === 0) throw new Error('File is empty or exceeds the upload limit.');
  return {name:file.filename,type:file.mimeType || 'application/octet-stream',data:(await readFile(path)).toString('base64')};
}
