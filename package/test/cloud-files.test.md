# cloud-files

## command group

### should expose the focused cloud file commands

```execute
aux4 cloud-files --help
```

```expect:partial
Manage your per-user files in an aux4 Cloud VM
```

### should expose list through the cloud dependency

```execute
aux4 cloud-files list --help
```

```expect:partial
List files in a cloud VM
```

### should expose upload through the cloud dependency

```execute
aux4 cloud-files upload --help
```

```expect:partial
Upload or replace a file in a cloud VM
```
