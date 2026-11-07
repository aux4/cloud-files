#### Description

Download a published channel attachment. The authenticated principal must still belong to the channel. Returns an attachment response with no-store caching; never returns a public storage URL.

#### Usage

```bash
aux4 platform app files channel-download
```

The platform supplies the authenticated principal and request body/query. These are internal app actions; callers cannot select another user as storage authority.
