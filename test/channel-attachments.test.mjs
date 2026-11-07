import assert from "node:assert/strict";
import { mkdtemp, mkdir, symlink, writeFile, unlink, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createHash } from "node:crypto";
import { createAttachmentStore, MAX_BYTES } from "../package/lib/channel-attachments.mjs";

const principal = sub => ({ sub });
const data = text => Buffer.from(text).toString("base64");
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "channel-attachments-"));
  const calls = [];
  const allowed = new Set(["alice"]);
  const authorize = async request => {
    calls.push(request);
    return { authorized: allowed.has(request.principal?.sub), channelId: request.channelId };
  };
  return { root, calls, allowed, store: createAttachmentStore({ root, authorize }) };
}

test("authorized upload, resolve, and download use immutable trusted metadata", async () => {
  const { store, calls } = await fixture();
  const uploaded = await store.upload({ principal: principal("alice"), channelId: "room-1", name: "../report\n.pdf", type: "text/plain", data: data("hello") });
  assert.match(uploaded.id, /^[0-9a-f-]{36}$/);
  assert.equal(uploaded.name, ".._report_.pdf");
  assert.equal(uploaded.size, 5);
  assert.match(uploaded.url, /channelId=room-1/);
  assert.deepEqual(await store.resolve({ principal: principal("alice"), channelId: "room-1", attachments: [{ id: uploaded.id, name: "forged", size: 999, type: "text/html", url: "https://evil" }] }), [uploaded]);
  const envelope = await store.download({ principal: principal("alice"), channelId: "room-1", id: uploaded.id });
  assert.equal(envelope.body, data("hello"));
  assert.equal(envelope.headers["Content-Type"], "application/octet-stream");
  assert.equal(envelope.headers["X-Content-Type-Options"], "nosniff");
  assert.equal(envelope.headers["Cache-Control"], "private, no-store");
  assert.equal(calls.at(-1).attachmentId, uploaded.id);
});

test("authorization is required and fails closed for outsiders or removed members", async () => {
  const { root, store, allowed } = await fixture();
  assert.throws(() => createAttachmentStore({ root }), /authorization callback is required/);
  await assert.rejects(store.upload({ principal: {}, channelId: "room", name: "x", data: data("x") }), /principal/);
  await assert.rejects(store.upload({ principal: principal("eve"), channelId: "room", name: "x", data: data("x") }), /denied/);
  allowed.add("alice");
  const uploaded = await store.upload({ principal: principal("alice"), channelId: "room", name: "x", data: data("x") });
  allowed.delete("alice");
  await assert.rejects(store.download({ principal: principal("alice"), channelId: "room", id: uploaded.id }), /denied/);
});

test("unauthorized download does not create attachment directories", async () => {
  const { root, store } = await fixture();
  await assert.rejects(store.download({ principal: principal("eve"), channelId: "secret-room", id: "00000000-0000-4000-8000-000000000000" }), /denied/);
  await assert.rejects(readdir(join(root, "channels")), /ENOENT/);
});

test("list exposes only published attachments and does not create absent folders", async () => {
  const { root, store } = await fixture();
  const absent = await store.list({ principal: principal("alice"), channelId: "empty-room" });
  assert.deepEqual(absent, []);
  await assert.rejects(readdir(join(root, "channels")), /ENOENT/);

  const published = new Set();
  const listingRoot = await mkdtemp(join(tmpdir(), "channel-list-"));
  const listingStore = createAttachmentStore({ root: listingRoot, authorize: async request => ({ authorized: request.principal?.sub === "alice" && (!request.attachmentId || published.has(request.attachmentId)), channelId: request.channelId }) });
  const first = await listingStore.upload({ principal: principal("alice"), channelId: "room", name: "first.txt", data: data("1") });
  const second = await listingStore.upload({ principal: principal("alice"), channelId: "room", name: "second.txt", data: data("2") });
  published.add(first.id);
  assert.deepEqual((await listingStore.list({ principal: principal("alice"), channelId: "room" })).map(item => item.id), [first.id]);
  published.add(second.id);
  assert.equal((await listingStore.list({ principal: principal("alice"), channelId: "room" })).length, 2);
  await assert.rejects(listingStore.list({ principal: principal("eve"), channelId: "room" }), /denied/);
});

test("channel binding, uploader ownership, duplicate ids, and forged refs are rejected", async () => {
  const { store } = await fixture();
  const uploaded = await store.upload({ principal: principal("alice"), channelId: "room-a", name: "x", data: data("x") });
  await assert.rejects(store.resolve({ principal: principal("alice"), channelId: "room-b", attachments: [uploaded.id] }), /not found/);
  await assert.rejects(store.resolve({ principal: principal("alice"), channelId: "room-a", attachments: [uploaded.id, uploaded.id] }), /Duplicate/);
  await assert.rejects(store.resolve({ principal: principal("alice"), channelId: "room-a", attachments: [{ id: "../../etc/passwd" }] }), /Invalid attachment id/);
  await assert.rejects(store.resolve({ principal: principal("bob"), channelId: "room-a", attachments: [uploaded.id] }), /denied/);
  await assert.rejects(store.resolve({ principal: principal("alice"), channelId: "room-a", attachments: Array.from({ length: 11 }, () => uploaded.id) }), /At most/);
});

test("base64 and size limits are strict", async () => {
  const { store } = await fixture();
  for (const invalid of ["not base64", "a", "YWJj\n", "YWJj="]) await assert.rejects(store.upload({ principal: principal("alice"), channelId: "room", name: "x", data: invalid }), /base64/);
  await assert.rejects(store.upload({ principal: principal("alice"), channelId: "room", name: "x", data: Buffer.alloc(MAX_BYTES + 1).toString("base64") }), /6 MiB/);
});

test("symlinked channel storage is refused", async () => {
  const { root, store } = await fixture();
  const hash = createHash("sha256").update("room").digest("hex");
  const outside = await mkdtemp(join(tmpdir(), "attachment-outside-"));
  await mkdir(join(root, "channels"), { recursive: true });
  await symlink(outside, join(root, "channels", hash));
  await assert.rejects(store.upload({ principal: principal("alice"), channelId: "room", name: "x", data: data("x") }), /Symlink|EEXIST/);
  assert.deepEqual((await import("node:fs/promises")).readdir ? await (await import("node:fs/promises")).readdir(outside) : [], []);
});

test("metadata cannot be forged into a different channel or size", async () => {
  const { root, store } = await fixture();
  const uploaded = await store.upload({ principal: principal("alice"), channelId: "room", name: "x", data: data("x") });
  const dir = join(root, "channels", createHash("sha256").update("room").digest("hex"));
  await writeFile(join(dir, `${uploaded.id}.json`), JSON.stringify({ id: uploaded.id, channelId: "other", uploaderId: "alice", name: "x", size: 999, type: "text/html", sha256: "0".repeat(64) }));
  await assert.rejects(store.download({ principal: principal("alice"), channelId: "room", id: uploaded.id }), /metadata/);
});

test("metadata symlinks are refused", async () => {
  const { root, store } = await fixture();
  const uploaded = await store.upload({ principal: principal("alice"), channelId: "room", name: "x", data: data("x") });
  const dir = join(root, "channels", createHash("sha256").update("room").digest("hex"));
  const metadataPath = join(dir, `${uploaded.id}.json`);
  const outside = join(root, "outside.json");
  await writeFile(outside, JSON.stringify({ id: uploaded.id, channelId: "room", uploaderId: "alice", name: "x", size: 1, type: "text/plain", sha256: createHash("sha256").update("x").digest("hex") }));
  await unlink(metadataPath);
  await symlink(outside, metadataPath);
  await assert.rejects(store.download({ principal: principal("alice"), channelId: "room", id: uploaded.id }), /not found/);
});

test('multi-megabyte photos and maximum-size files validate without regex stack exhaustion', async () => {
  const { store } = await fixture();
  for (const length of [3460300, MAX_BYTES]) {
    const bytes = Buffer.alloc(length, 175);
    const uploaded = await store.upload({ principal: principal('alice'), channelId: 'photos', name: 'IMG_5139.jpeg', type: 'image/jpeg', data: bytes.toString('base64') });
    assert.equal(uploaded.size, length);
    const downloaded = await store.download({ principal: principal('alice'), channelId: 'photos', id: uploaded.id });
    assert.equal(downloaded.body, bytes.toString('base64'));
  }
});
