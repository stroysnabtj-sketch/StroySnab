"""Daily read-only PostgreSQL dumps to a dedicated private S3 bucket."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import uuid
from datetime import datetime, timezone
from urllib.parse import parse_qsl, unquote, urlsplit

ARCHIVE = re.compile(r"^postgres/stroysnab-\d{8}T\d{6}Z-[a-f0-9]{8}\.dump$")


def obsolete_archives(objects, keep):
    """Only complete archive/manifest pairs created by this job are eligible."""
    if not isinstance(keep, int) or not 1 <= keep <= 365:
        raise ValueError("BACKUP_KEEP must be between 1 and 365")
    keys = {item["Key"] for item in objects}
    complete = sorted(
        (key for key in keys if ARCHIVE.fullmatch(key) and key + ".json" in keys),
        reverse=True,
    )
    return [key for archive in complete[keep:] for key in (archive, archive + ".json")]


def run(args, *, env=None):
    result = subprocess.run(args, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode:
        # Subprocess output may include connection details. Never log it.
        raise RuntimeError("Backup command failed: " + Path(args[0]).name)
    return result.stdout


def digest_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def source_environment(connection_url):
    parsed = urlsplit(connection_url)
    if parsed.scheme not in ("postgres", "postgresql") or not parsed.hostname or not parsed.path.strip("/"):
        raise RuntimeError("Invalid source database configuration")
    result = {key: value for key, value in os.environ.items() if not key.startswith("PG")}
    result.update(PGHOST=parsed.hostname, PGPORT=str(parsed.port or 5432),
                  PGDATABASE=unquote(parsed.path[1:]), PGUSER=unquote(parsed.username or "postgres"),
                  PGPASSWORD=unquote(parsed.password or ""), PGCONNECT_TIMEOUT="30",
                  PGOPTIONS="-c default_transaction_read_only=on")
    allowed = {"sslmode": "PGSSLMODE", "sslrootcert": "PGSSLROOTCERT", "channel_binding": "PGCHANNELBINDING"}
    for key, value in parse_qsl(parsed.query):
        if key in allowed:
            result[allowed[key]] = value
    return result


def verify_restore(archive, workdir):
    """Restore into an ephemeral local database; never connect restore to production."""
    cluster = workdir / "cluster"
    socket = workdir / "socket"
    socket.mkdir()
    run(["chown", "-R", "postgres:postgres", str(workdir)])
    run(["gosu", "postgres", "initdb", "-D", str(cluster), "--auth=trust", "--no-locale", "--encoding=UTF8"])
    # Remove production credentials from every local restore subprocess.
    local_env = {key: value for key, value in os.environ.items()
                 if not key.startswith(("PG", "DATABASE", "BACKUP_S3", "AWS"))}
    local_env.update(PGHOST=str(socket), PGPORT="55432", PGUSER="postgres", PGDATABASE="postgres")
    run(["gosu", "postgres", "pg_ctl", "-D", str(cluster), "-l", str(workdir / "postgres.log"),
         "-o", "-c listen_addresses='' -k " + str(socket) + " -p 55432", "-w", "start"], env=local_env)
    try:
        run(["pg_restore", "--exit-on-error", "--no-owner", "--no-acl", "--dbname=postgres", str(archive)], env=local_env)
        tables = run(["psql", "-At", "-c", "SELECT count(*) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema')"], env=local_env)
        count = int(tables.strip())
        if count == 0:
            raise RuntimeError("Restored database has no application tables")
        return count
    finally:
        run(["gosu", "postgres", "pg_ctl", "-D", str(cluster), "-m", "immediate", "-w", "stop"], env=local_env)


def publish(s3, bucket, archive, key, manifest, keep):
    """Prune only after upload, round-trip checksum and manifest all succeed."""
    s3.upload_file(str(archive), bucket, key, ExtraArgs={"ContentType": "application/octet-stream"})
    digest = hashlib.sha256()
    body = s3.get_object(Bucket=bucket, Key=key)["Body"]
    size = 0
    try:
        for chunk in body.iter_chunks(chunk_size=1024 * 1024):
            digest.update(chunk)
            size += len(chunk)
    finally:
        body.close()
    if size != manifest["bytes"] or digest.hexdigest() != manifest["sha256"]:
        raise RuntimeError("Stored backup checksum verification failed")
    s3.put_object(Bucket=bucket, Key=key + ".json", Body=json.dumps(manifest).encode(), ContentType="application/json")
    objects = []
    for page in s3.get_paginator("list_objects_v2").paginate(Bucket=bucket, Prefix="postgres/stroysnab-"):
        objects.extend(page.get("Contents", []))
    deleted = 0
    for expired_key in obsolete_archives(objects, keep):
        s3.delete_object(Bucket=bucket, Key=expired_key)
        deleted += 1
    return deleted


def main():
    import boto3
    from botocore.config import Config

    required = ("DATABASE_URL", "BACKUP_S3_ENDPOINT", "BACKUP_S3_BUCKET", "BACKUP_S3_ACCESS_KEY_ID", "BACKUP_S3_SECRET_ACCESS_KEY")
    if any(not os.environ.get(key) for key in required):
        raise RuntimeError("Missing backup configuration")
    keep = int(os.environ.get("BACKUP_KEEP", "30"))
    obsolete_archives([], keep)
    now = datetime.now(timezone.utc)
    key = "postgres/stroysnab-" + now.strftime("%Y%m%dT%H%M%SZ") + "-" + uuid.uuid4().hex[:8] + ".dump"
    s3 = boto3.client("s3", endpoint_url=os.environ["BACKUP_S3_ENDPOINT"],
                      region_name=os.environ.get("BACKUP_S3_REGION", "auto"),
                      aws_access_key_id=os.environ["BACKUP_S3_ACCESS_KEY_ID"],
                      aws_secret_access_key=os.environ["BACKUP_S3_SECRET_ACCESS_KEY"],
                      config=Config(signature_version="s3v4", retries={"max_attempts": 3}))
    with tempfile.TemporaryDirectory(prefix="stroysnab-backup-") as directory:
        workdir = Path(directory)
        archive = workdir / "database.dump"
        dump_env = source_environment(os.environ["DATABASE_URL"])
        run(["pg_dump", "--format=custom", "--no-owner", "--no-acl", "--lock-wait-timeout=30000", "--file", str(archive)], env=dump_env)
        run(["pg_restore", "--list", str(archive)])
        print(json.dumps({"backup": "dump_created"}), flush=True)
        tables = verify_restore(archive, workdir)
        print(json.dumps({"backup": "restore_verified", "restored_tables": tables}), flush=True)
        manifest = {"created_at": now.isoformat(), "key": key, "bytes": archive.stat().st_size,
                    "sha256": digest_file(archive), "restored_tables": tables, "format": "pg_dump-custom", "verified_restore": True}
        removed = publish(s3, os.environ["BACKUP_S3_BUCKET"], archive, key, manifest, keep)
        print(json.dumps({"backup": "verified", **manifest, "expired_objects_removed": removed}), flush=True)
    if os.environ.get("FILE_BACKUP_ENABLED") == "true":
        from file_backup import snapshot_files
        source_keys = ("SOURCE_S3_ENDPOINT", "SOURCE_S3_BUCKET", "SOURCE_S3_ACCESS_KEY_ID", "SOURCE_S3_SECRET_ACCESS_KEY")
        if any(not os.environ.get(key) for key in source_keys):
            raise RuntimeError("Missing file backup configuration")
        if (os.environ["SOURCE_S3_ENDPOINT"].rstrip('/'), os.environ["SOURCE_S3_BUCKET"]) == (os.environ["BACKUP_S3_ENDPOINT"].rstrip('/'), os.environ["BACKUP_S3_BUCKET"]):
            raise RuntimeError("Source and backup bucket must differ")
        source = boto3.client("s3", endpoint_url=os.environ["SOURCE_S3_ENDPOINT"],
            region_name=os.environ.get("SOURCE_S3_REGION", "auto"),
            aws_access_key_id=os.environ["SOURCE_S3_ACCESS_KEY_ID"], aws_secret_access_key=os.environ["SOURCE_S3_SECRET_ACCESS_KEY"],
            config=Config(signature_version="s3v4", retries={"max_attempts": 3}))
        print(json.dumps({"file_backup": snapshot_files(source, os.environ["SOURCE_S3_BUCKET"], s3, os.environ["BACKUP_S3_BUCKET"])}), flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # Avoid provider/connection exceptions containing credentials or personal data.
        print(json.dumps({"backup": "failed", "error_type": type(error).__name__,
                          "step": str(error) if type(error) is RuntimeError else "provider_or_configuration"}), flush=True)
        raise SystemExit(1)
