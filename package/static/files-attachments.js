// Files owns the storage contract; reuse the platform's accessible chat composer,
// optimistic messages, attachment tray, progress, retry, and object-URL cleanup.
export function register(engine) {
  const Chat = engine.getComponentByType('Chat');
  if (!Chat) throw new Error('FilesChat requires the platform Chat component.');
  class FilesChat extends Chat {
    _prop(name) {
      if (name === 'attachments') return true;
      if (name === 'uploadUrl') return `${globalThis.window?.__BASE__ || ''}/api/apps/files/channel-attachments`;
      if (name === 'maxFileSize') return 6291456;
      if (name === 'maxFiles') return 10;
      return super._prop(name);
    }
  }
  FilesChat.tag = 'files-chat';
  FilesChat.label = 'FilesChat';
  FilesChat.icon = 'paperclip';
  FilesChat.propsSchema = { ...Chat.propsSchema };
  FilesChat.docs = {description:'Chat with channel-scoped Files attachments. Requires Chat and Files on the same VM. Bind payload.channelId to the canonical channel id. Uploads and downloads check current membership.'};
  engine.registerLibrary({name:'files-attachments',components:[FilesChat]});
}
export default register;
