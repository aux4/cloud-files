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
