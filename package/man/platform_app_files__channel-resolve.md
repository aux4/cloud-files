#### Description

Resolve attachment references against canonical Files metadata. The authenticated sender must own each file, and Chat must confirm current conversation membership. Used by local and remote Chat connections.

#### Usage

```bash
aux4 platform app files channel-resolve
```

Connection settings are trusted server environment variables. See README for `FILES_BACKEND`, `FILES_SERVICE_URL`, and `FILES_CHAT_SERVICE_URL`.
