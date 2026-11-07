// Connection settings are trusted server configuration, never browser parameters.
export function serviceUrl(value) {
  const url = new URL(value);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(loopback && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash) throw new Error('Files connections require an HTTPS service URL.');
  return url.href.replace(/\/$/, '');
}
export function filesConnection(env = process.env) {
  const backend = env.FILES_BACKEND || 'local';
  if (!['local','cloud'].includes(backend)) throw new Error('FILES_BACKEND must be local or cloud.');
  return { backend, ...(backend === 'cloud' ? {url:serviceUrl(env.FILES_SERVICE_URL)} : {}), ...(env.FILES_CHAT_SERVICE_URL ? {chatUrl:serviceUrl(env.FILES_CHAT_SERVICE_URL)} : {}) };
}
export async function serviceRequest(base, path, {body, method = 'POST', maxBytes = 1048576, token = process.env.AUX4_ACCESS_TOKEN, timeout = 12000} = {}) {
  if (!token || typeof token !== 'string') throw new Error('The signed-in user token is required for remote Files.');
  const response = await fetch(`${serviceUrl(base)}${path}`, {
    method, headers: {Authorization:`Bearer ${token}`, ...(body instanceof FormData ? {} : body === undefined ? {} : {'Content-Type':'application/json'})},
    ...(body === undefined ? {} : {body:body instanceof FormData ? body : JSON.stringify(body)}),
    redirect:'error', signal:AbortSignal.timeout(timeout), cache:'no-store',
  });
  if (!response.ok) { await response.body?.cancel(); throw new Error(response.status === 401 || response.status === 403 ? 'File unavailable or conversation access denied.' : 'Files service is unavailable.'); }
  const reader = response.body?.getReader(); const chunks = []; let size = 0;
  if (reader) while (true) {
    const {value,done} = await reader.read(); if (done) break;
    size += value.length; if (size > maxBytes) { await reader.cancel(); throw new Error('Files response exceeded its size limit.'); }
    chunks.push(value);
  }
  return {bytes:Buffer.concat(chunks),headers:response.headers};
}
export async function serviceJson(base, path, options) {
  const {bytes} = await serviceRequest(base,path,options);
  let result; try { result = JSON.parse(bytes.toString('utf8')); } catch { throw new Error('Invalid Files service response.'); }
  if (!result || result.error || (result.statusCode && result.statusCode >= 400)) throw new Error('File unavailable or conversation access denied.');
  return result;
}
export function createRemoteAttachmentStore(url) {
  const endpoint = '/api/apps/files';
  return {
    async upload({channelId,name,type,data}) {
      const bytes = Buffer.from(data, 'base64');
      if (!bytes.length || bytes.length > 6291456) throw new Error('File is empty or exceeds the upload limit.');
      const body = new FormData(); body.append('channelId',channelId); body.append('file',new Blob([bytes],{type}),name);
      return serviceJson(url,`${endpoint}/channel-attachments`,{body});
    },
    resolve({channelId,attachments}) { return serviceJson(url,`${endpoint}/channel-resolve`,{body:{channelId,attachments}}); },
    async list({channelId}) { const result = await serviceJson(url,`${endpoint}/channel-browse`,{body:{channelId}}); if (!Array.isArray(result.files)) throw new Error('Invalid file listing.'); return result.files; },
    async download({channelId,id}) {
      const {bytes,headers} = await serviceRequest(url,`${endpoint}/channel-attachment?${new URLSearchParams({channelId,id})}`,{method:'GET',maxBytes:6291456});
      // Keep downloads authenticated and same-origin; never expose a remote URL or token.
      return {statusCode:200,headers:{'Content-Type':'application/octet-stream','Content-Disposition':headers.get('content-disposition') || 'attachment','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'},isBase64Encoded:true,body:bytes.toString('base64')};
    },
  };
}
