# files VM commands

## direct command surface

### should expose list directly

```execute
aux4 list --help
```

```expect:partial
List files in a cloud VM
```

### should hide the fixed VM plumbing

```execute
aux4 list --help
```

```expect:regex
^(?!.*--package)(?!.*--scope)(?!.*--apiUrl)[\s\S]*$
```

### should expose upload directly

```execute
aux4 upload --help
```

```expect:partial
Upload or replace a file in a cloud VM
```

## Files app

### should expose app metadata and routes

```execute
aux4 platform app files meta && echo && aux4 platform app files ui
```

```expect:partial
{"name":"Files","icon":"folder","title":"Cloud Files"}
*?"components":"static/cloud-files.js"*?
```

### should browse folders and hide folder markers

```execute
CLOUD_FILES_LIST_FIXTURE='{"folders":["docs/photos/"],"files":[{"name":"docs/readme.txt","size":42,"lastModified":"2026-09-23T00:00:00.000Z"},{"name":"docs/.aux4-folder","size":0}]}' aux4 platform app files browse --path docs
```

```expect:partial
*?"path":"docs/"*?"name":"photos"*?"name":"readme.txt"*?
```

```expect:regex
^(?!.*\.aux4-folder)[\s\S]*$
```

### should create a folder marker

```execute
CLOUD_FILES_WRITE_FIXTURE=ok aux4 platform app files create-folder --path docs --name photos
```

```expect:partial
*?"message":"Created photos"*?"folder":"docs/photos/"*?
```

### should upload a multipart-style temporary file

```file:upload.txt
hello files
```

```execute
CLOUD_FILES_WRITE_FIXTURE=ok aux4 platform app files upload --path docs --files '[{"filename":"note.txt","mimeType":"text/plain","path":"upload.txt"}]'
```

```expect:partial
*?"message":"Uploaded 1 file"*?"path":"docs/note.txt"*?
```

### should delete a file

```execute
CLOUD_FILES_WRITE_FIXTURE=ok aux4 platform app files delete --path docs/note.txt
```

```expect:partial
*?"message":"Deleted note.txt"*?
```
