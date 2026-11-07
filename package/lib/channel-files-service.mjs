import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { spawn } from 'node:child_process';
import { createAttachmentStore } from './channel-attachments.mjs';
const defaultHome = () => process.env.AUX4_HOME || join(homedir(), '.aux4.config');
export async function installedChat(home = defaultHome()) {
  try {
    const registry = JSON.parse(await readFile(join(home, 'global.aux4'), 'utf8'));
    const apps = registry.profiles?.find(profile => profile.name === 'platform:app')?.commands || [];
    if (!apps.some(command => command.name === 'files')) return null;
    return apps.find(command => command.name === 'chat')?.ref?.dir || null;
  } catch { return null; }
}
export async function chatCommand(home, action, principal, body = {}) {
  const chat = await installedChat(home);
  if (!chat || !['channels','attachment-publish','attachment-access'].includes(action)) throw new Error('Chat and Files must be installed on this VM.');
    return await new Promise((accept, reject) => {
      const child = spawn('aux4', ['platform', 'app', 'chat', action, '--principal', JSON.stringify(principal), '--body', JSON.stringify(body)], {
        cwd: resolve(chat), env: {...process.env, CHAT_FILES_REGISTRY_HOME: home || defaultHome()}, stdio: ['ignore','pipe','pipe'], timeout: 15000,
      });
      let out = '';
      child.stdout.on('data', chunk => { out += chunk; if (out.length > (action === 'channels' ? 8388608 : 65536)) child.kill(); });
      child.stderr.on('data', () => {});
      child.on('error', reject);
      child.on('close', code => {
        if (code !== 0) return reject(new Error('Could not verify conversation access.'));
        try { accept(JSON.parse(out)); } catch { reject(new Error('Could not verify conversation access.')); }
      });
    });
}
export async function channelFilesService(home = defaultHome()) {
  if (!await installedChat(home)) throw new Error('Chat and Files must be installed on this VM.');
  const root = process.env.FILES_ATTACHMENTS_ROOT || join(process.env.CLOUD_STATE_DIR || join(home, 'apps'), 'files', 'channel-attachments');
  return createAttachmentStore({ root, authorize: async ({principal, channelId, attachmentId}) => {
    const result = await chatCommand(home, 'attachment-access', principal, {channelId, attachmentId});
    if (result.error || result.authorized !== true || result.channelId !== channelId) throw new Error('Conversation or attachment not found, or you are no longer a member.');
    return result;
  }});
}
