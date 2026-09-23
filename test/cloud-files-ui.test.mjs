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
