# Database backup implementation plan

**Goal:** Automatically back up production PostgreSQL without Railway Pro volume snapshots.

**Architecture:** A short-lived Railway cron service runs PostgreSQL 18 pg_dump, verifies a restore in a disposable local cluster, uploads the archive and checksum manifest to a separate private S3-compatible bucket, downloads and checks the uploaded bytes, then retains the newest 30 verified copies. Production credentials are held only in Railway variables. The source database is read only during this job.

**Schedule:** `0 22 * * *` UTC = 03:00 Asia/Dushanbe every day.

- [x] Implement isolated backup Docker image, Python runner, strict retention scope and error handling.
- [x] Test retention boundaries and failed upload/verification behavior (5 passing tests).
- [x] Configure private bucket and dedicated cron service with reference credentials.
- [x] Run first backup, verify full restore of 38 tables and stored checksum, confirm cron configuration.
- [x] Document restore procedure and limits: this covers PostgreSQL, not product images; bucket and database share Railway provider.
