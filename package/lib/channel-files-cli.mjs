import { channelFilesService, chatCommand, installedChat } from './channel-files-service.mjs';
import { uploadedChannelFile } from './channel-upload-input.mjs';
import {filesConnection} from './files-connection.mjs';
import {fileURLToPath} from 'node:url';
export async function channelFilesAction(action, principalJson, bodyJson, queryJson, home, headersJson) {
try {
  const principal = JSON.parse(principalJson || '{}');
  const subject = principal?.sub || principal?.id;
  if (typeof subject !== 'string' || !subject.trim()) throw new Error('Sign in to access Files.');
  const body = JSON.parse(bodyJson || '{}');
  const query = JSON.parse(queryJson || '{}');
  const connection = filesConnection();
  const available = connection.backend === 'cloud' || !!connection.chatUrl || !!await installedChat(home);
  if (!available && action === 'folders') return {available:false,folders:[]};
  const store = await channelFilesService(home);
  let result;
  if (action === 'upload') result = await store.upload({principal,channelId:body.channelId,...await uploadedChannelFile(body,JSON.parse(headersJson || '{}'))});
  else if (action === 'resolve') result = await store.resolve({principal,channelId:body.channelId,attachments:body.attachments});
  else if (action === 'download') result = await store.download({principal,channelId:query.channelId,id:query.id});
  else if (action === 'folders') {
    const channels = await chatCommand(home,'channels',principal);
    if (!Array.isArray(channels)) throw new Error('Cannot list shared folders');
    result = {available:true,folders:channels.map(channel=>({id:channel.id,path:channel.id,name:channel.title,type:'folder'}))};
  } else if (action === 'browse') {
    result = {path:body.channelId,folders:[],files:(await store.list({principal,channelId:body.channelId})).map(file=>({...file,path:file.id}))};
  } else if (action === 'publish') {
    result = await chatCommand(home,'attachment-publish',principal,{channelId:body.channelId,text:'',attachments:body.attachments,clientMessageId:body.clientMessageId});
    if (result.error) throw new Error('Could not publish attachment');
  } else throw new Error('Unknown attachment action');
  return result;
} catch {
  // No paths, internal errors, or filesystem details are exposed to the browser.
  return {statusCode:403,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store'},body:JSON.stringify({error:'Attachment unavailable. Check conversation access and the file size (6 MB maximum).'})};
}

}
if (process.argv[1] === fileURLToPath(import.meta.url)) process.stdout.write(JSON.stringify(await channelFilesAction(...process.argv.slice(2))));
