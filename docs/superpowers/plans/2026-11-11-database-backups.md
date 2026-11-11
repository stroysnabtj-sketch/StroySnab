# Database backup implementation plan

**Goal:** Automatically back up production PostgreSQL without Railway Pro volume snapshots.

**Architecture:** A short-lived Railway cron service runs PostgreSQL 18 pg_dump, verifies a restore in a disposable local cluster, uploads the archive and checksum manifest to a separate private S3-compatible bucket, downloads and checks the uploaded bytes, then retains the newest 30 verified copies. Production credentials are held only in Railway variables. The source database is read only during this job.

**Schedule:** `0 22 * * *` UTC = 03:00 Asia/Dushanbe every day.

- [ ] Implement isolated backup Docker image, Python runner, strict retention scope and error handling.
- [ ] Test retention boundaries and failed upload/verification behavior.
- [ ] Configure private bucket and dedicated cron service with reference credentials.
- [ ] Run first backup, verify full restore and stored checksum, confirm cron configuration.
- [ ] Document restore procedure and limits: this covers PostgreSQL, not product images; bucket and database share Railway provider.
