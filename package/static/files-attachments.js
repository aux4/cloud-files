// Files owns attachment presentation; Chat retains message and upload lifecycle.
export function register(engine) {
  const { LightElement, html } = engine.base;
  const Chat = engine.getComponentByType('Chat');
  if (!Chat) throw new Error('FilesChat requires the platform Chat component.');

  class FilesTextPreview extends LightElement {
    static properties = { item: { attribute: false }, _text: { state: true }, _error: { state: true } };
    constructor() { super(); this._text = null; this._error = ''; }
    async _load() {
      this._text = null; this._error = ''; this._controller?.abort();
      const controller = this._controller = new AbortController();
      try {
        const url = new URL(this.item.url, location.href);
        if (url.origin !== location.origin) throw Error();
        const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw Error();
        const reader = response.body.getReader(); const chunks = []; let size = 0;
        while (true) { const {value, done} = await reader.read(); if (done) break; size += value.length; if (size > 262144) { await reader.cancel(); throw Error(); } chunks.push(value); }
        const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; }
        const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        if (text.includes('\0')) throw Error();
        if (!controller.signal.aborted) this._text = text.slice(0,16000);
      } catch { if (!controller.signal.aborted) this._error = 'Preview unavailable. Download the file to view it.'; }
    }
    disconnectedCallback() { this._controller?.abort(); super.disconnectedCallback(); }
    _code(text) {
      return text.split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:const|let|var|function|return|import|from|export|class|if|else|true|false|null|def|for|while|await|async)\b|\b\d+(?:\.\d+)?\b)/g).map(token => html`<span style=${/^['"]/.test(token) ? 'color:#067647' : /^\d/.test(token) ? 'color:#b54708' : /^(const|let|var|function|return|import|from|export|class|if|else|true|false|null|def|for|while|await|async)$/.test(token) ? 'color:#6941c6' : ''}>${token}</span>`);
    }
    render() {
      const markdown = /\.(md|markdown)$/i.test(this.item?.name || '');
      return html`<details class="files-text-preview" @toggle=${event => { if (event.target.open) this._load(); else { this._controller?.abort(); this._text = null; } }}><summary>Preview ${this.item?.name}</summary>${this._error ? html`<p role="status">${this._error}</p>` : this._text === null ? html`<p>Loading preview…</p>` : html`<div class="files-text-content">${markdown ? html`<fe-markdown .meta=${{content:this._text}}></fe-markdown>` : html`<pre><code>${this._code(this._text)}</code></pre>`}</div>${this._text.length >= 16000 ? html`<p>Preview limited to 16,000 characters.</p>` : ''}`}</details>`;
    }
  }
  FilesTextPreview.tag = 'files-text-preview'; FilesTextPreview.label = 'FilesTextPreview'; FilesTextPreview.propsSchema = {};

  class FilesAttachmentList extends LightElement {
    static properties = { items: { attribute: false }, draft: { type: Boolean }, _dragging: { state: true } };
    constructor() { super(); this.items = []; this.draft = false; this._dragging = false; }
    _drag(event) {
      if (!this.draft || !Array.from(event.dataTransfer?.types || []).includes('Files')) return;
      event.preventDefault(); event.stopPropagation(); this._dragging = true;
    }
    _dropFiles(event) {
      if (!this.draft) return;
      event.preventDefault(); event.stopPropagation(); this._dragging = false;
      this.dispatchEvent(new CustomEvent('attachment-add', { detail: { files: Array.from(event.dataTransfer?.files || []) }, bubbles: true, composed: true }));
    }
    render() {
      const size = bytes => !Number.isFinite(bytes) ? '' : bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
      return html`<style>
        files-attachment-list{display:block;min-width:0;max-width:100%}
        .files-attachment-list{display:flex;flex-wrap:nowrap;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x proximity;gap:8px;padding:4px 0;margin:0;list-style:none}
        .files-attachment-card{box-sizing:border-box;display:flex;align-items:center;gap:10px;min-width:0;max-width:100%;padding:10px 12px;border:1px solid currentColor;border-color:color-mix(in srgb,currentColor 22%,transparent);border-radius:12px;color:inherit;background:color-mix(in srgb,currentColor 5%,transparent)}
        .files-attachment-card a{display:flex;align-items:center;gap:10px;min-width:0;color:inherit;text-decoration:none}
        .files-attachment-card a:hover .files-attachment-name{text-decoration:underline}
        .files-attachment-details{display:flex;flex-direction:column;gap:3px;min-width:0}
        .files-attachment-name{overflow-wrap:anywhere;font-size:13px;font-weight:500;line-height:1.4}
        .files-attachment-meta{font-size:11px;opacity:.75}
        .files-attachment-preview{width:40px;height:40px;flex:none;object-fit:cover;border-radius:6px}
        .files-attachment-symbol{width:24px;flex:none;text-align:center;font-size:22px}
        .files-attachment-remove{display:grid;place-items:center;flex:none;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:transparent;color:inherit;font-size:22px;cursor:pointer}
        .files-attachment-remove:hover{background:color-mix(in srgb,currentColor 10%,transparent)}
        .files-attachment-card progress{width:100%;height:4px;accent-color:var(--fe-primary,#4f46e5)}
        .files-attachment-error{color:var(--fe-error,#dc2626);font-size:12px}
        files-attachment-list[draft]{width:100%;color:var(--fe-text,#18181b)}
        .files-draft-area{padding:10px 10px 4px;border-radius:18px;transition:background .15s}
        .files-draft-area.is-dragging{background:#eef2ff;outline:2px dashed var(--fe-primary,#4f46e5);outline-offset:-2px}
        .files-draft-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:11px;color:var(--fe-text-muted,#52525b);padding:0 2px 6px}
        .files-add-more,.files-attachment-retry{font:inherit;color:var(--fe-primary,#4f46e5);background:none;border:0;padding:6px;cursor:pointer;font-weight:600}
        files-attachment-list[draft] .files-attachment-card{background:var(--fe-surface,#fff);border:1px solid var(--fe-border,#e4e4e7);box-shadow:0 1px 2px #00000005;padding:10px;flex:0 0 220px}
        files-attachment-list[draft] .files-attachment-details{flex:1}
        files-attachment-list[draft] .files-attachment-list{max-height:200px;overflow-y:auto;overscroll-behavior:contain}
        files-attachment-list[draft] .files-attachment-preview{width:48px;height:48px;border-radius:8px}
        files-chat:has(files-attachment-list[draft]) .fe-chat-input-row{border-radius:22px}

        .files-attachment-card{flex:0 0 auto;scroll-snap-align:start;background:var(--fe-surface,#fff);border-color:var(--fe-border,#e4e4e7)}
        .files-image-card{padding:0;position:relative;width:220px;overflow:hidden;display:block}
        .files-image-card a{display:flex;flex-direction:column;align-items:stretch;gap:0}
        .files-image-card .files-attachment-preview{width:100%;height:170px;border-radius:0;object-fit:cover}
        .files-image-card .files-attachment-details{padding:8px 10px}
        files-attachment-list[draft] .files-image-card{padding:0;flex:0 0 150px;display:block}
        files-attachment-list[draft] .files-image-card .files-attachment-preview{width:150px;height:100px;border-radius:0}
        .files-image-card .files-attachment-remove{position:absolute;top:4px;right:4px;background:white;color:#344054;box-shadow:0 1px 4px #0002}
        .files-text-preview{margin-top:8px;border:1px solid var(--fe-border,#e4e4e7);border-radius:10px;background:var(--fe-surface,#fff);overflow:hidden;font-size:13px}
        .files-text-preview summary{padding:10px 12px;cursor:pointer;font-weight:500;overflow-wrap:anywhere}
        .files-text-content{max-height:300px;overflow:auto;border-top:1px solid var(--fe-border,#e4e4e7);padding:12px}
        .files-text-content pre{margin:0;tab-size:2;font:12px/1.6 ui-monospace,monospace;white-space:pre}
        .files-text-preview p{padding:8px 12px}
      </style><div class=${this.draft ? `files-draft-area ${this._dragging ? 'is-dragging' : ''}` : ''} @dragenter=${event => this._drag(event)} @dragover=${event => this._drag(event)} @dragleave=${event => { if (!event.currentTarget.contains(event.relatedTarget)) this._dragging = false; }} @drop=${event => this._dropFiles(event)}>
      ${this.draft ? html`<div class="files-draft-heading"><span>${this._dragging ? 'Drop files to add' : `${this.items.length} attachment${this.items.length === 1 ? '' : 's'} · Drop more here`}</span><button class="files-add-more" type="button" @click=${() => this.dispatchEvent(new CustomEvent('attachment-pick', { bubbles: true, composed: true }))}>+ Add files</button></div>` : ''}<ul class="files-attachment-list" aria-label=${this.draft ? 'Draft attachments' : 'Attachments'}>
        ${(this.items || []).map(item => {
          const preview = item.previewUrl || item._previewUrl || item.url;
          const image = item.type?.startsWith('image/') && preview && !item._filesImageFailed;
          const contents = html`${image ? html`<img class="files-attachment-preview" src=${preview} alt="" @error=${() => { item._filesImageFailed = true; this.requestUpdate(); }} />` : html`<span class="files-attachment-symbol" aria-hidden="true">▤</span>`}<span class="files-attachment-details"><span class="files-attachment-name">${item.name || 'File'}</span><span class="files-attachment-meta">${size(item.size)}${this.draft ? (item.status === 'uploading' ? ` · Uploading ${item.progress || 0}%` : item.status === 'error' ? '' : ' · Attached') : ''}</span>${this.draft && item.status === 'uploading' ? html`<progress max="100" value=${item.progress || 0} aria-label=${`Uploading ${item.name}`}></progress>` : ''}${this.draft && item.status === 'error' ? html`<span class="files-attachment-error" role="alert">${item.error || 'Upload failed'}</span>` : ''}</span>`;
          return html`<li class=${`files-attachment-card ${image ? "files-image-card" : ""}`}>${!this.draft && item.url ? html`<a href=${item.url} target="_blank" rel="noopener" download=${item.name || ''} aria-label=${`Download ${item.name || 'file'}`}>${contents}</a>` : contents}${this.draft && item.status === 'error' ? html`<button class="files-attachment-retry" type="button" aria-label=${`Retry ${item.name}`} @click=${() => this.dispatchEvent(new CustomEvent('attachment-retry', { detail: { attachment: item }, bubbles: true, composed: true }))}>Retry</button>` : ''}${this.draft ? html`<button class="files-attachment-remove" type="button" aria-label=${`Remove ${item.name}`} @click=${() => this.dispatchEvent(new CustomEvent('attachment-remove', { detail: { attachment: item }, bubbles: true, composed: true }))}>×</button>` : ''}</li>`;
        })}
      </ul>${!this.draft ? this.items.filter(item => item.url && item.size <= 262144 && (/^text\//.test(item.type || '') || /\.(md|markdown|txt|json|js|jsx|ts|tsx|py|css|html|yaml|yml|sh|sql|csv|xml)$/i.test(item.name || ''))).map(item => html`<files-text-preview .item=${item}></files-text-preview>`) : ''}</div>`;
    }
  }
  FilesAttachmentList.tag = 'files-attachment-list';
  FilesAttachmentList.label = 'FilesAttachmentList';
  FilesAttachmentList.propsSchema = {};

  class FilesChat extends Chat {
    static properties = { ...Chat.properties };
    _prop(name) {
      if (name === 'attachments') return true;
      if (name === 'uploadUrl') return `${globalThis.window?.__BASE__ || ''}${super._prop(name) || '/api/apps/files/channel-attachments'}`;
      if (name === 'maxFileSize') return 6291456;
      if (name === 'maxFiles') return 10;
      return super._prop(name);
    }
    _renderMessageAttachments(message) { return message?.attachments?.length ? html`<files-attachment-list .items=${[...message.attachments]}></files-attachment-list>` : ''; }
    _renderPlainAttachments(message) { return this._renderMessageAttachments(message); }
    _retryAttachment(entry) { if (!this._stagedFiles.includes(entry) || entry.status !== 'error') return; entry.status = 'uploading'; entry.error = null; entry.progress = 0; this._startUpload(entry); this.requestUpdate(); }
    _renderAttachTray() { return html`<files-attachment-list draft .draft=${true} .items=${[...this._stagedFiles]} @attachment-remove=${event => this._removeAttachment(event.detail.attachment)} @attachment-add=${event => { this._dragDepth = 0; this._dragOver = false; this._intakeFiles(event.detail.files); }} @attachment-pick=${() => this._openFilePicker()} @attachment-retry=${event => this._retryAttachment(event.detail.attachment)}></files-attachment-list>`; }
    render() { return html`${super.render()}<style>files-chat .fe-chat-input-line{padding-left:0}files-chat .fe-chat-reading-column{max-width:1100px;width:100%}files-chat .fe-chat-log{background:var(--fe-surface,#fff)}</style>`; }
  }
  FilesChat.tag = 'files-chat';
  FilesChat.label = 'FilesChat';
  FilesChat.icon = 'paperclip';
  FilesChat.propsSchema = { ...Chat.propsSchema };
  FilesChat.docs = {description:'Chat with Files-owned attachment lists and channel-scoped storage. Supports local or configured remote Files storage.'};
  engine.registerLibrary({name:'files-attachments',components:[FilesAttachmentList, FilesChat, FilesTextPreview]});
}
export default register;
