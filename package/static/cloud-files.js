export function register(engine) {
  const { LightElement, html, repeat } = engine.base;

  class CloudFilesBrowser extends LightElement {
    static properties = {
      ...LightElement.properties,
      _path: { state: true },
      _folders: { state: true },
      _files: { state: true },
      _loading: { state: true },
      _busy: { state: true },
      _error: { state: true },
      _message: { state: true }
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
    }

    connectedCallback() {
      super.connectedCallback();
      this._load();
    }

    async _run(action, stdin) {
      const result = await this.runtime.run(action, { stdin });
      if (result?.error) throw new Error(result.error);
      return result || {};
    }

    async _load(path = this._path) {
      this._loading = true;
      this._error = "";
      try {
        const result = await this._run("browse", { path });
        this._path = result.path || "";
        this._folders = Array.isArray(result.folders) ? result.folders : [];
        this._files = Array.isArray(result.files) ? result.files : [];
      } catch (error) {
        this._error = error.message;
      } finally {
        this._loading = false;
      }
    }

    _open(folder) {
      this._message = "";
      this._load(folder.path);
    }

    async _createFolder() {
      const input = this.querySelector("[data-folder-name]");
      const name = input?.value?.trim();
      if (!name) return;
      this._busy = true;
      this._error = "";
      try {
        const result = await this._run("create-folder", { path: this._path, name });
        this._message = result.message || "Folder created";
        input.value = "";
        await this._load();
      } catch (error) {
        this._error = error.message;
      } finally {
        this._busy = false;
      }
    }

    async _upload(event) {
      const files = [...(event.target.files || [])];
      if (!files.length) return;
      this._busy = true;
      this._error = "";
      try {
        const form = new FormData();
        form.append("path", this._path);
        for (const file of files) form.append("file", file, file.name);
        const base = typeof window !== "undefined" ? (window.__BASE__ || "") : "";
        const response = await fetch(`${base}/api/apps/files/upload`, { method: "POST", body: form });
        const text = await response.text();
        let result = {};
        try { result = text ? JSON.parse(text) : {}; } catch { result = { error: text }; }
        if (!response.ok || result.error) throw new Error(result.error || `Upload failed (${response.status})`);
        this._message = result.message || "Upload complete";
        event.target.value = "";
        await this._load();
      } catch (error) {
        this._error = error.message;
      } finally {
        this._busy = false;
      }
    }

    async _delete(file) {
      if (!window.confirm(`Delete ${file.name}? This cannot be undone.`)) return;
      this._busy = true;
      this._error = "";
      try {
        const result = await this._run("delete", { path: file.path });
        this._message = result.message || "File deleted";
        await this._load();
      } catch (error) {
        this._error = error.message;
      } finally {
        this._busy = false;
      }
    }

    _parent() {
      const parts = this._path.replace(/\/$/, "").split("/").filter(Boolean);
      parts.pop();
      this._load(parts.length ? `${parts.join("/")}/` : "");
    }

    _formatBytes(value) {
      const bytes = Number(value) || 0;
      if (bytes < 1000) return `${bytes} B`;
      const units = ["KB", "MB", "GB", "TB"];
      let amount = bytes;
      let unit = -1;
      do { amount /= 1000; unit += 1; } while (amount >= 1000 && unit < units.length - 1);
      return `${amount < 10 ? amount.toFixed(1) : Math.round(amount)} ${units[unit]}`;
    }

    _formatDate(value) {
      if (!value) return "";
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
    }

    render() {
      const empty = !this._loading && !this._folders.length && !this._files.length;
      return html`
        <section style="max-width:960px;margin:0 auto;padding:20px 16px 48px;color:var(--fe-text,#0f172a);">
          <header style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:20px;">
            <div>
              <h1 style="font-size:28px;line-height:1.2;margin:0 0 6px;font-weight:700;">Files</h1>
              <div style="font-size:14px;color:var(--fe-text-muted,#64748b);">Your private, encrypted cloud storage</div>
            </div>
            <label style="display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;background:var(--fe-primary,#2563eb);color:white;font-weight:600;cursor:${this._busy ? "wait" : "pointer"};">
              <span>Upload files</span>
              <input type="file" multiple hidden ?disabled=${this._busy} @change=${event => this._upload(event)} />
            </label>
          </header>

          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
            <button type="button" @click=${() => this._load("")} ?disabled=${this._loading || !this._path} style=${buttonStyle()}>Home</button>
            ${this._path ? html`<button type="button" @click=${() => this._parent()} ?disabled=${this._loading} style=${buttonStyle()}>Up</button>` : ""}
            <span style="font-family:ui-monospace,SFMono-Regular,monospace;font-size:13px;color:var(--fe-text-muted,#64748b);word-break:break-all;">/${this._path}</span>
          </div>

          <div style="display:flex;gap:8px;margin-bottom:16px;">
            <input data-folder-name type="text" placeholder="New folder name" @keydown=${event => event.key === "Enter" && this._createFolder()} style="min-width:0;flex:1;padding:10px 12px;border:1px solid var(--fe-border,#cbd5e1);border-radius:8px;background:var(--fe-surface,#fff);color:inherit;" />
            <button type="button" @click=${() => this._createFolder()} ?disabled=${this._busy} style=${buttonStyle(true)}>Create folder</button>
          </div>

          ${this._error ? html`<div role="alert" style="padding:12px 14px;margin-bottom:14px;border:1px solid #fecaca;border-radius:8px;background:#fef2f2;color:#b91c1c;">${this._error}</div>` : ""}
          ${this._message ? html`<div role="status" style="padding:12px 14px;margin-bottom:14px;border:1px solid #bbf7d0;border-radius:8px;background:#f0fdf4;color:#166534;">${this._message}</div>` : ""}

          <div style="border:1px solid var(--fe-border,#e2e8f0);border-radius:12px;background:var(--fe-surface,#fff);overflow:hidden;">
            ${this._loading ? html`<div style="padding:28px;text-align:center;color:var(--fe-text-muted,#64748b);">Loading files…</div>` : ""}
            ${repeat(this._folders, item => item.path, item => html`
              <button type="button" @click=${() => this._open(item)} style="display:grid;grid-template-columns:40px minmax(0,1fr);align-items:center;width:100%;padding:13px 16px;border:0;border-bottom:1px solid var(--fe-border,#e2e8f0);background:transparent;color:inherit;text-align:left;cursor:pointer;">
                <span aria-hidden="true" style="font-size:22px;">📁</span>
                <span style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.name}</span>
              </button>
            `)}
            ${repeat(this._files, item => item.path, item => html`
              <div style="display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:10px;align-items:center;padding:13px 16px;border-bottom:1px solid var(--fe-border,#e2e8f0);">
                <span aria-hidden="true" style="font-size:22px;">📄</span>
                <div style="min-width:0;">
                  <div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.name}</div>
                  <div style="font-size:12px;color:var(--fe-text-muted,#64748b);">${this._formatBytes(item.size)}${item.lastModified ? ` · ${this._formatDate(item.lastModified)}` : ""}</div>
                </div>
                <button type="button" aria-label=${`Delete ${item.name}`} @click=${() => this._delete(item)} ?disabled=${this._busy} style="padding:8px 10px;border:1px solid #fecaca;border-radius:7px;background:#fff;color:#b91c1c;cursor:pointer;">Delete</button>
              </div>
            `)}
            ${empty ? html`<div style="padding:36px 20px;text-align:center;color:var(--fe-text-muted,#64748b);">This folder is empty. Upload a file or create a folder.</div>` : ""}
          </div>
        </section>
      `;
    }
  }

  function buttonStyle(primary = false) {
    return `padding:9px 13px;border-radius:8px;border:1px solid ${primary ? "var(--fe-primary,#2563eb)" : "var(--fe-border,#cbd5e1)"};background:${primary ? "var(--fe-primary,#2563eb)" : "var(--fe-surface,#fff)"};color:${primary ? "white" : "inherit"};font-weight:600;cursor:pointer;`;
  }

  CloudFilesBrowser.tag = "cloud-files-browser";
  CloudFilesBrowser.label = "CloudFilesBrowser";
  CloudFilesBrowser.icon = "folder";
  CloudFilesBrowser.color = "#2563eb";
  CloudFilesBrowser.template = true;
  CloudFilesBrowser.propsSchema = {};

  engine.registerLibrary({ name: "cloud-files", components: [CloudFilesBrowser] });
}

export default register;
