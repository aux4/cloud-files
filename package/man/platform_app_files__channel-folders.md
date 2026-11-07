#### Description

List shared folders for the authenticated user’s Chat conversations. Returns available:false when Chat is not installed on this VM.

#### Usage

```bash
aux4 platform app files channel-folders
```

The platform supplies the authenticated principal and request body/query. These are internal app actions; callers cannot select another user as storage authority.
