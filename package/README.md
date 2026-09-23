# aux4/cloud-files

Per-user file storage for aux4 Cloud applications. A scope chooses the storage policy once; each authenticated user receives and consumes an independent allocation.

This is a hosted Cloud package. Deploy it to a dedicated VM from aux4 Hub; it is not available as a local package download.

## Deployment

Deploy from aux4 Hub. The package creates one managed VM named `files` with fixed runtime resources. There is no separate VM configuration or regular aux4 Cloud VM charge, and the VM cannot accept additional packages or user-managed webhooks.

## Plans

- aux4 Cloud subscribers: 1 GB per user is included by the Cloud plan.
- Small: 10 GB per user for `$1/month`.
- Medium: 50 GB per user for `$5/month`.
- Large: 100 GB per user for `$10/month`.

The selected paid tier replaces the included allowance; allowances do not stack. These are dev-market validation prices, not final production pricing.

## Usage

Open the `files` VM URL to use the built-in Files app. The app is served by `aux4/platform` from this same package and lets each signed-in user:

- browse their own folders;
- create folders;
- upload one or more files; and
- delete files after confirmation.

The VM also exposes file operations directly. From any machine with `aux4/cloud` installed, call the fixed `files` VM:

```bash
aux4 cloud files list
aux4 cloud files get notes/today.txt
aux4 cloud files upload
aux4 cloud files delete notes/today.txt
```

Set `AUX4_CLOUD_SCOPE` to select the scope. The VM name is always `files`.

## Quota model

Storage is a current gauge, not a monthly event counter. Plans are authored in decimal GB (`1 GB = 1,000,000,000 bytes`), while telemetry and enforcement use exact bytes. The Cloud API derives identity from the signed-in subject, measures the user's objects across every VM in the scope, and refuses an upload when its resulting total would exceed the active plan. Reads and deletes remain available after cancellation or expiry.

Packages using Cloud Files must call the authenticated Cloud file API on behalf of the current user. They must never accept an arbitrary user id as storage authority.

Folders use a zero-byte `.aux4-folder` marker in object storage. The Files app hides that marker. All objects remain under the verified user's central scope folder and are encrypted with the scope's KMS key by the Cloud Files API.
