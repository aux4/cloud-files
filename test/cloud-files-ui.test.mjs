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
