# aux4/cloud-files

Source for the paid aux4 Cloud Files package. The publishable package is in [`package/`](package/).

Cloud Files provides reusable per-user file storage for aux4 Cloud applications. Quotas are assigned to a scope but measured and enforced independently for every authenticated user.

The dev package exposes Small (10 GB), Medium (50 GB), and Large (100 GB) tiers. aux4 Cloud plans separately include 1 GB per user. Plan values are authored in decimal GB and projected to exact bytes for telemetry and enforcement.
