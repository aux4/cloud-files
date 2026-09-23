#### Description

Uploads or replaces a file for the authenticated user in the scope's managed `files` VM. Uploads that would exceed the active per-user storage limit are rejected.

#### Usage

```bash
aux4 cloud files upload
```

#### Example

```bash
printf 'today' | aux4 cloud files upload
```
