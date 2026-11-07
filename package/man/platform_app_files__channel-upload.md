#### Description

Accept one multipart upload, verify current channel membership, and stage an immutable attachment of at most 6 MiB. Only server-generated temporary upload descriptors are accepted. The upload remains private until Chat publishes its reference.

#### Usage

```bash
aux4 platform app files channel-upload
```

The platform supplies the authenticated principal and request body/query. These are internal app actions; callers cannot select another user as storage authority.
