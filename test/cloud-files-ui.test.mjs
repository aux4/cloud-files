import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { register } from "../package/static/cloud-files.js";

function component() {
  let Component;
  class LightElement {
    static properties = {};
    updated() {}
  }
  const html = (strings, ...values) => ({ strings: [...strings], values });
  const repeat = (items, _key, render) => items.map(render);
  register({
    base: { LightElement, html, repeat },
    registerLibrary({ components }) {
      [Component] = components;
    }
  });
  return new Component();
}

test("breadcrumb renders complete path segments", () => {
  const browser = component();
  const longSegment = "5e1425b4-09e3-4bd4-9dcb-6a27bdad83ae";
  browser._path = `apps/kb-agent/uploads/${longSegment}/`;

  const rendered = JSON.stringify(browser._renderBreadcrumbs());

  assert.match(rendered, new RegExp(longSegment));
  assert.doesNotMatch(rendered, /5e1425b4…ad83ae/);
});

test("breadcrumb starts at the current folder after path changes", () => {
  const browser = component();
  const breadcrumbs = { scrollLeft: 0, scrollWidth: 960 };
  browser.querySelector = selector => selector === ".cf-breadcrumbs" ? breadcrumbs : null;

  browser.updated(new Map([["_path", ""]]));

  assert.equal(breadcrumbs.scrollLeft, 960);
});

test("breadcrumb CSS scrolls instead of clipping labels", () => {
  const source = readFileSync(new URL("../package/static/cloud-files.js", import.meta.url), "utf8");

  assert.match(source, /\.cf-breadcrumbs\{[^}]*overflow-x:auto/);
  assert.match(source, /\.cf-crumb\{[^}]*flex:none/);
  assert.doesNotMatch(source, /\.cf-crumb\{[^}]*text-overflow:ellipsis/);
});

test("file extensions map to distinct file-kind icons with a safe fallback", () => {
  const browser = component();

  assert.equal(browser._fileKind("photo.JPEG").icon, "image");
  assert.equal(browser._fileKind("report.pdf").icon, "document");
  assert.equal(browser._fileKind("budget.xlsx").icon, "sheet");
  assert.equal(browser._fileKind("source.ts").icon, "code");
  assert.equal(browser._fileKind("bundle.zip").icon, "archive");
  assert.equal(browser._fileKind("README").icon, "file");
});

test("file rows expose an encoded authenticated download link", () => {
  const browser = component();
  const file = { name: "Q3 report.pdf", path: "reports/Q3 report.pdf", size: 42, lastModified: null };

  assert.equal(browser._downloadUrl(file), "/api/apps/files/download?path=reports%2FQ3%20report.pdf");
  const rendered = JSON.stringify(browser._renderRows([], [file]));
  assert.match(rendered, /Download Q3 report\.pdf/);
  assert.match(rendered, /reports%2FQ3%20report\.pdf/);
});

test("search and sorting do not mutate the folder listing", () => {
  const browser = component();
  const items = [
    { name: "Report 10.txt", size: 10, lastModified: "2026-01-02" },
    { name: "Report 2.txt", size: 200, lastModified: "2026-01-01" },
    { name: "Notes.md", size: 30, lastModified: null }
  ];
  browser._query = "REPORT";
  assert.deepEqual(browser._visibleItems(items).map(item => item.name), ["Report 2.txt", "Report 10.txt"]);
  browser._sort = "modified";
  assert.deepEqual(browser._visibleItems(items).map(item => item.name), ["Report 10.txt", "Report 2.txt"]);
  browser._sort = "size";
  assert.deepEqual(browser._visibleItems(items).map(item => item.size), [200, 10]);
  assert.deepEqual(items.map(item => item.size), [10, 200, 30]);
  browser._query = "missing";
  assert.deepEqual(browser._visibleItems(items), []);
});

test("shared files use the server download URL and never expose delete controls", () => {
  const browser = component();
  browser._mode = "shared";
  const file = { name: "design.pdf", path: "attachment-id", url: "/api/apps/files/channel-attachment?channelId=channel-1&id=attachment-id", size: 12 };

  assert.equal(browser._downloadUrl(file), file.url);
  assert.doesNotMatch(JSON.stringify(browser._renderRows([], [file])), /Delete design\.pdf/);
});

test("shared breadcrumbs show the human channel title instead of the channel id", () => {
  const browser = component();
  browser._mode = "shared";
  browser._path = "channel-id-123";
  browser._sharedChannel = { id: "channel-id-123", name: "Project Alpha" };

  const rendered = JSON.stringify(browser._renderBreadcrumbs());
  assert.match(rendered, /Shared folders/);
  assert.match(rendered, /Project Alpha/);
  assert.doesNotMatch(rendered, /channel-id-123/);
});

test("shared UI wires the optional channel actions and mobile navigation", () => {
  const source = readFileSync(new URL("../package/static/cloud-files.js", import.meta.url), "utf8");

  assert.match(source, /_run\("channel-folders", \{\}\)/);
  assert.match(source, /_run\("channel-browse", \{ channelId \}\)/);
  assert.match(source, /channel-attachments/);
  assert.match(source, /_run\("channel-publish"/);
  assert.match(source, /cf-mobile-shared-nav/);
});

test("multi-file shared upload keeps its original channel while navigation is attempted", async () => {
  const browser = component();
  browser._mode = "shared";
  browser._sharedChannel = { id: "channel-a", name: "Alpha" };
  browser._run = async (action) => action === "channel-publish" ? {} : { path: "channel-a", folders: [], files: [] };
  const originalFetch = globalThis.fetch;
  const requests = [];
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  globalThis.fetch = async (_url, options) => {
    requests.push(options.body.get("channelId"));
    if (requests.length === 1) await gate;
    return { ok: true, status: 200, text: async () => JSON.stringify({ id: `attachment-${requests.length}`, name: "file.txt" }) };
  };
  try {
    const first = new Blob(["a"], { type: "text/plain" });
    const second = new Blob(["b"], { type: "text/plain" });
    Object.defineProperty(first, "name", { value: "a.txt" });
    Object.defineProperty(second, "name", { value: "b.txt" });
    const upload = browser._uploadFiles([first, second]);
    await new Promise(resolve => setImmediate(resolve));
    browser._showSharedRoot();
    assert.equal(browser._mode, "shared");
    release();
    await upload;
    assert.deepEqual(requests, ["channel-a", "channel-a"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("shared folders group conversations under Chat and keep uploads inside conversations", async () => {
  const browser = component();
  browser._sharedAvailable = true;
  browser._sharedFolders = [{ id: "room-1", name: "Design team" }];
  const calls = [];
  browser._run = async (action, body) => {
    calls.push({ action, body });
    return { path: body.channelId, files: [], folders: [] };
  };
  browser._showSharedRoot();
  assert.deepEqual(browser._folders.map(folder => folder.name), ["Chat"]);
  await browser._uploadFiles([{ name: "blocked.txt" }]);
  browser._open(browser._folders[0]);
  assert.equal(browser._mode, "shared-app");
  assert.deepEqual(browser._folders.map(folder => folder.name), ["Design team"]);
  await browser._uploadFiles([{ name: "blocked.txt" }]);
  assert.equal(calls.length, 0);
  await browser._loadSharedFolder(browser._folders[0]);
  assert.deepEqual(calls, [{ action: "channel-browse", body: { channelId: "room-1" } }]);
  const crumbs = JSON.stringify(browser._renderBreadcrumbs());
  assert.match(crumbs, /Shared folders/);
  assert.match(crumbs, /Chat/);
  assert.match(crumbs, /Design team/);
  browser._showSharedApp();
  assert.equal(browser._sharedChannel, null);
  assert.equal(browser._files.length, 0);
});
