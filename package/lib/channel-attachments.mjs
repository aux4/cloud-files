import { createHash, randomUUID } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { mkdir, open, rename, lstat, unlink, readdir } from "node:fs/promises";
import { dirname, isAbsolute, join, relative } from "node:path";

const MAX_BYTES = 6 * 1024 * 1024;
const MAX_REFS = 10;
const NAME_MAX = 255;
const TYPE_MAX = 255;
const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function error(message, code = "INVALID_ATTACHMENT") {
  const e = new Error(message); e.code = code; return e;
}
function stringValue(value, label, max = 512) {
  if (typeof value !== "string" || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/u.test(value)) throw error(`Invalid ${label}`);
  return value;
}
function principalId(principal) {
  if (!principal || typeof principal !== "object") throw error("Authenticated principal is required", "UNAUTHORIZED");
  return stringValue(principal.sub || principal.id, "principal", 256);
}
function channelId(value) { return stringValue(value, "channel", 512); }
function idValue(value) {
  if (typeof value !== "string" || !ID_RE.test(value)) throw error("Invalid attachment id");
  return value.toLowerCase();
}
function displayName(value) {
  if (typeof value !== "string") throw error("Invalid filename");
  const name = value.replace(/[\\/]+/g, "_").replace(/[\u0000-\u001f\u007f]/gu, "_").replace(/^\.+$/u, "_").trim().slice(0, NAME_MAX);
  if (!name) throw error("Invalid filename");
  return name;
}
function contentType(value) { return value == null || value === "" ? "application/octet-stream" : stringValue(value, "content type", TYPE_MAX); }
function decode(value) {
  if (typeof value !== "string" || !value || value.length % 4) throw error("Attachment data must be strict base64");
  if (value.length > Math.ceil(MAX_BYTES / 3) * 4) throw error("Attachment exceeds the 6 MiB limit");
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(value)) throw error("Attachment data must be strict base64");
  const bytes = Buffer.from(value, "base64");
  if (!bytes.length || bytes.length > MAX_BYTES || bytes.toString("base64") !== value) throw error("Attachment exceeds the 6 MiB limit or is invalid base64");
  return bytes;
}
function channelHash(value) { return createHash("sha256").update(value).digest("hex"); }
function ref(metadata) { return { id: metadata.id, name: metadata.name, size: metadata.size, type: metadata.type, url: `/api/apps/files/channel-attachment?channelId=${encodeURIComponent(metadata.channelId)}&id=${encodeURIComponent(metadata.id)}` }; }
function checkedMetadata(value, expectedId, expectedChannel) {
  let canonicalName = null;
  try { if (value && typeof value.name === "string") canonicalName = displayName(value.name); } catch {}
  if (!value || typeof value !== "object" || value.id !== expectedId || typeof value.name !== "string" || !value.name || value.name.length > NAME_MAX || canonicalName !== value.name || typeof value.channelId !== "string" || value.channelId !== expectedChannel || typeof value.uploaderId !== "string" || !value.uploaderId || !Number.isSafeInteger(value.size) || value.size <= 0 || value.size > MAX_BYTES || typeof value.type !== "string" || !value.type || value.type.length > TYPE_MAX || /[\u0000-\u001f\u007f]/u.test(value.type) || typeof value.sha256 !== "string" || !/^[0-9a-f]{64}$/u.test(value.sha256)) throw error("Invalid attachment metadata", "NOT_FOUND");
  return value;
}
async function rejectSymlink(root, path = root) {
  const parts = relative(root, path).split(/[\\/]/u).filter(Boolean); let current = root;
  for (const part of ["", ...parts]) {
    current = part ? join(current, part) : current;
    try { if ((await lstat(current)).isSymbolicLink()) throw error("Symlink attachment path refused", "NOT_FOUND"); }
    catch (e) { if (e.code !== "ENOENT") throw e; }
  }
}
async function atomicCreate(path, bytes) {
  await rejectSymlink(dirname(path));
  const temp = `${path}.tmp-${randomUUID()}`;
  try {
    const handle = await open(temp, fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_NOFOLLOW, 0o600);
    try { await handle.writeFile(bytes); } finally { await handle.close(); }
    await rename(temp, path);
  } catch (e) { try { await unlink(temp); } catch {} throw e; }
}

export function createAttachmentStore({ root, authorize } = {}) {
  if (typeof root !== "string" || !isAbsolute(root) || root.length < 2) throw error("Attachment storage root must be an explicit absolute path");
  if (typeof authorize !== "function") throw error("Attachment authorization callback is required");
  async function authorizeOp(principal, channel, attachmentId) {
    principalId(principal);
    const result = await authorize(attachmentId ? { principal, channelId: channel, attachmentId } : { principal, channelId: channel });
    if (!result || result.authorized !== true || result.channelId !== channel) throw error("Attachment access denied", "FORBIDDEN");
    return principalId(principal);
  }
  async function locations(channel, id) {
    const dir = join(root, "channels", channelHash(channel));
    await rejectSymlink(root); await mkdir(dir, { recursive: true, mode: 0o700 }); await rejectSymlink(root, dir);
    return { dir, bytes: join(dir, `${id}.bin`), metadata: join(dir, `${id}.json`) };
  }
  async function metadataFor(channel, id, { create = true } = {}) {
    const target = create ? await locations(channel, id) : { dir: join(root, "channels", channelHash(channel)), bytes: join(root, "channels", channelHash(channel), `${id}.bin`), metadata: join(root, "channels", channelHash(channel), `${id}.json`) };
    if (!create) await rejectSymlink(root, target.dir);
    let metadata;
    try {
      const handle = await open(target.metadata, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
      try {
        const stat = await handle.stat();
        if (!stat.isFile() || stat.size > 4096) throw error("Invalid attachment metadata", "NOT_FOUND");
        metadata = JSON.parse(await handle.readFile("utf8"));
      } finally { await handle.close(); }
    } catch (e) { if (e.code === "NOT_FOUND") throw e; throw error("Attachment not found", "NOT_FOUND"); }
    return { target, metadata: checkedMetadata(metadata, id, channel) };
  }
  return {
    async upload({ principal, channelId: rawChannel, name, type, data } = {}) {
      const channel = channelId(rawChannel); const uploaderId = await authorizeOp(principal, channel); const bytes = decode(data); const id = randomUUID();
      const target = await locations(channel, id); const metadata = { id, channelId: channel, uploaderId, name: displayName(name), size: bytes.length, type: contentType(type), sha256: createHash("sha256").update(bytes).digest("hex") };
      await atomicCreate(target.bytes, bytes);
      try { await atomicCreate(target.metadata, Buffer.from(JSON.stringify(metadata), "utf8")); } catch (e) { try { await unlink(target.bytes); } catch {} throw e; }
      return ref(metadata);
    },
    async resolve({ principal, channelId: rawChannel, attachments } = {}) {
      const channel = channelId(rawChannel); const subject = await authorizeOp(principal, channel);
      if (!Array.isArray(attachments) || attachments.length > MAX_REFS) throw error("At most 10 attachments may be referenced");
      const ids = attachments.map(item => idValue(typeof item === "string" ? item : item?.id));
      if (new Set(ids).size !== ids.length) throw error("Duplicate attachment id");
      const result = [];
      for (const id of ids) { const { metadata } = await metadataFor(channel, id); if (metadata.uploaderId !== subject) throw error("Attachment owner mismatch", "FORBIDDEN"); result.push(ref(metadata)); }
      return result;
    },
    async list({ principal, channelId: rawChannel } = {}) {
      const channel = channelId(rawChannel);
      await authorizeOp(principal, channel);
      const dir = join(root, "channels", channelHash(channel));
      await rejectSymlink(root, dir);
      let entries;
      try { entries = await readdir(dir, { withFileTypes: true }); } catch (e) {
        if (e.code === "ENOENT") return [];
        throw e;
      }
      const listed = [];
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith(".json") || !ID_RE.test(entry.name.slice(0, -5))) continue;
        const id = entry.name.slice(0, -5).toLowerCase();
        try {
          const { metadata } = await metadataFor(channel, id, { create: false });
          await authorizeOp(principal, channel, id);
          listed.push(ref(metadata));
        } catch {
          // Invalid, unpublished, removed, or incomplete attachments are not
          // visible in the shared folder.
        }
      }
      await authorizeOp(principal, channel);
      return listed.sort((a, b) => a.id.localeCompare(b.id));
    },
    async download({ principal, channelId: rawChannel, id: rawId } = {}) {
      const channel = channelId(rawChannel); const id = idValue(rawId);
      await authorizeOp(principal, channel, id);
      const { target, metadata } = await metadataFor(channel, id);
      let bytes; try { const handle = await open(target.bytes, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW); try { bytes = await handle.readFile(); } finally { await handle.close(); } } catch { throw error("Attachment not found", "NOT_FOUND"); }
      if (bytes.length !== metadata.size || createHash("sha256").update(bytes).digest("hex") !== metadata.sha256) throw error("Attachment integrity check failed", "NOT_FOUND");
      await authorizeOp(principal, channel, id);
      const fallback = metadata.name.replace(/[^\x20-\x7e]/gu, "_").replace(/["\\]/g, "_") || "download"; const encoded = encodeURIComponent(metadata.name).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
      return { statusCode: 200, headers: { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" }, isBase64Encoded: true, body: bytes.toString("base64") };
    }
  };
}
export { MAX_BYTES };
