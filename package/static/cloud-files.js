export function register(engine) {
  const { LightElement, html, repeat } = engine.base;

  const icon = name => {
    const paths = {
      upload: html`<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />`,
      folderPlus: html`<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9ZM12 10v6m-3-3h6" />`,
      folder: html`<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z" />`,
      file: html`<path d="M7 3.5h6l4 4V20H7a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Zm6 0v4h4M8.5 12h7M8.5 15.5h5" />`,
      home: html`<path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-5v-7h-4v7H5a2 2 0 0 1-2-2v-9Z" />`,
      chevron: html`<path d="m9 18 6-6-6-6" />`,
      search: html`<circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" />`,
      trash: html`<path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6" />`,
      close: html`<path d="m6 6 12 12M18 6 6 18" />`,
      shield: html`<path d="M12 3 5 6v5c0 4.7 2.9 8.2 7 10 4.1-1.8 7-5.3 7-10V6l-7-3Zm-3 9 2 2 4-4" />`
    };
    return html`<svg class="cf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
  };

  class CloudFilesBrowser extends LightElement {
    static properties = {
      ...LightElement.properties,
      _path: { state: true },
      _folders: { state: true },
      _files: { state: true },
      _loading: { state: true },
      _busy: { state: true },
      _error: { state: true },
      _message: { state: true },
      _messageKind: { state: true },
      _query: { state: true },
      _dialog: { state: true },
      _dragging: { state: true }
    };

    constructor() {
      super();
      this._path = "";
      this._folders = [];
      this._files = [];
      this._loading = true;
      this._busy = false;
      this._error = "";
      this._message = "";
      this._messageKind = "success";
      this._query = "";
      this._dialog = null;
      this._dragging = false;
      this._messageTimer = null;
    }

    connectedCallback() {
      super.connectedCallback();
      this._load();
    }

    disconnectedCallback() {
      clearTimeout(this._messageTimer);
      super.disconnectedCallback();
    }

    async _run(action, stdin) {
      const result = await this.runtime.run(action, { stdin });
      if (result?.error) throw new Error(result.error);
      return result || {};
    }

    _notify(message, kind = "success") {
      clearTimeout(this._messageTimer);
      this._message = message;
      this._messageKind = kind;
      if (message && kind !== "error") {
        this._messageTimer = setTimeout(() => {
          this._message = "";
        }, 4200);
      }
    }

    async _load(path = this._path) {
      if (this._loading && path === this._path && (this._folders.length || this._files.length)) return;
      this._loading = true;
      this._error = "";
      try {
        const result = await this._run("browse", { path });
        this._path = result.path || "";
        this._folders = Array.isArray(result.folders) ? result.folders : [];
        this._files = Array.isArray(result.files) ? result.files : [];
        this._query = "";
      } catch (error) {
        this._error = error.message;
        this._notify(error.message, "error");
      } finally {
        this._loading = false;
      }
    }

    _open(folder) {
      this._load(folder.path);
    }

    _openDialog(dialog) {
      this._dialog = dialog;
      this.updateComplete?.then(() => this.querySelector("[data-dialog-focus]")?.focus());
    }

    _closeDialog() {
      if (!this._busy) this._dialog = null;
    }

    async _createFolder() {
      const input = this.querySelector("[data-folder-name]");
      const name = input?.value?.trim();
      if (!name) {
        input?.focus();
        return;
      }
      this._busy = true;
      try {
        const result = await this._run("create-folder", { path: this._path, name });
        this._dialog = null;
        this._notify(result.message || "Folder created");
        await this._load();
      } catch (error) {
        this._notify(error.message, "error");
      } finally {
        if (input) input.value = "";
        this._busy = false;
      }
    }

    async _uploadFiles(filesValue, input = null) {
      const files = [...(filesValue || [])];
      if (!files.length || this._busy) return;
      this._busy = true;
      this._dragging = false;
      try {
        const form = new FormData();
        form.append("path", this._path);
        for (const file of files) form.append("file", file, file.name);
        const base = typeof window !== "undefined" ? (window.__BASE__ || "") : "";
        const response = await fetch(`${base}/api/apps/files/upload`, { method: "POST", body: form });
        const text = await response.text();
        let result = {};
        try {
          result = text ? JSON.parse(text) : {};
        } catch {
          result = { error: text };
        }
        if (!response.ok || result.error) throw new Error(result.error || `Upload failed (${response.status})`);
        this._notify(result.message || `Uploaded ${files.length} file${files.length === 1 ? "" : "s"}`);
        await this._load();
      } catch (error) {
        this._notify(error.message, "error");
      } finally {
        if (input) input.value = "";
        this._busy = false;
      }
    }

    async _delete(file) {
      this._busy = true;
      try {
        const result = await this._run("delete", { path: file.path });
        this._dialog = null;
        this._notify(result.message || "File deleted");
        await this._load();
      } catch (error) {
        this._notify(error.message, "error");
      } finally {
        this._busy = false;
      }
    }

    _drop(event) {
      event.preventDefault();
      this._uploadFiles(event.dataTransfer?.files);
    }

    _breadcrumbPath(index) {
      const parts = this._path.replace(/\/$/, "").split("/").filter(Boolean);
      return `${parts.slice(0, index + 1).join("/")}/`;
    }

    _shortSegment(segment) {
      return segment.length > 22 ? `${segment.slice(0, 9)}…${segment.slice(-6)}` : segment;
    }

    _formatBytes(value) {
      const bytes = Number(value) || 0;
      if (bytes < 1000) return `${bytes} B`;
      const units = ["KB", "MB", "GB", "TB"];
      let amount = bytes;
      let unit = -1;
      do {
        amount /= 1000;
        unit += 1;
      } while (amount >= 1000 && unit < units.length - 1);
      return `${amount < 10 ? amount.toFixed(1) : Math.round(amount)} ${units[unit]}`;
    }

    _formatDate(value) {
      if (!value) return "—";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "—";
      return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
    }

    _renderBreadcrumbs() {
      const parts = this._path.replace(/\/$/, "").split("/").filter(Boolean);
      return html`
        <nav class="cf-breadcrumbs" aria-label="Folder path">
          <button class="cf-crumb cf-root" type="button" title="My files" @click=${() => this._load("")} ?disabled=${this._loading || !this._path}>
            ${icon("home")}<span>My files</span>
          </button>
          ${repeat(parts, (part, index) => `${index}-${part}`, (part, index) => html`
            <span class="cf-separator">${icon("chevron")}</span>
            <button class="cf-crumb" type="button" title=${part} @click=${() => this._load(this._breadcrumbPath(index))} ?disabled=${this._loading || index === parts.length - 1}>
              ${this._shortSegment(part)}
            </button>
          `)}
        </nav>
      `;
    }

    _renderRows(folders, files) {
      return html`
        ${repeat(folders, item => item.path, item => html`
          <button class="cf-row cf-folder-row" type="button" @click=${() => this._open(item)} ?disabled=${this._loading}>
            <span class="cf-kind cf-folder-icon">${icon("folder")}</span>
            <span class="cf-name"><strong title=${item.name}>${item.name}</strong><span class="cf-mobile-meta">Folder</span></span>
            <span class="cf-size">—</span><span class="cf-modified">—</span><span class="cf-row-action">${icon("chevron")}</span>
          </button>
        `)}
        ${repeat(files, item => item.path, item => html`
          <div class="cf-row">
            <span class="cf-kind cf-file-icon">${icon("file")}</span>
            <span class="cf-name"><strong title=${item.name}>${item.name}</strong><span class="cf-mobile-meta">${this._formatBytes(item.size)} · ${this._formatDate(item.lastModified)}</span></span>
            <span class="cf-size">${this._formatBytes(item.size)}</span><span class="cf-modified">${this._formatDate(item.lastModified)}</span>
            <button class="cf-icon-button cf-delete" type="button" title=${`Delete ${item.name}`} aria-label=${`Delete ${item.name}`} @click=${() => this._openDialog({ type: "delete", file: item })} ?disabled=${this._busy}>${icon("trash")}</button>
          </div>
        `)}
      `;
    }

    _renderDialog() {
      if (!this._dialog) return "";
      const deleting = this._dialog.type === "delete";
      return html`
        <div class="cf-dialog-backdrop" role="presentation" @mousedown=${event => event.target === event.currentTarget && this._closeDialog()} @keydown=${event => event.key === "Escape" && this._closeDialog()}>
          <section class="cf-dialog" role="dialog" aria-modal="true" aria-labelledby="cf-dialog-title">
            <button class="cf-dialog-close" type="button" aria-label="Close" @click=${() => this._closeDialog()} ?disabled=${this._busy}>${icon("close")}</button>
            <div class=${deleting ? "cf-dialog-icon is-danger" : "cf-dialog-icon"}>${icon(deleting ? "trash" : "folderPlus")}</div>
            <h2 id="cf-dialog-title">${deleting ? "Delete file?" : "Create a new folder"}</h2>
            ${deleting ? html`<p><strong>${this._dialog.file.name}</strong> will be permanently deleted. This action cannot be undone.</p>` : html`
              <p>Add a folder inside <strong>${this._path ? `/${this._path}` : "My files"}</strong>.</p>
              <label class="cf-field-label" for="cf-folder-name">Folder name</label>
              <input id="cf-folder-name" data-folder-name data-dialog-focus class="cf-dialog-input" type="text" autocomplete="off" placeholder="e.g. Project documents" @keydown=${event => event.key === "Enter" && this._createFolder()} />
            `}
            <div class="cf-dialog-actions">
              <button class="cf-button cf-button-secondary" type="button" @click=${() => this._closeDialog()} ?disabled=${this._busy}>Cancel</button>
              <button class=${deleting ? "cf-button cf-button-danger" : "cf-button cf-button-primary"} type="button" @click=${() => deleting ? this._delete(this._dialog.file) : this._createFolder()} ?disabled=${this._busy}>${this._busy ? "Working…" : deleting ? "Delete file" : "Create folder"}</button>
            </div>
          </section>
        </div>
      `;
    }

    render() {
      const query = this._query.trim().toLocaleLowerCase();
      const folders = query ? this._folders.filter(item => item.name.toLocaleLowerCase().includes(query)) : this._folders;
      const files = query ? this._files.filter(item => item.name.toLocaleLowerCase().includes(query)) : this._files;
      const hasItems = this._folders.length > 0 || this._files.length > 0;
      const empty = !this._loading && !hasItems && !this._error;
      const noResults = !this._loading && hasItems && !folders.length && !files.length;
      const itemCount = this._folders.length + this._files.length;

      return html`
        <style>${styles}</style>
        <main class="cf-shell">
          <header class="cf-page-header">
            <div><div class="cf-eyebrow">${icon("shield")} Encrypted cloud storage</div><h1>Files</h1><p>Private files available to you and your aux4 apps.</p></div>
            <label class=${`cf-button cf-button-primary cf-upload ${this._busy ? "is-disabled" : ""}`}>
              ${icon("upload")}<span>${this._busy ? "Working…" : "Upload files"}</span>
              <input type="file" multiple hidden ?disabled=${this._busy} @change=${event => this._uploadFiles(event.target.files, event.target)} />
            </label>
          </header>

          <section class=${`cf-card ${this._dragging ? "is-dragging" : ""}`} @dragenter=${event => { event.preventDefault(); this._dragging = true; }} @dragover=${event => event.preventDefault()} @dragleave=${event => { if (!event.currentTarget.contains(event.relatedTarget)) this._dragging = false; }} @drop=${event => this._drop(event)}>
            <div class="cf-drop-overlay"><div>${icon("upload")}<strong>Drop files to upload</strong><span>They will be added to this folder</span></div></div>
            <div class="cf-card-top">${this._renderBreadcrumbs()}<div class="cf-toolbar-actions"><button class="cf-button cf-button-secondary" type="button" @click=${() => this._openDialog({ type: "folder" })} ?disabled=${this._busy}>${icon("folderPlus")}<span>New folder</span></button></div></div>
            <div class="cf-list-tools">
              <label class="cf-search">${icon("search")}<span class="cf-sr-only">Search this folder</span><input type="search" placeholder="Search this folder" .value=${this._query} @input=${event => { this._query = event.target.value; }} /></label>
              <span class="cf-count">${itemCount} item${itemCount === 1 ? "" : "s"}</span>
            </div>
            <div class="cf-list" aria-busy=${this._loading ? "true" : "false"}>
              <div class=${`cf-progress ${this._loading || this._busy ? "is-active" : ""}`}><span></span></div>
              <div class="cf-columns" aria-hidden="true"><span></span><span>Name</span><span>Size</span><span>Modified</span><span></span></div>
              ${this._loading && !hasItems ? html`<div class="cf-skeleton" aria-label="Loading files">${[1, 2, 3].map(() => html`<div class="cf-skeleton-row"><i></i><span></span><em></em></div>`)}</div>`
                : this._error && !hasItems ? html`<div class="cf-state cf-error-state"><div class="cf-state-icon">!</div><h2>Files could not be loaded</h2><p>${this._error}</p><button class="cf-button cf-button-secondary" type="button" @click=${() => this._load()}>Try again</button></div>`
                : empty ? html`<div class="cf-state"><div class="cf-empty-icon">${icon("folder")}</div><h2>This folder is empty</h2><p>Upload files or create a folder to get started.</p></div>`
                : noResults ? html`<div class="cf-state"><div class="cf-empty-icon">${icon("search")}</div><h2>No matching files</h2><p>Try a different search.</p></div>`
                : this._renderRows(folders, files)}
            </div>
          </section>
          ${this._message ? html`<div class=${`cf-toast ${this._messageKind === "error" ? "is-error" : ""}`} role=${this._messageKind === "error" ? "alert" : "status"}><span>${this._message}</span><button type="button" aria-label="Dismiss" @click=${() => { this._message = ""; }}>${icon("close")}</button></div>` : ""}
          ${this._renderDialog()}
        </main>
      `;
    }
  }

  const styles = `
    .cf-shell{--cf-primary:#4f46e5;--cf-primary-hover:#4338ca;--cf-text:#111827;--cf-muted:#667085;--cf-border:#e4e7ec;--cf-surface:#fff;max-width:1080px;margin:0 auto;padding:36px 24px 72px;color:var(--fe-text,var(--cf-text));font-family:Inter,Roboto,system-ui,-apple-system,sans-serif;box-sizing:border-box}
    .cf-shell *{box-sizing:border-box}.cf-svg{width:20px;height:20px;display:block;flex:none}.cf-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    .cf-page-header{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:28px}.cf-page-header h1{font-size:36px;letter-spacing:-.035em;line-height:1.1;margin:5px 0 8px;font-weight:720;color:var(--cf-text)}.cf-page-header p{font-size:15px;line-height:1.55;color:var(--cf-muted);margin:0}.cf-eyebrow{display:flex;align-items:center;gap:7px;color:var(--cf-primary);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.065em}.cf-eyebrow .cf-svg{width:17px;height:17px}
    .cf-button{min-height:40px;border:1px solid transparent;border-radius:9px;padding:9px 14px;display:inline-flex;align-items:center;justify-content:center;gap:8px;font:600 14px/1.2 inherit;white-space:nowrap;cursor:pointer;transition:background .15s,border-color .15s,color .15s,box-shadow .15s}.cf-button:focus-visible,.cf-crumb:focus-visible,.cf-icon-button:focus-visible,.cf-folder-row:focus-visible{outline:3px solid rgba(79,70,229,.22);outline-offset:2px}.cf-button:disabled,.cf-button.is-disabled{opacity:.55;cursor:not-allowed}.cf-button-primary{background:var(--cf-primary);color:#fff;box-shadow:0 1px 2px rgba(16,24,40,.08)}.cf-button-primary:not(:disabled):hover{background:var(--cf-primary-hover)}.cf-button-secondary{background:#fff;color:#344054;border-color:#d0d5dd;box-shadow:0 1px 2px rgba(16,24,40,.04)}.cf-button-secondary:not(:disabled):hover{background:#f9fafb;border-color:#b9c0ca}.cf-button-danger{background:#d92d20;color:#fff}.cf-button-danger:not(:disabled):hover{background:#b42318}.cf-upload{min-height:44px;padding-inline:17px}
    .cf-card{position:relative;background:var(--cf-surface);border:1px solid var(--cf-border);border-radius:14px;box-shadow:0 1px 3px rgba(16,24,40,.06),0 1px 2px rgba(16,24,40,.03);overflow:hidden}.cf-card-top{min-height:68px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:18px;border-bottom:1px solid var(--cf-border)}
    .cf-breadcrumbs{display:flex;align-items:center;min-width:0;overflow-x:auto;scrollbar-width:none;padding:3px}.cf-breadcrumbs::-webkit-scrollbar{display:none}.cf-crumb{border:0;background:transparent;color:#475467;font:600 13px/1.2 inherit;padding:7px 5px;border-radius:6px;white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis;cursor:pointer}.cf-crumb:not(:disabled):hover{background:#f2f4f7;color:var(--cf-text)}.cf-crumb:disabled{color:var(--cf-text);cursor:default}.cf-root{display:flex;align-items:center;gap:6px}.cf-root .cf-svg{width:17px;height:17px}.cf-separator{color:#98a2b3}.cf-separator .cf-svg{width:14px;height:14px}.cf-toolbar-actions{display:flex;align-items:center;gap:8px;flex:none}
    .cf-list-tools{height:58px;padding:10px 18px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid var(--cf-border)}.cf-search{height:38px;max-width:320px;flex:1;display:flex;align-items:center;gap:9px;padding:0 11px;border:1px solid #d0d5dd;border-radius:8px;background:#fff;color:#667085}.cf-search:focus-within{border-color:#8178f2;box-shadow:0 0 0 3px rgba(79,70,229,.12)}.cf-search .cf-svg{width:18px;height:18px}.cf-search input{width:100%;border:0;outline:0;background:transparent;font:400 14px inherit;color:var(--cf-text)}.cf-search input::placeholder{color:#98a2b3}.cf-count{font-size:12px;color:#667085;white-space:nowrap}
    .cf-list{position:relative;min-height:270px}.cf-progress{position:absolute;z-index:4;top:0;left:0;right:0;height:2px;overflow:hidden;pointer-events:none}.cf-progress span{display:none;height:100%;width:35%;background:var(--cf-primary);animation:cf-progress 1.05s ease-in-out infinite}.cf-progress.is-active span{display:block}@keyframes cf-progress{0%{transform:translateX(-110%)}100%{transform:translateX(400%)}}
    .cf-columns,.cf-row{display:grid;grid-template-columns:38px minmax(180px,1fr) 100px 190px 40px;gap:12px;align-items:center}.cf-columns{height:42px;padding:0 18px;background:#f9fafb;border-bottom:1px solid var(--cf-border);font-size:11px;font-weight:650;color:#667085;text-transform:uppercase;letter-spacing:.055em}.cf-row{min-height:68px;padding:10px 18px;border-bottom:1px solid #eef0f3;color:var(--cf-text)}.cf-row:last-child{border-bottom:0}.cf-folder-row{width:100%;border-top:0;border-left:0;border-right:0;background:#fff;text-align:left;font:inherit;cursor:pointer}.cf-folder-row:not(:disabled):hover,.cf-row:not(.cf-folder-row):hover{background:#fafaff}.cf-folder-row:disabled{cursor:wait}.cf-kind{width:34px;height:34px;border-radius:8px;display:grid;place-items:center}.cf-kind .cf-svg{width:19px;height:19px}.cf-folder-icon{background:#eef2ff;color:#4f46e5}.cf-file-icon{background:#f2f4f7;color:#667085}.cf-name{display:block;min-width:0}.cf-name strong{display:block;font-size:14px;font-weight:620;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cf-size,.cf-modified{font-size:13px;color:#667085}.cf-mobile-meta{display:none;margin-top:3px;font-size:12px;font-weight:400;color:#667085;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cf-row-action{justify-self:center;color:#98a2b3}.cf-row-action .cf-svg{width:17px;height:17px}.cf-icon-button{width:34px;height:34px;padding:7px;border:0;border-radius:7px;background:transparent;color:#667085;cursor:pointer}.cf-icon-button:hover{background:#f2f4f7;color:#344054}.cf-delete:hover{background:#fef3f2;color:#b42318}.cf-icon-button:disabled{opacity:.45;cursor:not-allowed}
    .cf-state{min-height:226px;padding:40px 20px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.cf-state h2{margin:15px 0 5px;font-size:16px;color:var(--cf-text)}.cf-state p{margin:0 0 18px;color:#667085;font-size:13px}.cf-empty-icon,.cf-state-icon{width:48px;height:48px;border-radius:12px;background:#f2f4f7;color:#667085;display:grid;place-items:center}.cf-empty-icon .cf-svg{width:23px;height:23px}.cf-error-state .cf-state-icon{background:#fef3f2;color:#b42318;font-weight:800}.cf-skeleton{padding:4px 18px}.cf-skeleton-row{height:68px;display:grid;grid-template-columns:38px minmax(120px,1fr) 90px;gap:12px;align-items:center;border-bottom:1px solid #eef0f3}.cf-skeleton-row i,.cf-skeleton-row span,.cf-skeleton-row em{display:block;background:linear-gradient(90deg,#f2f4f7 25%,#e9ecf0 37%,#f2f4f7 63%);background-size:400% 100%;animation:cf-shimmer 1.3s ease infinite;border-radius:7px}.cf-skeleton-row i{width:34px;height:34px}.cf-skeleton-row span{height:13px;max-width:340px}.cf-skeleton-row em{height:11px;width:72px}@keyframes cf-shimmer{0%{background-position:100% 0}100%{background-position:0 0}}
    .cf-drop-overlay{position:absolute;z-index:8;inset:0;background:rgba(238,242,255,.94);border:2px dashed #7067e8;display:none;place-items:center;color:#3730a3;text-align:center}.cf-card.is-dragging .cf-drop-overlay{display:grid}.cf-drop-overlay>div{display:flex;flex-direction:column;align-items:center;gap:7px}.cf-drop-overlay .cf-svg{width:32px;height:32px}.cf-drop-overlay span{font-size:13px;color:#6366a5}
    .cf-toast{position:fixed;z-index:30;top:92px;right:20px;max-width:min(390px,calc(100vw - 32px));display:flex;align-items:center;gap:14px;padding:13px 14px 13px 16px;border:1px solid #abefc6;border-radius:10px;background:#ecfdf3;color:#067647;box-shadow:0 12px 32px rgba(16,24,40,.16);font-size:14px;font-weight:550}.cf-toast.is-error{border-color:#fecdca;background:#fef3f2;color:#b42318}.cf-toast button{border:0;background:transparent;color:inherit;padding:2px;cursor:pointer}.cf-toast .cf-svg{width:17px;height:17px}
    .cf-dialog-backdrop{position:fixed;z-index:40;inset:0;background:rgba(17,24,39,.46);display:grid;place-items:center;padding:20px;backdrop-filter:blur(2px)}.cf-dialog{position:relative;width:min(440px,100%);border-radius:14px;background:#fff;padding:26px;box-shadow:0 24px 60px rgba(16,24,40,.24)}.cf-dialog-close{position:absolute;right:16px;top:16px;border:0;background:transparent;color:#667085;padding:5px;border-radius:6px;cursor:pointer}.cf-dialog-close:hover{background:#f2f4f7}.cf-dialog-close .cf-svg{width:19px;height:19px}.cf-dialog-icon{width:44px;height:44px;border-radius:11px;background:#eef2ff;color:#4f46e5;display:grid;place-items:center;margin-bottom:18px}.cf-dialog-icon.is-danger{background:#fef3f2;color:#d92d20}.cf-dialog h2{font-size:19px;letter-spacing:-.015em;margin:0 32px 8px 0;color:var(--cf-text)}.cf-dialog p{font-size:14px;line-height:1.55;color:#667085;margin:0 0 20px;overflow-wrap:anywhere}.cf-field-label{display:block;font-size:13px;font-weight:600;color:#344054;margin:0 0 6px}.cf-dialog-input{width:100%;height:42px;border:1px solid #d0d5dd;border-radius:8px;padding:0 12px;font:400 14px inherit;outline:0}.cf-dialog-input:focus{border-color:#8178f2;box-shadow:0 0 0 3px rgba(79,70,229,.12)}.cf-dialog-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:24px}
    @media(max-width:720px){.cf-shell{padding:24px 16px 64px}.cf-page-header{align-items:flex-start;margin-bottom:20px}.cf-page-header h1{font-size:31px}.cf-page-header p{font-size:14px}.cf-upload span{display:none}.cf-upload{width:44px;padding:10px}.cf-card{border-radius:12px}.cf-card-top{padding:12px 13px;gap:10px}.cf-toolbar-actions .cf-button span{display:none}.cf-toolbar-actions .cf-button{width:40px;padding:8px}.cf-crumb{max-width:122px}.cf-root span{display:none}.cf-list-tools{height:56px;padding:9px 13px}.cf-search{max-width:none}.cf-columns{display:none}.cf-row{grid-template-columns:36px minmax(0,1fr) 36px;gap:10px;min-height:70px;padding:10px 13px}.cf-size,.cf-modified{display:none}.cf-mobile-meta{display:block}.cf-skeleton{padding:4px 13px}.cf-skeleton-row{grid-template-columns:36px minmax(100px,1fr);height:70px}.cf-skeleton-row em{display:none}.cf-toast{top:auto;bottom:92px;left:16px;right:16px;max-width:none}.cf-dialog{padding:22px}.cf-dialog-actions{display:grid;grid-template-columns:1fr 1fr}.cf-dialog-actions .cf-button{width:100%}}
    @media(max-width:440px){.cf-page-header p{max-width:245px}.cf-count{display:none}.cf-dialog-actions{grid-template-columns:1fr}.cf-dialog-actions .cf-button-primary,.cf-dialog-actions .cf-button-danger{grid-row:1}.cf-dialog-actions .cf-button-secondary{grid-row:2}}
    @media(prefers-reduced-motion:reduce){.cf-progress span,.cf-skeleton-row>*{animation:none}.cf-button{transition:none}}
  `;

  CloudFilesBrowser.tag = "cloud-files-browser";
  CloudFilesBrowser.label = "CloudFilesBrowser";
  CloudFilesBrowser.icon = "folder";
  CloudFilesBrowser.color = "#4f46e5";
  CloudFilesBrowser.template = true;
  CloudFilesBrowser.propsSchema = {};

  engine.registerLibrary({ name: "cloud-files", components: [CloudFilesBrowser] });
}

export default register;
