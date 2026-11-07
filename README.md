# aux4/cloud-files

Source for the paid aux4 Cloud Files package. The publishable package is in [`package/`](package/).

Cloud Files provides reusable per-user file storage for aux4 Cloud applications. Quotas are assigned to a scope but measured and enforced independently for every authenticated user.

The dev package exposes Small (10 GB), Medium (50 GB), and Large (100 GB) tiers. aux4 Cloud plans separately include 1 GB per user. Plan values are authored in decimal GB and projected to exact bytes for telemetry and enforcement.

### Local and remote conversation attachments

The Files attachment interface now supports two backends. The browser always uses
same-origin app endpoints; backend selection is trusted server configuration,
not a value supplied in a message or upload request.

| Setting | Chat VM | Files VM |
| --- | --- | --- |
| `FILES_BACKEND` | `cloud` for a remote Files service; `local` by default | `local` |
| `FILES_SERVICE_URL` | HTTPS origin/base path serving the Files app, for example `https://files.example.com` | Not needed |
| `FILES_CHAT_SERVICE_URL` | Leave unset when Chat is local | HTTPS origin/base path serving the Chat app, for example `https://chat.example.com` |
| `FILES_ATTACHMENTS_ROOT` | Used only for local storage | Absolute path on persistent storage |

For the existing single-VM setup, leave the connection settings unset. Existing
attachment IDs and channel directories continue to work. Setting a remote backend
does **not** migrate previously uploaded files: provision the same store on the
Files service before switching an existing installation, or switch a new workspace.

The Chat host needs the version-compatible `files-attachments` component and its
Files runtime modules registered locally, but does not need the Files app registered,
a local Files store, or a second hosted Files deployment. The remote Files host
needs the Files app and storage, but does not need Chat's package or database.
Package extraction into separate `app-files`/`cloud-files` distributions is not part
of this adapter change; the reusable component/runtime are currently supplied by
this package.

The interface operations are upload, resolve, list, and download. In `local` mode
these use the Files store; in `cloud` mode they call the configured Files app API.
This is a conversation-aware adapter, **not** the personal-file Cloud CLI commands:
those commands alone do not enforce channel membership.

Remote requests delegate the current request's `AUX4_ACCESS_TOKEN`, provided by the
platform's authenticated request handler. Do not configure a shared administrator
token. Both hosts must accept the same aux4 identity/tenant and preserve delegated
tokens in route execution. A missing token, denied access, service outage, invalid
response, or redirect fails closed. HTTPS is required, with HTTP permitted only
for loopback integration tests. Tokens never appear in UI props or attachment URLs.

Files calls Chat's authenticated attachment-access endpoint to check live membership
(and message publication on reads). Shared-folder discovery and publishing from
Files also call Chat as the current user. This connection currently targets one
Chat service; separate Chat workspaces should use separate Files storage roots.

Chat's upload/download endpoints proxy bytes to keep browser authentication,
previews, and downloads same-origin; direct browser-to-Files uploads are not used
in this implementation. Uploads remain limited to 6 MiB and 10 files per message.
Both HTTP hosts must allow the existing multipart upload limit. No CORS policy or
public/signed download links are required.

Run transport checks with `node --test test/files-connection.test.mjs`. The Chat
package's `test/fixtures/remote-files-check.mjs`, with `FILES_PACKAGE_DIR` set to
this package directory, runs real CLI handlers behind two independent HTTP services
and verifies identity delegation, multi-megabyte transfers, shared folders,
publication, ownership, member removal, and message deletion.

Personal and shared Files app actions independently require a nonempty authenticated
principal, even when a process has an access token configured. Remote Chat
membership responses must identify that same principal. Request body/query fields
cannot select a different user. Cloud personal-file keys are derived from the
verified token subject; shared files use live conversation membership instead.
