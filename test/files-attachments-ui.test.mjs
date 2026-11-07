import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from '../package/static/files-attachments.js';

function setup() {
  let components;
  class LightElement { requestUpdate() {} }
  class Chat extends LightElement { _prop() {} _syncFromScope() { this._pinCanonicalUpdate = this._seededFrom !== undefined; this._seededFrom = []; } render() { return 'chat'; } }
  const html = (strings, ...values) => ({ strings: [...strings], values });
  register({ base: { LightElement, html }, getComponentByType: () => Chat, registerLibrary: library => { components = library.components; } });
  return components;
}

test('Files registers a reusable list and plugs it into sent and draft attachments', () => {
  const [List, Chat] = setup();
  assert.equal(List.tag, 'files-attachment-list');
  const chat = new Chat();
  const file = { id: '1', name: 'Notes.pdf', size: 2048, url: '/download', status: 'ready' };
  chat._stagedFiles = [file];
  const sent = chat._renderMessageAttachments({ attachments: [file] });
  assert.match(sent.strings.join(''), /files-attachment-list/);
  assert.deepEqual(sent.values[0], [file]);
  const draft = chat._renderAttachTray();
  let removed;
  chat._removeAttachment = item => { removed = item; };
  draft.values[2]({ detail: { attachment: file } });
  assert.equal(removed, file);
  const list = new List();
  list.items = [file];
  assert.match(JSON.stringify(list.render()), /Download Notes.pdf/);
  list.draft = true;
  file.status = 'uploading'; file.progress = 35;
  assert.match(JSON.stringify(list.render()), /Uploading 35%/);
  file.status = 'error'; file.error = 'Upload failed';
  assert.match(JSON.stringify(list.render()), /Upload failed/);
});

test('draft drop adds files and retries only failed entries', () => {
  const [List, Chat] = setup();
  const list = new List(); list.draft = true;
  let dispatched;
  list.dispatchEvent = event => { dispatched = event; };
  const file = { name: 'more.jpg' };
  list._dropFiles({ preventDefault() {}, stopPropagation() {}, dataTransfer: { files: [file] } });
  assert.equal(dispatched.type, 'attachment-add');
  assert.deepEqual(dispatched.detail.files, [file]);
  const chat = new Chat();
  const entry = { status: 'error', error: 'Upload failed', progress: 100 };
  chat._stagedFiles = [entry];
  let uploads = 0; chat._startUpload = () => { uploads++; };
  chat._retryAttachment(entry); chat._retryAttachment(entry);
  assert.equal(uploads, 1);
  assert.equal(entry.status, 'uploading');
  assert.equal(entry.error, null);
});

test('text previews use authenticated bounded downloads and escape code tokens', async () => {
  const Preview = setup()[2];
  const preview = new Preview();
  const originalFetch = globalThis.fetch;
  const originalLocation = globalThis.location;
  globalThis.location = { href: 'http://localhost/chat', origin: 'http://localhost' };
  let requested;
  globalThis.fetch = async (_url, options) => {
    requested = options;
    return new Response('const title = "<script>";');
  };
  try {
    preview.item = { name: 'example.js', url: '/download' };
    await preview._load();
    assert.equal(preview._text, 'const title = "<script>";');
    assert.equal(requested.credentials, 'same-origin');
    assert.equal(requested.cache, 'no-store');
    const tokens = preview._code(preview._text);
    assert.ok(tokens.some(token => token.values.includes('"<script>"')));
    assert.ok(tokens.some(token => token.values.includes('color:#6941c6')));
    globalThis.fetch = async () => new Response('x'.repeat(262145));
    await preview._load();
    assert.match(preview._error, /unavailable/);
    globalThis.fetch = async () => new Response('denied', {status:403});
    await preview._load();
    assert.equal(preview._text, null);
    assert.match(preview._error, /unavailable/);
    preview.item.url = 'https://other.example/file';
    globalThis.fetch = () => { throw new Error('must not fetch'); };
    await preview._load();
    assert.match(preview._error, /unavailable/);
  } finally { globalThis.fetch = originalFetch; globalThis.location = originalLocation; }
});


test('reaction polls do not force the reader to the newest message', () => {
  const Chat = setup()[1];
  const chat = new Chat();
  chat._syncFromScope();
  assert.equal(chat._pinCanonicalUpdate, false);
  chat._nearBottom = false;
  chat._syncFromScope();
  assert.equal(chat._pinCanonicalUpdate, false);
  assert.equal(chat._nearBottom, false);
});
