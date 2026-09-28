#### Description

Returns an authenticated download response for one file owned by the signed-in user. Cloud Files redirects binary downloads to a short-lived presigned object URL and supplies an attachment filename, so file bytes are not converted through UTF-8 or exposed with the user's Cloud authorization header.

#### Usage

```bash
aux4 platform app files download --path <file-path>
```

--path  Path of the file beneath the signed-in user's Cloud Files root

#### Example

```bash
aux4 platform app files download --path reports/summary.pdf
```

The platform uses this response for the download action shown beside each file.
