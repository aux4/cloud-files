#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const action = process.argv[2];
const args = process.argv.slice(3);
const marker = ".aux4-folder";

function output(value) {
  process.stdout.write(JSON.stringify(value));
}

function cleanPath(value, { folder = false } = {}) {
  let path = String(value || "").trim().replace(/\\/g, "/");
  path = path.replace(/^\/+|\/+$/g, "");
  const parts = path.split("/").filter(Boolean);
  if (parts.some(part => part === "." || part === ".." || part.includes("\0"))) {
    throw new Error("Invalid file path");
  }
  path = parts.join("/");
  return folder && path ? `${path}/` : path;
}

function cleanName(value, kind) {
  const name = String(value || "").trim();
  if (!name || name === "." || name === ".." || name.includes("/") || name.includes("\\") || name.includes("\0")) {
    throw new Error(`Invalid ${kind} name`);
  }
  return name;
}

function parseJson(value, fallback) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function cloudConfig() {
  const base = String(process.env.AUX4_CLOUD_API_URL || "https://api.aux4.cloud").replace(/\/$/, "");
  const scope = String(process.env.AUX4_CLOUD_SCOPE || "").trim();
  const token = String(process.env.AUX4_ACCESS_TOKEN || "").trim();
  if (!scope) throw new Error("Cloud scope is not configured");
  if (!token) throw new Error("Your signed-in session could not be delegated to Cloud Files");
  return { base, scope, token };
}

function encodePath(path) {
  return cleanPath(path).split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

function filesUrl(path = "") {
  const { base, scope } = cloudConfig();
  const root = `${base}/v1/${encodeURIComponent(scope)}/deployments/files/files`;
  const encoded = encodePath(path);
  return encoded ? `${root}/${encoded}` : root;
}

async function request(url, options = {}) {
  const { token } = cloudConfig();
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = text ? { error: text } : {};
  }
  if (!response.ok) throw new Error(body.error || body.message || `Cloud Files returned ${response.status}`);
  return body;
}

async function browse(pathValue) {
  const path = cleanPath(pathValue, { folder: true });
  if (process.env.CLOUD_FILES_LIST_FIXTURE !== undefined) {
    return normalizeListing(parseJson(process.env.CLOUD_FILES_LIST_FIXTURE, {}), path);
  }
  const query = path ? `?path=${encodeURIComponent(path)}` : "";
  return normalizeListing(await request(`${filesUrl()}${query}`), path);
}

function normalizeListing(listing, path) {
  const basename = value => String(value || "").replace(/\/$/, "").split("/").pop() || "";
  const folders = (listing.folders || []).map(value => ({
    name: basename(value),
    path: cleanPath(value, { folder: true }),
    type: "folder"
  })).filter(item => item.name);
  const files = (listing.files || []).filter(file => basename(file.name) !== marker).map(file => ({
    name: basename(file.name),
    path: cleanPath(file.name),
    size: Number(file.size) || 0,
    lastModified: file.lastModified || null,
    type: "file"
  })).filter(item => item.name);
  return { path, folders, files };
}

async function put(path, content, contentType = "application/octet-stream") {
  if (process.env.CLOUD_FILES_WRITE_FIXTURE !== undefined) {
    if (process.env.CLOUD_FILES_WRITE_FIXTURE === "fail") throw new Error("Cloud Files write failed");
    return { uploaded: cleanPath(path) };
  }
  return request(`${filesUrl(path)}?retention=0`, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: content
  });
}

async function createFolder(pathValue, nameValue) {
  const path = cleanPath(pathValue, { folder: true });
  const name = cleanName(nameValue, "folder");
  const folder = `${path}${name}/`;
  await put(`${folder}${marker}`, "", "application/x-directory");
  return { message: `Created ${name}`, path, folder };
}

async function upload(pathValue, filesValue) {
  const path = cleanPath(pathValue, { folder: true });
  const raw = parseJson(filesValue, []);
  const files = Array.isArray(raw) ? raw : raw ? [raw] : [];
  if (!files.length) throw new Error("Choose at least one file to upload");
  const uploaded = [];
  for (const file of files) {
    const name = cleanName(file?.filename, "file");
    const source = String(file?.path || "");
    if (!source) throw new Error(`${name} is missing its temporary upload`);
    await put(`${path}${name}`, await readFile(source), file?.mimeType || "application/octet-stream");
    uploaded.push({ name, path: `${path}${name}` });
  }
  return { message: `Uploaded ${uploaded.length} file${uploaded.length === 1 ? "" : "s"}`, path, uploaded };
}

async function deleteFile(pathValue) {
  const path = cleanPath(pathValue);
  if (!path) throw new Error("File path is required");
  if (process.env.CLOUD_FILES_WRITE_FIXTURE !== undefined) {
    if (process.env.CLOUD_FILES_WRITE_FIXTURE === "fail") throw new Error("Cloud Files delete failed");
  } else {
    await request(filesUrl(path), { method: "DELETE" });
  }
  return { message: `Deleted ${path.split("/").pop()}`, path };
}

async function appDescriptor(file, projection) {
  const data = JSON.parse(await readFile(file, "utf8"));
  return projection(data);
}

try {
  let result;
  if (action === "meta") result = await appDescriptor(args[0], ({ name, icon, title, logo, logoAlt }) => ({ name, icon, title, logo, logoAlt }));
  else if (action === "ui") result = await appDescriptor(args[0], ({ api, routes, components }) => ({ api, routes, components }));
  else if (action === "browse") result = await browse(args[0]);
  else if (action === "create-folder") result = await createFolder(args[0], args[1]);
  else if (action === "upload") result = await upload(args[0], args[1]);
  else if (action === "delete") result = await deleteFile(args[0]);
  else throw new Error(`Unknown action: ${action || "(empty)"}`);
  output(result);
} catch (error) {
  output({ error: error.message || String(error) });
}
