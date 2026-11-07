#### Description

Publish uploaded references as an attachment-only chat message, returning a bounded acknowledgement rather than the full conversation history. Requires channel membership and ownership of each staged file.

#### Usage

```bash
aux4 platform app files channel-publish
```

The platform supplies the authenticated principal and request body/query. These are internal app actions; callers cannot select another user as storage authority.
