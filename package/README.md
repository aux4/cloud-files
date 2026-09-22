# aux4/cloud-files

Per-user file storage for aux4 Cloud applications. A scope chooses the storage policy once; each authenticated user receives and consumes an independent allocation.

## Plans

- aux4 Cloud subscribers: 1 GiB per user is included by the Cloud plan.
- Small: 10 GiB per user. The initial `$1/month` price is a dev-market validation price, not final production pricing.

The paid tier replaces the included allowance; allowances do not stack.

## Usage

The package exposes the existing authenticated Cloud file operations under a focused command group:

```bash
aux4 cloud-files list --package agent-chat
aux4 cloud-files upload --package agent-chat --path notes/today.txt --file ./today.txt
aux4 cloud-files get --package agent-chat notes/today.txt
aux4 cloud-files delete --package agent-chat --path notes/today.txt
```

Set `AUX4_CLOUD_SCOPE` to select a scope and `AUX4_CLOUD_API_URL` to target dev.

## Quota model

Storage is a current gauge, not a monthly event counter. The Cloud API derives identity from the signed-in subject, measures the user's objects across every VM in the scope, and refuses an upload when its resulting total would exceed the active plan. Reads and deletes remain available after cancellation or expiry.

Packages using Cloud Files must call the authenticated Cloud file API on behalf of the current user. They must never accept an arbitrary user id as storage authority.
