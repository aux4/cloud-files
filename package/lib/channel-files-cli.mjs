import { channelFilesService, chatCommand, installedChat } from './channel-files-service.mjs';
import { uploadedChannelFile } from './channel-upload-input.mjs';
const [action, principalJson, bodyJson, queryJson, home, headersJson] = process.argv.slice(2);
try {
  const principal = JSON.parse(principalJson || '{}');
  const body = JSON.parse(bodyJson || '{}');
  const query = JSON.parse(queryJson || '{}');
  const available = !!await installedChat(home);
  if (!available && action === 'folders') { process.stdout.write(JSON.stringify({available:false,folders:[]})); process.exit(0); }
  const store = await channelFilesService(home);
  let result;
  if (action === 'upload') result = await store.upload({principal,channelId:body.channelId,...await uploadedChannelFile(body,JSON.parse(headersJson || '{}'))});
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
  process.stdout.write(JSON.stringify(result));
} catch {
  // No paths, internal errors, or filesystem details are exposed to the browser.
  process.stdout.write(JSON.stringify({statusCode:403,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store'},body:JSON.stringify({error:'Attachment unavailable. Check conversation access and the file size (6 MB maximum).'})}));
}
