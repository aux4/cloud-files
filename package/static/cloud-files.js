export function register(engine) {
  const { LightElement, html, repeat } = engine.base;

  // Keep each SVG path in the same template as its <svg> root. Nested html
  // templates inside an SVG are created in the HTML namespace by Lit and are
  // dropped by some browsers, which leaves icon-only controls as empty boxes.
  const icon = name => {
    switch (name) {
      case "upload": return html`<svg class="cf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></svg>`;
      case "folderPlus": return html`<svg class="cf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9ZM12 10v6m-3-3h6" /></svg>`;
      case "folder": return html`<svg class="cf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z" /></svg>`;
      case "file": return html`<svg class="cf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3.5h6l4 4V20H7a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Zm6 0v4h4M8.5 12h7M8.5 15.5h5" /></svg>`;
      case "document": return html`<svg class="cf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3.5h6l4 4V20H7a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Zm6 0v4h4M8.5 11.5h5M8.5 15h7" /></svg>`;
      case "image": return html`<svg class="cf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="9" r="1.5" /><path d="m5.5 17 4-4 3 3 2-2 4 3" /></svg>`;
      case "sheet": return html`<svg class="cf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M4 9h16M10 9v12m-6-6h16" /></svg>`;
      case "archive": return html`<svg class="cf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16v13H4V7Zm-1-4h18v4H3V3Zm7 8h4" /></svg>`;
      case "audio": return html`<svg class="cf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V6l10-2v12M9 9l10-2" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></svg>`;
      case "video": return html`<svg class="cf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m10 9 5 3-5 3V9Z" /></svg>`;
      case "code": return html`<svg class="cf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 9-3 3 3 3m8-6 3 3-3 3m-3-9-2 12" /></svg>`;
      case "download": return html`<svg class="cf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" /></svg>`;
      case "home": return html`<svg class="cf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-5v-7h-4v7H5a2 2 0 0 1-2-2v-9Z" /></svg>`;
      case "chevron": return html`<svg class="cf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>`;
      case "search": return html`<svg class="cf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg>`;
      case "trash": return html`<svg class="cf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6" /></svg>`;
      case "close": return html`<svg class="cf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>`;
      case "shield": return html`<svg class="cf-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 5 6v5c0 4.7 2.9 8.2 7 10 4.1-1.8 7-5.3 7-10V6l-7-3Zm-3 9 2 2 4-4" /></svg>`;
      default: return "";
    }
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
      _dragging: { state: true },
      _rootFolders: { state: true },
      _sharedAvailable: { state: true },
      _sharedFolders: { state: true },
      _mode: { state: true },
      _sharedChannel: { state: true },
      _view: { state: true },
      _sort: { state: true }
    };

    constructor() {
      super();
      this._path = "";
      this._rootFolders = [];
      this._sharedAvailable = false;
      this._sharedFolders = [];
      this._mode = "personal";
      this._sharedChannel = null;
      this._view = "list";
      this._sort = "name";
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
      this._loadSharedFolders();
    }

    disconnectedCallback() {
      clearTimeout(this._messageTimer);
      super.disconnectedCallback();
    }

    updated(changedProperties) {
      super.updated(changedProperties);
      if (changedProperties.has("_path")) this._scrollBreadcrumbsToEnd();
    }

    _scrollBreadcrumbsToEnd() {
      const breadcrumbs = this.querySelector(".cf-breadcrumbs");
      if (breadcrumbs) breadcrumbs.scrollLeft = breadcrumbs.scrollWidth;
    }

    async _run(action, stdin) {
      const result = await this.runtime.run(action, { stdin });
      if (result?.error) throw new Error(result.error);
      return result || {};
    }

    async _loadSharedFolders() {
      try {
        const result = await this._run("channel-folders", {});
        this._sharedAvailable = result.available === true;
        this._sharedFolders = this._sharedAvailable && Array.isArray(result.folders) ? result.folders.filter(folder => folder && (folder.id || folder.path) && folder.name) : [];
      } catch {
        this._sharedAvailable = false;
        this._sharedFolders = [];
      }
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
        if (!this._path) this._rootFolders = [...this._folders];
        this._files = Array.isArray(result.files) ? result.files : [];
        this._query = "";
      } catch (error) {
        this._error = error.message;
        this._folders = [];
        this._files = [];
        this._notify(error.message, "error");
      } finally {
        this._loading = false;
      }
    }

    async _loadSharedFolder(folder, { force = false } = {}) {
      if (!folder || (this._busy && !force)) return;
      const channelId = folder.id || folder.path;
      this._loading = true;
      this._error = "";
      try {
        const result = await this._run("channel-browse", { channelId });
        this._mode = "shared";
        this._sharedChannel = { ...folder, id: channelId };
        this._path = result.path || channelId;
        this._folders = Array.isArray(result.folders) ? result.folders : [];
        this._files = Array.isArray(result.files) ? result.files.map(file => ({ ...file, _shared: true })) : [];
        this._query = "";
      } catch (error) {
        this._error = error.message;
        this._folders = [];
        this._files = [];
        this._notify(error.message, "error");
      } finally {
        this._loading = false;
      }
    }

    _showPersonal() {
      if (this._busy) return;
      this._mode = "personal";
      this._sharedChannel = null;
      this._load("");
    }

    _openPersonalFolder(folder) {
      if (!folder || this._busy) return;
      this._mode = "personal";
      this._sharedChannel = null;
      this._load(folder.path);
    }

    _showSharedRoot() {
      if (this._busy) return;
      this._mode = "shared-root";
      this._sharedChannel = null;
      this._path = "";
      this._folders = this._sharedAvailable ? [{ id: "chat", path: "chat/", name: "Chat", type: "folder" }] : [];
      this._files = [];
      this._query = "";
      this._error = "";
    }

    _showSharedApp() {
      if (this._busy) return;
      this._mode = "shared-app";
      this._sharedChannel = null;
      this._path = "chat/";
      this._folders = this._sharedFolders.slice();
      this._files = [];
      this._query = "";
      this._error = "";
    }

    _open(folder) {
      if (this._busy) return;
      if (this._mode === "shared-root") this._showSharedApp();
      else if (this._mode === "shared-app") this._loadSharedFolder(folder);
      else this._load(folder.path);
    }

    _openDialog(dialog) {
      this._dialog = dialog;
      this.updateComplete?.then(() => this.querySelector("[data-dialog-focus]")?.focus());
    }

    _closeDialog() {
      if (!this._busy) this._dialog = null;
    }

    async _createFolder() {
      if (this._mode !== "personal") return;
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
      if (!files.length || this._busy || ["shared-root", "shared-app"].includes(this._mode)) return;
      const uploadMode = this._mode;
      const targetChannel = uploadMode === "shared" && this._sharedChannel ? { ...this._sharedChannel } : null;
      this._busy = true;
      this._dragging = false;
      try {
        if (uploadMode === "shared" && targetChannel?.id) {
          for (const file of files) {
            const form = new FormData();
            form.append("channelId", targetChannel.id);
            form.append("file", file, file.name);
            const base = typeof window !== "undefined" ? (window.__BASE__ || "") : "";
            const response = await fetch(`${base}/api/apps/files/channel-attachments`, { method: "POST", body: form });
            const text = await response.text();
            let result = {};
            try { result = text ? JSON.parse(text) : {}; } catch { result = { error: text }; }
            if (!response.ok || result.error) throw new Error(result.error || `Upload failed (${response.status})`);
            const ref = result.ref || result.attachment || result;
            await this._run("channel-publish", {
              channelId: targetChannel.id,
              attachments: [ref],
              clientMessageId: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
            });
          }
          this._notify(`Uploaded ${files.length} file${files.length === 1 ? "" : "s"} to ${targetChannel.name}`);
          await this._loadSharedFolder(targetChannel, { force: true });
          return;
        }
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

    _fileKind(name) {
      const extension = String(name || "").toLocaleLowerCase().split(".").pop();
      const groups = {
        image: ["avif", "bmp", "gif", "heic", "jpeg", "jpg", "png", "svg", "tif", "tiff", "webp"],
        sheet: ["csv", "numbers", "ods", "tsv", "xls", "xlsx"],
        archive: ["7z", "bz2", "gz", "rar", "tar", "tgz", "xz", "zip"],
        audio: ["aac", "flac", "m4a", "mp3", "ogg", "wav", "wma"],
        video: ["avi", "m4v", "mkv", "mov", "mp4", "mpeg", "mpg", "webm"],
        code: ["bash", "c", "cc", "cpp", "css", "go", "h", "html", "java", "js", "json", "jsx", "mjs", "py", "rb", "rs", "scss", "sh", "sql", "ts", "tsx", "xml", "yaml", "yml", "zsh"],
        document: ["doc", "docx", "log", "md", "odt", "pages", "pdf", "rtf", "txt"]
      };
      const kind = Object.entries(groups).find(([, extensions]) => extensions.includes(extension))?.[0] || "file";
      return { icon: kind, label: kind === "file" ? "File" : `${kind[0].toUpperCase()}${kind.slice(1)} file`, className: `is-${kind}` };
    }

    _downloadUrl(file) {
      if (this._mode === "shared" || file?._shared) return file.url || "#";
      const base = typeof window !== "undefined" ? (window.__BASE__ || "") : "";
      return `${base}/api/apps/files/download?path=${encodeURIComponent(file.path)}`;
    }

    _renderBreadcrumbs() {
      if (this._mode !== "personal") return html`
        <nav class="cf-breadcrumbs" aria-label="Folder path">
          <button class="cf-crumb cf-root" type="button" title="Shared folders" @click=${() => this._showSharedRoot()} ?disabled=${this._loading || this._mode === "shared-root"}>${icon("folder")}<span>Shared folders</span></button>
          ${this._mode !== "shared-root" ? html`<span class="cf-separator">${icon("chevron")}</span><button class="cf-crumb" type="button" title="Chat" @click=${() => this._showSharedApp()} ?disabled=${this._loading || this._mode === "shared-app"}>Chat</button>` : ""}
          ${this._mode === "shared" ? html`<span class="cf-separator">${icon("chevron")}</span><button class="cf-crumb" type="button" title=${this._sharedChannel?.name || "Channel"} disabled>${this._sharedChannel?.name || "Channel"}</button>` : ""}
        </nav>
      `;
      const parts = this._path.replace(/\/$/, "").split("/").filter(Boolean);
      return html`
        <nav class="cf-breadcrumbs" aria-label="Folder path">
          <button class="cf-crumb cf-root" type="button" title="My files" @click=${() => this._load("")} ?disabled=${this._loading || !this._path}>
            ${icon("home")}<span>My files</span>
          </button>
          ${repeat(parts, (part, index) => `${index}-${part}`, (part, index) => html`
            <span class="cf-separator">${icon("chevron")}</span>
            <button class="cf-crumb" type="button" title=${part} @click=${() => this._load(this._breadcrumbPath(index))} ?disabled=${this._loading || index === parts.length - 1}>
              ${part}
            </button>
          `)}
        </nav>
      `;
    }

    _renderRows(folders, files) {
      return html`
        ${repeat(folders, item => item.path, item => html`
          <button class="cf-row cf-folder-row" type="button" aria-label=${`Open ${item.name}`} @click=${() => this._open(item)} ?disabled=${this._loading}>
            <span class="cf-kind cf-folder-icon">${icon("folder")}</span>
            <span class="cf-name"><strong title=${item.name}>${item.name}</strong><span class="cf-mobile-meta">Folder</span></span>
            <span class="cf-size">—</span><span class="cf-modified">—</span><span class="cf-row-action">${icon("chevron")}</span>
          </button>
        `)}
        ${repeat(files, item => item.path, item => {
          const kind = this._fileKind(item.name);
          return html`<div class="cf-row">
            <span class=${`cf-kind cf-file-icon ${kind.className}`} title=${kind.label}>${icon(kind.icon)}</span>
            <span class="cf-name"><strong title=${item.name}>${item.name}</strong><span class="cf-mobile-meta">${this._formatBytes(item.size)} · ${this._formatDate(item.lastModified)}</span></span>
            <span class="cf-size">${this._formatBytes(item.size)}</span><span class="cf-modified">${this._formatDate(item.lastModified)}</span>
            <span class="cf-file-actions">
              <a class="cf-icon-button cf-download" href=${this._downloadUrl(item)} download=${item.name} title=${`Download ${item.name}`} aria-label=${`Download ${item.name}`}>${icon("download")}</a>
              ${this._mode !== "shared" && !item._shared ? html`<button class="cf-icon-button cf-delete" type="button" title=${`Delete ${item.name}`} aria-label=${`Delete ${item.name}`} @click=${() => this._openDialog({ type: "delete", file: item })} ?disabled=${this._busy}>${icon("trash")}</button>` : ""}
            </span>
          </div>`;
        })}
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

    _visibleItems(items) {
      const query = this._query.trim().toLocaleLowerCase();
      return items.filter(item => !query || item.name.toLocaleLowerCase().includes(query)).slice().sort((a, b) => {
        if (this._sort === "modified") return (Date.parse(b.lastModified) || 0) - (Date.parse(a.lastModified) || 0) || a.name.localeCompare(b.name);
        if (this._sort === "size") return (Number(b.size) || 0) - (Number(a.size) || 0) || a.name.localeCompare(b.name);
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
      });
    }

    render() {
      const query = this._query.trim().toLocaleLowerCase();
      const folders = this._visibleItems(this._folders);
      const files = this._visibleItems(this._files);
      const hasItems = this._folders.length > 0 || this._files.length > 0;
      const empty = !this._loading && !hasItems && !this._error;
      const noResults = !this._loading && hasItems && !folders.length && !files.length;
      const itemCount = this._folders.length + this._files.length;
      const shared = this._mode !== "personal";
      const sharedApp = this._mode === "shared-app";
      const sharedRoot = this._mode === "shared-root";

      return html`
        <style>${styles}</style>
        <main class="cf-shell">
          <aside class="cf-sidebar" aria-label="File navigation">
            <div class="cf-brand">${icon("folder")}<span>Files</span></div>
            <button class=${`cf-nav-item ${this._mode === "personal" && !this._path ? "is-active" : ""}`} @click=${() => this._showPersonal()} ?disabled=${this._loading}>${icon("home")}<span>All files</span></button>
            ${this._sharedAvailable ? html`<button class=${`cf-nav-item ${shared ? "is-active" : ""}`} @click=${() => this._showSharedRoot()} ?disabled=${this._loading}>${icon("shield")}<span>Shared folders</span></button>` : ""}
            <div class="cf-nav-heading">FOLDERS</div>
            <nav class="cf-folder-nav" aria-label="Folders">
              ${repeat(this._rootFolders.slice().sort((a,b) => a.name.localeCompare(b.name)), folder => folder.path, folder => html`<button class=${`cf-nav-item ${this._mode === "personal" && this._path.startsWith(folder.path) ? "is-active" : ""}`} @click=${() => this._openPersonalFolder(folder)} ?disabled=${this._loading || this._busy}>${icon("folder")}<span>${folder.name}</span></button>`)}
            </nav>
            <div class="cf-sidebar-note">${this._sharedAvailable ? "Shared access" : "Your files, organized."}<span>${this._sharedAvailable ? "Membership is managed in Chat." : "One place for your work."}</span></div>
          </aside>
          <div class="cf-workspace">
          <header class="cf-page-header">
            <div><div class="cf-eyebrow">${sharedRoot || sharedApp ? "SHARED FOLDERS" : shared ? "SHARED CHANNEL" : "MY WORKSPACE"}</div><h1>${sharedRoot ? "Shared folders" : sharedApp ? "Chat" : shared ? (this._sharedChannel?.name || "Channel") : (this._path.split("/").filter(Boolean).pop() || "All files")}</h1><p>${sharedRoot ? "Browse shared files by app." : sharedApp ? "Files from your channels and direct conversations." : shared ? "Membership and access are managed in Chat." : this._path ? "Files and folders in this location." : "Browse and manage your files."}</p></div>
            <div class="cf-header-actions">
              ${this._sharedAvailable ? html`<button class="cf-button cf-button-secondary cf-mobile-shared-nav" type="button" @click=${() => shared ? this._showPersonal() : this._showSharedRoot()} ?disabled=${this._loading || this._busy}>${icon(shared ? "home" : "shield")}<span>${shared ? "My files" : "Shared folders"}</span></button>` : ""}
              ${!shared ? html`<button class="cf-button cf-button-secondary" type="button" @click=${() => this._openDialog({ type: "folder" })} ?disabled=${this._busy}>${icon("folderPlus")}<span>New folder</span></button>` : ""}
              ${!sharedRoot && !sharedApp ? html`<button class="cf-button cf-button-primary" type="button" @click=${() => this.querySelector(".cf-upload-input")?.click()} ?disabled=${this._busy}>${icon("upload")}<span>${this._busy ? "Working…" : "Upload files"}</span></button>` : ""}
              <input class="cf-upload-input" aria-label="Upload files" type="file" multiple hidden ?disabled=${this._busy} @change=${event => this._uploadFiles(event.target.files, event.target)} />
            </div>
          </header>

          <section class=${`cf-card ${this._dragging ? "is-dragging" : ""}`} @dragenter=${event => { event.preventDefault(); this._dragging = true; }} @dragover=${event => event.preventDefault()} @dragleave=${event => { if (!event.currentTarget.contains(event.relatedTarget)) this._dragging = false; }} @drop=${event => this._drop(event)}>
            <div class="cf-drop-overlay"><div>${icon("upload")}<strong>Drop files to upload</strong><span>They will be added to this folder</span></div></div>
            <div class="cf-card-top">${this._renderBreadcrumbs()}<span class="cf-count">${query ? folders.length + files.length : itemCount} item${itemCount === 1 ? "" : "s"}</span></div>
            <div class="cf-list-tools">
              <label class="cf-search">${icon("search")}<span class="cf-sr-only">Search this folder</span><input type="search" placeholder="Search this folder" .value=${this._query} @input=${event => { this._query = event.target.value; }} /></label>
              <div class="cf-view-tools">
                <select aria-label="Sort files" .value=${this._sort} @change=${event => { this._sort = event.target.value; }}><option value="name">Name A–Z</option><option value="modified">Last modified</option><option value="size">Largest first</option></select>
                <div class="cf-view-switch" aria-label="File view"><button aria-label="List view" aria-pressed=${this._view === "list"} @click=${() => { this._view = "list"; }}>☰</button><button aria-label="Grid view" aria-pressed=${this._view === "grid"} @click=${() => { this._view = "grid"; }}>▦</button></div>
              </div>
            </div>
            <div class=${`cf-list ${this._view === "grid" && !empty && !noResults ? "cf-grid" : ""}`} aria-busy=${this._loading ? "true" : "false"}>
              <div class=${`cf-progress ${this._loading || this._busy ? "is-active" : ""}`}><span></span></div>
              <div class="cf-columns" aria-hidden="true"><span></span><span>Name</span><span>Size</span><span>Modified</span><span></span></div>
              ${this._loading && !hasItems ? html`<div class="cf-skeleton" aria-label="Loading files">${[1, 2, 3].map(() => html`<div class="cf-skeleton-row"><i></i><span></span><em></em></div>`)}</div>`
                : this._error && !hasItems ? html`<div class="cf-state cf-error-state"><div class="cf-state-icon">!</div><h2>Files could not be loaded</h2><p>${this._error}</p><button class="cf-button cf-button-secondary" type="button" @click=${() => this._mode === "shared" && this._sharedChannel ? this._loadSharedFolder(this._sharedChannel) : this._load()}>Try again</button></div>`
                : empty ? html`<div class="cf-state"><div class="cf-empty-icon">${icon("folder")}</div><h2>${sharedRoot || sharedApp ? "No shared folders" : "This folder is empty"}</h2><p>${sharedRoot || sharedApp ? "Channel and conversation folders appear here when you are a member." : shared ? "Upload files to share them with this channel." : "Upload files or create a folder to get started."}</p></div>`
                : noResults ? html`<div class="cf-state"><div class="cf-empty-icon">${icon("search")}</div><h2>No matching files</h2><p>Try a different search.</p></div>`
                : this._renderRows(folders, files)}
            </div>
          </section>
          <div class="cf-bottom-note">${shared ? "Shared access is managed in Chat · " : "Drag files here to upload · "}Search within the current folder</div>
          </div>
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
    .cf-breadcrumbs{display:flex;align-items:center;flex:1;min-width:0;overflow-x:auto;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:#d0d5dd transparent;padding:3px}.cf-breadcrumbs::-webkit-scrollbar{height:4px}.cf-breadcrumbs::-webkit-scrollbar-track{background:transparent}.cf-breadcrumbs::-webkit-scrollbar-thumb{background:#d0d5dd;border-radius:999px}.cf-crumb{flex:none;border:0;background:transparent;color:#475467;font:600 13px/1.2 inherit;padding:7px 5px;border-radius:6px;white-space:nowrap;cursor:pointer}.cf-crumb:not(:disabled):hover{background:#f2f4f7;color:var(--cf-text)}.cf-crumb:disabled{color:var(--cf-text);cursor:default}.cf-root{display:flex;align-items:center;gap:6px}.cf-root .cf-svg{width:17px;height:17px}.cf-separator{flex:none;color:#98a2b3}.cf-separator .cf-svg{width:14px;height:14px}.cf-toolbar-actions{display:flex;align-items:center;gap:8px;flex:none}
    .cf-list-tools{height:58px;padding:10px 18px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid var(--cf-border)}.cf-search{height:38px;max-width:320px;flex:1;display:flex;align-items:center;gap:9px;padding:0 11px;border:1px solid #d0d5dd;border-radius:8px;background:#fff;color:#667085}.cf-search:focus-within{border-color:#8178f2;box-shadow:0 0 0 3px rgba(79,70,229,.12)}.cf-search .cf-svg{width:18px;height:18px}.cf-search input{width:100%;border:0;outline:0;background:transparent;font:400 14px inherit;color:var(--cf-text)}.cf-search input::placeholder{color:#98a2b3}.cf-count{font-size:12px;color:#667085;white-space:nowrap}
    .cf-list{position:relative;min-height:270px}.cf-progress{position:absolute;z-index:4;top:0;left:0;right:0;height:2px;overflow:hidden;pointer-events:none}.cf-progress span{display:none;height:100%;width:35%;background:var(--cf-primary);animation:cf-progress 1.05s ease-in-out infinite}.cf-progress.is-active span{display:block}@keyframes cf-progress{0%{transform:translateX(-110%)}100%{transform:translateX(400%)}}
    .cf-columns,.cf-row{display:grid;grid-template-columns:38px minmax(180px,1fr) 100px 190px 76px;gap:12px;align-items:center}.cf-columns{height:42px;padding:0 18px;background:#f9fafb;border-bottom:1px solid var(--cf-border);font-size:11px;font-weight:650;color:#667085;text-transform:uppercase;letter-spacing:.055em}.cf-row{min-height:68px;padding:10px 18px;border-bottom:1px solid #eef0f3;color:var(--cf-text)}.cf-row:last-child{border-bottom:0}.cf-folder-row{width:100%;border-top:0;border-left:0;border-right:0;background:#fff;text-align:left;font:inherit;cursor:pointer}.cf-folder-row:not(:disabled):hover,.cf-row:not(.cf-folder-row):hover{background:#fafaff}.cf-folder-row:disabled{cursor:wait}.cf-kind{width:34px;height:34px;border-radius:8px;display:grid;place-items:center}.cf-kind .cf-svg{width:19px;height:19px}.cf-folder-icon{background:#eef2ff;color:#4f46e5}.cf-file-icon{background:#f2f4f7;color:#667085}.cf-file-icon.is-image{background:#ecfdf3;color:#067647}.cf-file-icon.is-document{background:#fef3f2;color:#b42318}.cf-file-icon.is-sheet{background:#ecfdf3;color:#067647}.cf-file-icon.is-archive{background:#fffaeb;color:#b54708}.cf-file-icon.is-audio{background:#fdf2fa;color:#c11574}.cf-file-icon.is-video{background:#f4f3ff;color:#6938ef}.cf-file-icon.is-code{background:#eef4ff;color:#3538cd}.cf-name{display:block;min-width:0}.cf-name strong{display:block;font-size:14px;font-weight:620;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cf-size,.cf-modified{font-size:13px;color:#667085}.cf-mobile-meta{display:none;margin-top:3px;font-size:12px;font-weight:400;color:#667085;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cf-row-action{justify-self:center;color:#98a2b3}.cf-row-action .cf-svg{width:17px;height:17px}.cf-file-actions{display:flex;align-items:center;justify-content:flex-end;gap:2px}.cf-icon-button{width:34px;height:34px;padding:7px;border:0;border-radius:7px;background:transparent;color:#667085;cursor:pointer;display:grid;place-items:center;text-decoration:none}.cf-icon-button:hover{background:#f2f4f7;color:#344054}.cf-download:hover{background:#eef2ff;color:#4338ca}.cf-delete:hover{background:#fef3f2;color:#b42318}.cf-icon-button:disabled{opacity:.45;cursor:not-allowed}
    .cf-state{min-height:226px;padding:40px 20px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.cf-state h2{margin:15px 0 5px;font-size:16px;color:var(--cf-text)}.cf-state p{margin:0 0 18px;color:#667085;font-size:13px}.cf-empty-icon,.cf-state-icon{width:48px;height:48px;border-radius:12px;background:#f2f4f7;color:#667085;display:grid;place-items:center}.cf-empty-icon .cf-svg{width:23px;height:23px}.cf-error-state .cf-state-icon{background:#fef3f2;color:#b42318;font-weight:800}.cf-skeleton{padding:4px 18px}.cf-skeleton-row{height:68px;display:grid;grid-template-columns:38px minmax(120px,1fr) 90px;gap:12px;align-items:center;border-bottom:1px solid #eef0f3}.cf-skeleton-row i,.cf-skeleton-row span,.cf-skeleton-row em{display:block;background:linear-gradient(90deg,#f2f4f7 25%,#e9ecf0 37%,#f2f4f7 63%);background-size:400% 100%;animation:cf-shimmer 1.3s ease infinite;border-radius:7px}.cf-skeleton-row i{width:34px;height:34px}.cf-skeleton-row span{height:13px;max-width:340px}.cf-skeleton-row em{height:11px;width:72px}@keyframes cf-shimmer{0%{background-position:100% 0}100%{background-position:0 0}}
    .cf-drop-overlay{position:absolute;z-index:8;inset:0;background:rgba(238,242,255,.94);border:2px dashed #7067e8;display:none;place-items:center;color:#3730a3;text-align:center}.cf-card.is-dragging .cf-drop-overlay{display:grid}.cf-drop-overlay>div{display:flex;flex-direction:column;align-items:center;gap:7px}.cf-drop-overlay .cf-svg{width:32px;height:32px}.cf-drop-overlay span{font-size:13px;color:#6366a5}
    .cf-toast{position:fixed;z-index:30;top:92px;right:20px;max-width:min(390px,calc(100vw - 32px));display:flex;align-items:center;gap:14px;padding:13px 14px 13px 16px;border:1px solid #abefc6;border-radius:10px;background:#ecfdf3;color:#067647;box-shadow:0 12px 32px rgba(16,24,40,.16);font-size:14px;font-weight:550}.cf-toast.is-error{border-color:#fecdca;background:#fef3f2;color:#b42318}.cf-toast button{border:0;background:transparent;color:inherit;padding:2px;cursor:pointer}.cf-toast .cf-svg{width:17px;height:17px}
    .cf-dialog-backdrop{position:fixed;z-index:40;inset:0;background:rgba(17,24,39,.46);display:grid;place-items:center;padding:20px;backdrop-filter:blur(2px)}.cf-dialog{position:relative;width:min(440px,100%);border-radius:14px;background:#fff;padding:26px;box-shadow:0 24px 60px rgba(16,24,40,.24)}.cf-dialog-close{position:absolute;right:16px;top:16px;border:0;background:transparent;color:#667085;padding:5px;border-radius:6px;cursor:pointer}.cf-dialog-close:hover{background:#f2f4f7}.cf-dialog-close .cf-svg{width:19px;height:19px}.cf-dialog-icon{width:44px;height:44px;border-radius:11px;background:#eef2ff;color:#4f46e5;display:grid;place-items:center;margin-bottom:18px}.cf-dialog-icon.is-danger{background:#fef3f2;color:#d92d20}.cf-dialog h2{font-size:19px;letter-spacing:-.015em;margin:0 32px 8px 0;color:var(--cf-text)}.cf-dialog p{font-size:14px;line-height:1.55;color:#667085;margin:0 0 20px;overflow-wrap:anywhere}.cf-field-label{display:block;font-size:13px;font-weight:600;color:#344054;margin:0 0 6px}.cf-dialog-input{width:100%;height:42px;border:1px solid #d0d5dd;border-radius:8px;padding:0 12px;font:400 14px inherit;outline:0}.cf-dialog-input:focus{border-color:#8178f2;box-shadow:0 0 0 3px rgba(79,70,229,.12)}.cf-dialog-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:24px}
    @media(max-width:720px){.cf-shell{padding:24px 16px 64px}.cf-page-header{align-items:flex-start;margin-bottom:20px}.cf-page-header h1{font-size:31px}.cf-page-header p{font-size:14px}.cf-upload span{display:none}.cf-upload{width:44px;padding:10px}.cf-card{border-radius:12px}.cf-card-top{padding:12px 13px;gap:10px}.cf-toolbar-actions .cf-button span{display:none}.cf-toolbar-actions .cf-button{width:40px;padding:8px}.cf-root span{display:none}.cf-list-tools{height:56px;padding:9px 13px}.cf-search{max-width:none}.cf-columns{display:none}.cf-row{grid-template-columns:36px minmax(0,1fr) 70px;gap:10px;min-height:70px;padding:10px 13px}.cf-size,.cf-modified{display:none}.cf-mobile-meta{display:block}.cf-skeleton{padding:4px 13px}.cf-skeleton-row{grid-template-columns:36px minmax(100px,1fr);height:70px}.cf-skeleton-row em{display:none}.cf-toast{top:auto;bottom:92px;left:16px;right:16px;max-width:none}.cf-dialog{padding:22px}.cf-dialog-actions{display:grid;grid-template-columns:1fr 1fr}.cf-dialog-actions .cf-button{width:100%}}
    @media(max-width:440px){.cf-page-header p{max-width:245px}.cf-count{display:none}.cf-dialog-actions{grid-template-columns:1fr}.cf-dialog-actions .cf-button-primary,.cf-dialog-actions .cf-button-danger{grid-row:1}.cf-dialog-actions .cf-button-secondary{grid-row:2}}

    .cf-shell{--cf-primary:#2563eb;--cf-primary-hover:#1d4ed8;max-width:none;padding:0;margin:0;display:grid;grid-template-columns:216px minmax(0,1fr);height:calc(100dvh - 104px);min-height:420px;background:#f8fafc;border:1px solid #e5eaf1;border-radius:18px;overflow:hidden}.cf-mobile-shared-nav{display:none}
    .cf-sidebar{display:flex;flex-direction:column;min-height:0;padding:28px 16px 20px;border-right:1px solid #e5eaf1;background:#f3f6fb}.cf-brand{display:flex;align-items:center;gap:12px;padding:0 12px 28px;font-size:23px;font-weight:750;letter-spacing:-.6px;color:#18273f}.cf-brand .cf-svg{width:28px;height:28px;color:#2563eb}.cf-nav-item{display:flex;align-items:center;gap:11px;width:100%;text-align:left;border:0;border-radius:9px;background:transparent;padding:12px;color:#526078;font:500 14px/20px inherit;cursor:pointer}.cf-nav-item span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cf-nav-item:hover{background:#eaf0f8}.cf-nav-item.is-active{background:#e2ecff;color:#1d4ed8;font-weight:650}.cf-nav-heading{font-size:10px;letter-spacing:1.4px;font-weight:700;color:#8995a6;padding:30px 12px 10px}.cf-folder-nav{overflow:auto;min-height:0}.cf-sidebar-note{margin-top:auto;padding:24px 12px 0;font-size:12px;font-weight:600;color:#526078}.cf-sidebar-note span{display:block;font-size:11px;font-weight:400;color:#8995a6;margin-top:5px}
    .cf-workspace{min-width:0;overflow:auto;padding:32px 36px;background:#fff}.cf-page-header{align-items:center;margin-bottom:26px}.cf-page-header h1{font-size:28px;line-height:1.3;letter-spacing:-.8px;margin:6px 0;overflow-wrap:anywhere}.cf-page-header p{font-size:13px}.cf-eyebrow{font-size:10px;letter-spacing:1.6px;color:#8190a5}.cf-header-actions{display:flex;gap:10px;flex-shrink:0}.cf-button{font-family:inherit;font-size:13px;font-weight:600;min-height:42px;border-radius:8px}.cf-card{border:0;border-radius:0;box-shadow:none;overflow:visible}.cf-card-top{padding:0 0 16px;min-height:48px;border-bottom:0}.cf-root span{display:inline}.cf-crumb{font-family:inherit;font-size:13px}.cf-list-tools{padding:0 0 22px;border-bottom:0;height:auto;gap:12px;flex-wrap:wrap}.cf-search{max-width:420px;height:42px;background:#f5f7fa;border:1px solid #edf0f5;min-width:180px}.cf-search input{font-family:inherit;font-size:13px}.cf-view-tools{display:flex;gap:12px;align-items:center}.cf-view-tools select{height:36px;border:1px solid #e5eaf1;border-radius:7px;background:#fff;color:#526078;padding:0 8px;font:12px system-ui}.cf-view-switch{display:flex;border:1px solid #e5eaf1;border-radius:7px;padding:3px;gap:2px}.cf-view-switch button{width:32px;height:28px;border:0;border-radius:4px;background:transparent;color:#7c889a;cursor:pointer;font-size:18px}.cf-view-switch button[aria-pressed=true]{background:#eaf1ff;color:#2563eb}.cf-columns,.cf-row{grid-template-columns:34px minmax(100px,1fr) 75px 160px 76px}.cf-columns{background:#f8fafc;border-radius:8px;text-transform:none;letter-spacing:0;font-size:12px}.cf-row{min-height:64px;padding:10px 14px}.cf-name strong{font-weight:500;font-size:13px}.cf-folder-icon{background:#fff5d7;color:#c38a18}.cf-kind{border-radius:8px}.cf-bottom-note{padding:24px 0;color:#98a2b3;font-size:11px}.cf-nav-item:focus-visible,.cf-view-switch button:focus-visible{outline:2px solid #2563eb;outline-offset:2px}
    .cf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:16px;min-height:0}.cf-grid .cf-columns{display:none}.cf-grid .cf-row{position:relative;display:flex;align-items:flex-start;flex-direction:column;gap:12px;border:1px solid #e5eaf1;border-radius:12px;padding:18px;min-height:158px}.cf-grid .cf-kind{width:42px;height:42px}.cf-grid .cf-kind .cf-svg{width:25px;height:25px}.cf-grid .cf-name{width:100%}.cf-grid .cf-mobile-meta{display:block;font-size:11px;max-width:100%}.cf-grid .cf-size,.cf-grid .cf-modified{display:none}.cf-grid .cf-file-actions,.cf-grid .cf-row-action{position:absolute;top:18px;right:10px}.cf-grid .cf-skeleton,.cf-grid .cf-state{grid-column:1/-1}
    @media(max-width:1100px){.cf-shell{grid-template-columns:180px minmax(0,1fr)}.cf-workspace{padding:26px 24px}.cf-header-actions{gap:6px}.cf-page-header{gap:12px}.cf-columns,.cf-row{grid-template-columns:32px minmax(90px,1fr) 65px 76px}.cf-modified{display:none}.cf-columns>span:nth-child(4){display:none}}
    @media(max-width:760px){.cf-shell{display:block;border:0;border-radius:0;height:calc(100dvh - 55px);min-height:0}.cf-sidebar{display:none}.cf-workspace{height:100%;padding:24px 18px}.cf-page-header{display:block;margin-bottom:22px}.cf-page-header h1{font-size:28px}.cf-page-header p{max-width:none;font-size:13px}.cf-header-actions{margin-top:20px;gap:10px}.cf-header-actions .cf-button{flex:1}.cf-card-top{padding-bottom:12px}.cf-count{display:block;font-size:11px}.cf-list-tools{gap:12px;padding-bottom:18px}.cf-search{flex-basis:100%;max-width:none}.cf-view-tools{width:100%;justify-content:space-between}.cf-view-tools select{flex:1;max-width:200px}.cf-row{grid-template-columns:34px minmax(0,1fr) 76px;gap:10px;padding:12px 0;min-height:72px}.cf-columns{display:none}.cf-size,.cf-modified{display:none}.cf-name strong{font-size:14px}.cf-mobile-meta{display:block;font-size:11px}.cf-icon-button{width:36px;height:40px}.cf-bottom-note{font-size:10px}.cf-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.cf-grid .cf-row{padding:14px 12px;min-height:160px}.cf-grid .cf-file-actions{position:static;align-self:flex-end;margin-top:-6px}.cf-grid .cf-row-action{top:22px}.cf-grid .cf-name strong{font-size:12px}.cf-grid .cf-file-actions .cf-icon-button{height:30px;width:30px}.cf-grid .cf-mobile-meta{font-size:10px}}
    @media(max-width:760px){.cf-mobile-shared-nav{display:inline-flex;flex-basis:100%}.cf-header-actions{flex-wrap:wrap}}
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
